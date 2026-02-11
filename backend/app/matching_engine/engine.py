import math
from typing import List, Optional, Dict, Any
from app.models.model import Borrower, LenderPolicy, LoanMatch, MatchTier

class CreditMatchingEngine:
    def __init__(self):
        self.SCORING_MAX_REVENUE = 5_000_000  
        self.SCORING_MAX_TIB = 10.0   
        
        self.DECAY_SENSITIVITY = 10.0  
        self.SIGMOID_STEEPNESS = 0.5  

    def run_engine_for_borrower(self, borrower: "Borrower", policies: List["LenderPolicy"]) -> List["LoanMatch"]:
        matches = []
        for policy in policies:
            if not self._check_global_policy(borrower, policy):
                continue
            
            best_program_match = self._evaluate_programs(borrower, policy)
            if best_program_match:
                matches.append(best_program_match)
        return matches
    
    def run_engine_for_lender(self, new_policy: "LenderPolicy", db_session) -> List["LoanMatch"]:
        matches = []
        query = db_session.query(Borrower).filter(Borrower.loan_amount > 0)

        if new_policy.restricted_states:
            query = query.filter(Borrower.business_state.notin_(new_policy.restricted_states))
            
        global_min_fico = 0
        if new_policy.programs:
            try:
                min_ficos = []
                for p in new_policy.programs:
                    for rule in p.get('rules', []):
                        if rule.get('field_name') == 'guarantor_fico' and rule.get('operator') == '>=':
                            min_ficos.append(float(rule.get('value')))
                if min_ficos:
                    global_min_fico = min(min_ficos)
            except:
                pass
        
        if global_min_fico > 50:
            query = query.filter(Borrower.guarantor_fico >= (global_min_fico - 50))

        candidate_borrowers = query.yield_per(1000) 

        for borrower in candidate_borrowers:
            if not self._check_global_policy(borrower, new_policy):
                continue

            best_program_match = self._evaluate_programs(borrower, new_policy)
            if best_program_match:
                matches.append(best_program_match)

        return matches

    def _check_global_policy(self, borrower: "Borrower", policy: "LenderPolicy") -> bool:
        """Global filters that apply to the Lender (not specific programs)."""
        if not policy.is_active:
            return False

        restricted_states = policy.restricted_states or []
        if borrower.business_state in restricted_states:
            return False 

        excluded_industries = policy.excluded_industries or []
        if self._is_industry_excluded(borrower.industry_naics, excluded_industries):
            return False

        if borrower.industry_tier and borrower.industry_tier.value in excluded_industries:
            return False 

        return True

    def _evaluate_programs(self, borrower: "Borrower", policy: "LenderPolicy") -> Optional["LoanMatch"]:
        best_score = -1
        best_match = None

        programs = policy.programs if policy.programs else []
        
        for program in programs:
            if not self._check_hard_constraints(borrower, program):
                continue 

            base_score = self._calculate_score(borrower, program.get('weights', {}))

            penalty_multiplier = self._calculate_soft_penalty(borrower, program.get('rules', []))
            
            final_score = base_score * penalty_multiplier

            if final_score > 20 and final_score > best_score:
                best_score = final_score
                tier = self._determine_tier(final_score)
                
                best_match = LoanMatch(
                    lender_id=policy.lender_id,
                    borrower_id=borrower.id,
                    match_score=round(final_score, 2),
                    match_tier=tier,
                    matched_program_name=program.get('program_name', 'Standard'),
                    is_active=True
                )

        return best_match

    def _check_hard_constraints(self, b: "Borrower", program: Dict[str, Any]) -> bool:
        min_amt = program.get('min_loan_amount', 0)
        max_amt = program.get('max_loan_amount', float('inf'))
        
        if b.loan_amount > max_amt or b.loan_amount < min_amt:
            return False

        rules = program.get('rules', [])
        
        for rule in rules:
            if not rule.get('strict', True): 
                continue

            field = rule.get('field_name')
            op = rule.get('operator')
            target_val = rule.get('value')
            
            actual_val = self._get_borrower_value(b, field)
            if actual_val is None: 
                return False 

            if not self._compare_values(actual_val, target_val, op):
                return False 
                
        return True

    def _calculate_soft_penalty(self, b: "Borrower", rules: List[Dict]) -> float:
        multiplier = 1.0
        
        CRITICAL_FIELDS = {
            'has_active_bankruptcy', 'has_unpaid_tax_liens', 'business_state',
            'business_entity_type', 'is_homeowner', 'equipment_type', 
            'vendor_type', 'equipment_condition'
        }
        SIGMOID_FIELDS = {
            'guarantor_fico', 'paynet_score', 'annual_revenue', 
            'avg_daily_balance', 'dscr_ratio', 'years_in_business'
        }
        DECAY_FIELDS = {
            'equipment_age', 'ltv_ratio', 'nsf_count',
            'years_since_bankruptcy_discharge', 'years_since_last_judgment', "loan_amount"
        }

        for rule in rules:
            if rule.get('strict', True): continue 

            field = rule.get('field_name')
            op = rule.get('operator')
            target = rule.get('value')
            actual = self._get_borrower_value(b, field)

            if actual is None or self._compare_values(actual, target, op):
                continue
            
            if field in CRITICAL_FIELDS:
                multiplier *= 0.85 
            
            elif field in SIGMOID_FIELDS:
                multiplier *= self._calculate_sigmoid_penalty(actual, target, op)
            
            elif field in DECAY_FIELDS:
                multiplier *= self._calculate_decay(actual, target, op)
            
            else:
                multiplier *= 1 

        return multiplier

    def _calculate_sigmoid_penalty(self, actual, target, op) -> float:
        try:
            actual = float(actual)
            target = float(target)
        except:
            return 0.5

        k = self.SIGMOID_STEEPNESS
        
        if op in ['>=', '>']:
            midpoint = target * 0.90
            return 1 / (1 + math.exp(-k * (actual - midpoint)))
        elif op in ['<=', '<']:
            midpoint = target * 1.10
            return 1 / (1 + math.exp(k * (actual - midpoint)))
        
        return 1.0

    def _calculate_decay(self, actual, target, op) -> float:
        try:
            actual = float(actual)
            target = float(target)
            if target == 0: target = 1
        except:
            return 0.5

        diff = 0.0
        if op in ['>=', '>'] and actual < target:
            diff = (target - actual) / target
        elif op in ['<=', '<'] and actual > target:
            diff = (actual - target) / target
        elif op == '==':
            diff = abs(actual - target) / target
            
        return max(0.0, math.exp(-self.DECAY_SENSITIVITY * diff))

    def _get_borrower_value(self, b, field):
        val = getattr(b, field, None)
        if hasattr(val, 'value'): return val.value 
        return val

    def _compare_values(self, b_val, r_val, op) -> bool:
        try:
            b_float = float(b_val)
            r_float = float(r_val)
            if op == '==': return abs(b_float - r_float) < 0.001
            if op == '>=': return b_float >= r_float
            if op == '<=': return b_float <= r_float
            if op == '>': return b_float > r_float
            if op == '<': return b_float < r_float
        except:
            b_str = str(b_val)
            if op == '==': return b_str == str(r_val)
            if op == '!=': return b_str != str(r_val)
            if op == 'in': return b_str in [str(v) for v in r_val]
            if op == 'not in': return b_str not in [str(v) for v in r_val]
        return False

    def _calculate_score(self, b: "Borrower", weights: Dict[str, float]) -> float:
        w_fico = weights.get('fico', 0.4)
        w_rev = weights.get('revenue', 0.3)
        w_tib = weights.get('time_in_business', 0.3)
        
        u_fico = self._normalize_linear(b.guarantor_fico, 500, 800)
        u_rev = self._normalize_linear(b.annual_revenue, 0, self.SCORING_MAX_REVENUE)
        u_tib = self._normalize_linear(b.years_in_business, 0, self.SCORING_MAX_TIB)
        
        final_score = (w_fico * u_fico) + (w_rev * u_rev) + (w_tib * u_tib)
        return min(100.0, max(0.0, final_score))

    def _normalize_linear(self, value, min_val, max_val):
        if not value: return 0.0
        if value <= min_val: return 0.0
        if value >= max_val: return 100.0
        return ((value - min_val) / (max_val - min_val)) * 100.0

    def _determine_tier(self, score: float) -> "MatchTier":
        if score >= 90: return MatchTier.PERFECT
        if score >= 75: return MatchTier.STRONG
        if score >= 50: return MatchTier.MODERATE
        return MatchTier.WEAK

    def _is_industry_excluded(self, borrower_naics: str, excluded_list: list) -> bool:
        if not borrower_naics: return False
        str_naics = str(borrower_naics)
        for blocked_code in excluded_list:
            if str_naics.startswith(str(blocked_code)):
                return True
        return False