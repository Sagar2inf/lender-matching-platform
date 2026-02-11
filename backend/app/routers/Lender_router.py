from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
import random
import shutil
import os

from app.database import get_db
from app.services.crud import LenderCRUD
from app.schemas.lender import LenderPolicyCreate, LenderAccountSchema, VerifyOTPRequest, LoginRequest
from app.services.pipeline import DataCleaner 
from app.services.extractor import extract_policy    
from app.services.email_service import send_email
from app.services.lender_task import run_matching_service
from app.schemas.lender import LenderMatchResponse
from app.models.model import LoanMatch, Borrower, MatchTier
from app.schemas.borrower import BorrowerResponse

router = APIRouter(prefix="/lenders", tags=["Lender Applications"])


@router.post("/register")
async def register_lender(data: LenderAccountSchema, request: Request, db: Session = Depends(get_db)):
    check = LenderCRUD(db).get_lender_by_email(data.email)
    if check:
        return {"status": "failed", "message": "Lender with this email already exists."}

    redis = request.app.state.redis
    otp = random.randint(100000, 999999)

    try:
        await redis.set(f"otp:{data.email}", otp, ex=300) 
        await redis.set(f"lender_name:{data.email}", data.lender_name, ex=300)

        sub = "Your Verification Code"
        body = f"Your OTP for Lender Registration is: {otp}. It is valid for 5 minutes."
        #send_email(data.email, sub, body)

        return {"status": "success", "message": f"OTP sent to {data.email}"}

    except Exception as e:
        await redis.delete(f"otp:{data.email}")
        await redis.delete(f"lender_name:{data.email}")
        print(f"Error: {e}")
        return {"status": "failed", "message": "Failed to process request."}


@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest, request: Request, db: Session = Depends(get_db)):
    redis = request.app.state.redis
    
    stored_otp = await redis.get(f"otp:{data.email}")
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not found.")
    
    # if stored_otp != data.code:
    #     raise HTTPException(status_code=400, detail="Invalid OTP.")
    
    lender_name = await redis.get(f"lender_name:{data.email}")

    await redis.delete(f"otp:{data.email}")
    await redis.delete(f"lender_name:{data.email}")

    try:
        crud = LenderCRUD(db)
        lender = crud.register_lender(lender_name, data.email)

        send_email(data.email, "Welcome!", f"Hi {lender_name}, your account is active.")

        return {
            "status": "success", 
            "message": "Registration complete.", 
            "lender_id": str(lender.id), 
            "name": lender.name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login")
async def login_lender(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    lender = LenderCRUD(db).get_lender_by_email(data.email)
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    
    otp = random.randint(100000, 999999)
    redis = request.app.state.redis
    
    try:
        await redis.set(f"otp:{data.email}", otp, ex=300) 
        #send_email(data.email, "Login OTP", f"Your OTP is: {otp}")
        return {"status": "success", "message": f"OTP sent to {data.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login-verify")
async def login_verify(data: VerifyOTPRequest, request: Request, db: Session = Depends(get_db)):
    redis = request.app.state.redis
    stored_otp = await redis.get(f"otp:{data.email}")
    
    # if stored_otp != data.code:
    #     raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    
    lender = LenderCRUD(db).get_lender_by_email(data.email)
    await redis.delete(f"otp:{data.email}")
    
    return {
        "status": "success", 
        "lender_id": str(lender.id), 
        "name": lender.name
    }



@router.get("/{lender_id}/current-policy")
async def get_current_policy(lender_id: str, db: Session = Depends(get_db)):
    policy = LenderCRUD(db).get_active_policy(lender_id)
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found.")
    
    return {
        "lender_id": lender_id,
        "policy": {
            "policy_id": str(policy.id),
            "version_name": policy.version_name,
            "is_active": policy.is_active,
            "updated_at": policy.updated_at,
            
            "excluded_industries": policy.excluded_industries,
            "restricted_states": policy.restricted_states,
            "programs": policy.programs 
        }
    }


@router.post("/{lender_id}/update-policy")
async def update_lender_policy(
    lender_id: str,
    policy_data: LenderPolicyCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    print(f"Policy Update Received for {lender_id}")
    
    try:
        new_policy = LenderCRUD(db).update_policy(lender_id, policy_data)
        
        status_msg = "ACTIVE" if new_policy.is_active else "INACTIVE (No Programs Defined)"

        background_tasks.add_task(run_matching_service, new_policy.id)

        return {
            "status": "success",
            "message": f"Policy updated. Status: {status_msg}",
            "policy_id": str(new_policy.id),
            "version_name": new_policy.version_name
        }

    except Exception as e:
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lender_id}/policy-history")
async def get_policy_history(lender_id: str, db: Session = Depends(get_db)):
    print("debug-history")
    history = LenderCRUD(db).get_policy_history(lender_id)
    return history



@router.post("/{lender_id}/extract-clean-pdf")
async def extract_and_clean_pdf(lender_id: str, file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        raw_schema = extract_policy(temp_path)
        raw_dict = raw_schema.model_dump(exclude_none=True)
        cleaner = DataCleaner(raw_dict)
        cleaned_data = cleaner.normalize() 
        cleaned_data["lender_name"] = raw_schema.lender_name
        final_policy = LenderPolicyCreate.model_validate(cleaned_data)
        
        return final_policy

    except Exception as e:
        print(f"Extraction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.delete("/{lender_id}")
async def delete_lender(lender_id: str, db: Session = Depends(get_db)):
    success = LenderCRUD(db).delete_lender(lender_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lender not found")
    return {"message": "Lender deactivated successfully"}



@router.get("/{lender_id}/matches", response_model=List[LenderMatchResponse])
def get_lender_matches(lender_id: str, db: Session = Depends(get_db)):
    matches = (
        db.query(LoanMatch)
        .options(joinedload(LoanMatch.borrower)) 
        .filter(
            LoanMatch.lender_id == lender_id,
            LoanMatch.is_active == True
        )
        .order_by(LoanMatch.match_score.desc()) 
        .all()
    )

    results = []
    for match in matches:
        status_label = _map_tier_to_label(match.match_tier)
        
        reason_text = f"Fits '{match.matched_program_name}' program"

        results.append(LenderMatchResponse(
            id=match.id,
            borrower_id=match.borrower_id,
            name=match.borrower.business_name,
            amount=match.borrower.loan_amount,
            status=status_label,
            reason=reason_text
        ))

    return results

def _map_tier_to_label(tier: MatchTier) -> str:
    mapping = {
        MatchTier.PERFECT: "Perfect Match",
        MatchTier.STRONG: "High Match",
        MatchTier.MODERATE: "Moderate Match",
        MatchTier.WEAK: "Potential Fit"
    }
    return mapping.get(tier, "Match")



@router.get("/{lender_id}/borrower/{borrower_id}", response_model=BorrowerResponse)
def get_matched_borrower_details(
    lender_id: str, 
    borrower_id: int, 
    db: Session = Depends(get_db)
):
    match_exists = db.query(LoanMatch).filter(
        LoanMatch.lender_id == lender_id,
        LoanMatch.borrower_id == borrower_id,
        LoanMatch.is_active == True
    ).first()

    if not match_exists:
        raise HTTPException(status_code=403, detail="Access denied. No active match found.")

    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")

    return borrower