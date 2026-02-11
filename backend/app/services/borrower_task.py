from app.database import SessionLocal
from app.models.model import Borrower, LenderPolicy, LoanMatch
from app.matching_engine.engine import CreditMatchingEngine

def run_matching_service(borrower_id: int):
    db = SessionLocal()
    engine = CreditMatchingEngine()
    
    try:
        borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
        if not borrower:
            return

        num_deleted = db.query(LoanMatch).filter(LoanMatch.borrower_id == borrower_id).delete()
        
        if num_deleted > 0:
            print(f"Cleaned up {num_deleted} stale matches for Borrower {borrower_id}")

        active_policies = db.query(LenderPolicy).filter(LenderPolicy.is_active == True).all()
        matches = engine.run_engine_for_borrower(borrower, active_policies)

        if matches:
            db.bulk_save_objects(matches)
            print(f"SUCCESS: Matched Borrower {borrower_id} with {len(matches)} lenders.")
        else:
            print(f"Borrower {borrower_id} processed. No matches found.")

        db.commit()

    except Exception as e:
        print(f"Background Task Error: {e}")
        db.rollback()
    finally:
        db.close()