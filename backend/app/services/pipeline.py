from typing import Dict, Any, List
import re
from app.schemas.lender import Operator

class DataCleaner:
    def __init__(self, extracted_data: Dict[str, Any]):
        self.data = extracted_data

    def normalize(self) -> Dict[str, Any]:
        cleaned = {}

        cleaned["excluded_industries"] = self._ensure_list(self.data.get("excluded_industries"))
        cleaned["restricted_states"] = self._ensure_list(self.data.get("restricted_states"))

        raw_programs = self.data.get("programs", [])
        cleaned_programs = []

        if raw_programs:
            for prog in raw_programs:
                cleaned_prog = self._clean_program(prog)
                if cleaned_prog:
                    cleaned_programs.append(cleaned_prog)
        
        cleaned["programs"] = cleaned_programs
        return cleaned

    def _clean_program(self, prog: Dict[str, Any]) -> Dict[str, Any]:
        if not prog.get("program_name"):
            prog["program_name"] = "Standard Program"

        prog["max_loan_amount"] = self._to_float(prog.get("max_loan_amount"), default=1000000.0)
        prog["min_loan_amount"] = self._to_float(prog.get("min_loan_amount"), default=0.0)

        raw_rules = prog.get("rules", [])
        cleaned_rules = []
        
        for rule in raw_rules:
            if rule.get("field_name") and "value" in rule:
                cleaned_rule = {
                    "field_name": str(rule["field_name"]).strip(),
                    "operator": self._normalize_operator(rule.get("operator")),
                    "value": self._normalize_value(rule["value"]),
                    "failure_reason": rule.get("failure_reason", f"Criterion {rule['field_name']} not met.")
                }
                cleaned_rules.append(cleaned_rule)
        
        prog["rules"] = cleaned_rules
        return prog

    def _normalize_operator(self, op: str) -> str:
        if not op: return ">=" 
        
        op = op.strip().lower()
        mapping = {
            "gte": ">=", "greater_than_or_equal": ">=", ">=": ">=",
            "lte": "<=", "less_than_or_equal": "<=", "<=": "<=",
            "gt": ">", "greater_than": ">", ">": ">",
            "lt": "<", "less_than": "<", "<": "<",
            "eq": "==", "equal": "==", "==": "==", "=": "==",
            "neq": "!=", "not_equal": "!=", "!=": "!=",
            "in": "in", "contains": "in",
            "not_in": "not_in"
        }
        return mapping.get(op, ">=") 

    def _normalize_value(self, val: Any) -> Any:
        if isinstance(val, bool):
            return val
        
        if isinstance(val, (int, float)):
            return val
            
        if isinstance(val, list):
            return val 
            
        if isinstance(val, str):
            if val.isdigit():
                return int(val)
            try:
                return float(val)
            except ValueError:
                pass
                
            if val.lower() == "true": return True
            if val.lower() == "false": return False

        return val

    def _to_float(self, val, default=0.0):
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    def _ensure_list(self, val):
        if val is None: return []
        if isinstance(val, list): return val
        return [str(val)]