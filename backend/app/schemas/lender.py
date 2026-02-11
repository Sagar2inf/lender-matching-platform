from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from enum import Enum
from typing import List, Optional, Any, Annotated
from app.models.model import MatchTier


from app.core.constants import CriteriaField 

def sanitize_criteria_field(v: Any) -> Any:
    if isinstance(v, str) and v.startswith("CriteriaField."):
        try:
            member_name = v.split(".")[-1]
            return CriteriaField[member_name].value
        except KeyError:
            return v
    return v

class Operator(str, Enum):
    GTE = ">="
    LTE = "<="
    EQ = "=="
    NEQ = "!="
    IN = "in"
    NOT_IN = "not_in"

class Rule(BaseModel):
    field_name: Annotated[CriteriaField, BeforeValidator(sanitize_criteria_field)] = Field(
        ..., 
        description="The specific criteria variable to check (e.g., 'guarantor_fico', 'annual_revenue')"
    )
    
    operator: Operator
    value: Any = Field(..., description="Threshold value (e.g., 600, 100000, 'Medical')")
    failure_reason: str = Field(..., description="Message to show if this fails")
    strict: bool = Field(default=False, description="If true, borrower must explicitly meet this criterion. If false, it may be considered a soft constraint.")

class LendingProgram(BaseModel):
    program_name: str = Field(..., description="e.g., 'Core - A Tier', 'App Only'")
    
    rules: List[Rule] = Field(default_factory=list)
    
    max_loan_amount: float
    min_loan_amount: float = 0

class LenderPolicyCreate(BaseModel):
    lender_name: str
    
    excluded_industries: List[str] = Field(default_factory=list)
    restricted_states: List[str] = Field(default_factory=list)
    min_time_in_business_months_global: Optional[int] = Field(
        None, description="Absolute minimum across all programs"
    )

    programs: List[LendingProgram] = Field(default_factory=list)

class LenderAccountSchema(BaseModel):
    lender_name: str = Field(..., min_length=2, description="Legal name of the lending institution")
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="The 6-digit OTP code")

class LoginRequest(BaseModel):
    email: EmailStr


class LenderMatchResponse(BaseModel):
    id: int               
    borrower_id: int      
    name: str             
    amount: float        
    status: str          
    reason: str          
    
    class Config:
        from_attributes = True