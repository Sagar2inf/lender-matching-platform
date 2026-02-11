from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.borrower import BorrowerCreate, ApplicationResponse
from app.services.crud import BorrowerCRUD
from app.matching_engine.engine import CreditMatchingEngine
from app.services.borrower_task import run_matching_service

router = APIRouter(
    prefix="/borrowers",
    tags=["Borrower Applications"]
)

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_loan_application(
    application_data: BorrowerCreate,
    background_task: BackgroundTasks,
    db: Session = Depends(get_db)
):
    print(application_data)
    borrower_crud = BorrowerCRUD(db)
    try:
        result = borrower_crud.register(application_data)
        
        new_borrower = result["borrower"]

        background_task.add_task(run_matching_service, new_borrower.id)
        return {
            "success": True,
            "message": "Application received. We are now matching you with lenders.",
            "matches_count": 0,
            "borrower_id": new_borrower.id
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred processing your application: {str(e)}"
        )