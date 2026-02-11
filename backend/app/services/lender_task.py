from uuid import UUID
from app.database import SessionLocal
from app.models.model import LenderPolicy, LoanMatch
from app.matching_engine.engine import CreditMatchingEngine

def run_matching_service(policy_id: UUID):
    db = SessionLocal()
    engine = CreditMatchingEngine()
    
    try:
        policy = db.query(LenderPolicy).filter(LenderPolicy.id == policy_id).first()
        
        if not policy or not policy.is_active:
            print(f"Skipping matching for inactive/missing Policy {policy_id}")
            return

        matches = engine.run_engine_for_lender(policy, db)

        num_deleted = db.query(LoanMatch).filter(LoanMatch.lender_id == policy.lender_id).delete()
        print(f"Cleaned up {num_deleted} old matches for Lender {policy.lender_id}")

        if matches:
            db.bulk_save_objects(matches)
            print(f"SUCCESS: Policy {policy_id} matched with {len(matches)} borrowers.")
        else:
            print(f"Policy {policy_id} processed. No new matching borrowers found.")
            
        db.commit()
    except Exception as e:
        print(f"CRITICAL ERROR in Lender Matching Service: {e}")
        db.rollback()
        
    finally:
        db.close()