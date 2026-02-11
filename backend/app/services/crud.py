import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.model import Lender, LenderPolicy, Borrower

from app.schemas.borrower import BorrowerCreate
from app.schemas.lender import LenderPolicyCreate 

class LenderCRUD:
    def __init__(self, db: Session):
        self.db = db

    def register_lender(self, name: str, email: str) -> Lender:
        try:
            lender = Lender(name=name, email=email, is_verified=True)
            self.db.add(lender)
            self.db.commit()
            self.db.refresh(lender)
            return lender
        except Exception as e:
            self.db.rollback()
            raise e

    def get_lender_by_email(self, email: str) -> Optional[Lender]:
        return self.db.query(Lender).filter(Lender.email == email).first()

    def get_lender_by_id(self, lender_id: uuid.UUID) -> Optional[Lender]:
        return self.db.query(Lender).filter(Lender.id == lender_id).first()

    
    def get_active_policy(self, lender_id: uuid.UUID) -> Optional[LenderPolicy]:
        return self.db.query(LenderPolicy).filter(
            LenderPolicy.lender_id == lender_id, 
            LenderPolicy.is_active == True
        ).first()

    def get_policy_history(self, lender_id: uuid.UUID) -> List[LenderPolicy]:
        return self.db.query(LenderPolicy).filter(
            LenderPolicy.lender_id == lender_id
        ).order_by(desc(LenderPolicy.updated_at)).all()

    def update_policy(self, lender_id: uuid.UUID, policy_data: LenderPolicyCreate) -> LenderPolicy:
        try:
            self.db.query(LenderPolicy).filter(
                LenderPolicy.lender_id == lender_id,
                LenderPolicy.is_active == True
            ).update({"is_active": False})
            
            data_dict = policy_data.dict() if hasattr(policy_data, 'dict') else policy_data
            
            programs = data_dict.get("programs", [])
            should_be_active = len(programs) > 0

            new_policy = LenderPolicy(
                lender_id=lender_id,
                
                version_name=f"Policy updated on {uuid.uuid4().hex[:8]}",
                is_active=should_be_active,
                
                excluded_industries=data_dict.get("excluded_industries", []),
                restricted_states=data_dict.get("restricted_states", []),
                
                programs=programs 
            )

            self.db.add(new_policy)
            self.db.commit()
            self.db.refresh(new_policy)
            
            return new_policy

        except Exception as e:
            self.db.rollback()
            raise e

    def delete_lender(self, lender_id: uuid.UUID) -> bool:
        try:
            lender = self.get_lender_by_id(lender_id)
            if not lender:
                return False

            self.db.query(LenderPolicy).filter(
                LenderPolicy.lender_id == lender_id
            ).update({"is_active": False})

            lender.is_verified = False
            
            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            raise e

class BorrowerCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def register(self, borrower_data: BorrowerCreate):
        try:
            existing_borrower = self.db.query(Borrower).filter(
                Borrower.email == borrower_data.email
            ).first()

            if existing_borrower:
                for key, value in borrower_data.model_dump().items():
                    setattr(existing_borrower, key, value)
                borrower = existing_borrower
            else:
                borrower = Borrower(**borrower_data.model_dump())
                self.db.add(borrower)

            self.db.commit()
            self.db.refresh(borrower)

            return {"borrower": borrower, "matches_count": 0}
        except Exception as e:
            self.db.rollback()
            raise e 