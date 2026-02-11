import operator
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import LenderPolicy

class MatchingEngine:
    OPERATORS = {
        ">=": operator.ge, "<=": operator.le, "==": operator.eq,
        "in": lambda val, target: val in target,
        "not_in": lambda val, target: val not in target
    }

    def __init__(self, db: Session):
        self.db = db

    def get_matches(self, borrower_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        policies = self.db.query(LenderPolicy).filter_by(is_active=True).all()
        results = []

        for policy in policies:
            match_result = self.evaluate_policy(policy, borrower_profile)
            results.append(match_result)

        return sorted(results, key=lambda x: x["fit_score"], reverse=True)

    def evaluate_policy(self, policy: LenderPolicy, profile: Dict[str, Any]) -> Dict[str, Any]:
        rejection_reasons = []
        is_eligible = True
        score_components = []

        standard_checks = [
            ("min_fico", profile.get("fico")),
            ("min_time_in_business", profile.get("tib_months")),
            ("max_loan_amount", profile.get("loan_amount"))
        ]

        for field, app_val in standard_checks:
            rule_val = getattr(policy, field)
            if rule_val and app_val:
                if field == "max_loan_amount" and app_val > rule_val:
                    is_eligible = False
                    rejection_reasons.append(f"Requested amount ${app_val} exceeds limit of ${rule_val}")
                elif field != "max_loan_amount" and app_val < rule_val:
                    is_eligible = False
                    rejection_reasons.append(f"Profile {field} ({app_val}) is below required {rule_val}")

        if profile.get("state") in (policy.restricted_states or []):
            is_eligible = False
            rejection_reasons.append(f"Lender does not operate in {profile.get('state')}")

        for rule in (policy.custom_rules or []):
            app_val = profile.get(rule['rule_name'].lower())
            if app_val is not None:
                op_func = self.OPERATORS.get(rule['operator'])
                if op_func and not op_func(app_val, rule['value']):
                    if rule['requirement_type'] == "hard_stop":
                        is_eligible = False
                    rejection_reasons.append(rule['description'])

        fit_score = 0
        if is_eligible:
            fit_score = 70 
            if policy.min_fico and profile.get("fico"):
                bonus = min(20, (profile["fico"] - policy.min_fico) // 5)
                fit_score += bonus
        
        return {
            "lender_id": str(policy.lender_id),
            "lender_name": policy.lender.name,
            "eligible": is_eligible,
            "fit_score": fit_score if is_eligible else 0,
            "reasons": rejection_reasons
        }