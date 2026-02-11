from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.core.constants import (
    EntityType, 
    EquipmentCondition, 
    VendorType, 
    IndustryTier, 
    EquipmentType
)

class BorrowerCreate(BaseModel):
    full_name: str
    email: EmailStr
    mobile_no: str
    
    business_name: str
    dba_name: Optional[str] = None
    business_state: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$")
    zip_code: Optional[str] = None
    
    years_in_business: float = Field(..., ge=0)
    business_start_date: Optional[datetime] = None

    business_entity_type: EntityType
    industry_tier: IndustryTier = IndustryTier.TIER_2
    industry_naics: Optional[str] = None

    annual_revenue: float = Field(..., ge=0)
    avg_daily_balance: float = Field(0.0, ge=0)
    nsf_count: int = Field(0, ge=0)
    dscr_ratio: float = Field(1.0, ge=0)

    guarantor_fico: int = Field(..., ge=0)
    ownership_percentage: float = Field(..., ge=0)
    
    has_active_bankruptcy: bool = False
    years_since_bankruptcy_discharge: Optional[float] = None
    
    is_homeowner: bool = False
    has_unpaid_tax_liens: bool = False
    years_since_last_judgment: Optional[float] = None
    paynet_score: Optional[int] = Field(None, ge=0)

    loan_amount: float = Field(..., gt=0)
    ltv_ratio: float = Field(100.0, ge=0)

    equipment_type: EquipmentType
    equipment_condition: EquipmentCondition
    equipment_age: int = Field(0, ge=0)
    
    vendor_type: VendorType = VendorType.DEALER
    equipment_location_state: Optional[str] = Field(None, min_length=2, max_length=2)

class BorrowerResponse(BorrowerCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    success: bool
    message: str
    matches_count: int
    note: Optional[str] = None