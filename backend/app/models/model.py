import uuid
import enum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Float, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, relationship

from app.core.constants import (
    EntityType, 
    EquipmentCondition, 
    VendorType, 
    IndustryTier, 
    EquipmentType
)

Base = declarative_base()

class MatchTier(str, enum.Enum):
    PERFECT = "perfect"     
    STRONG = "strong"       
    MODERATE = "moderate"   
    WEAK = "weak"          

class LoanMatch(Base):
    __tablename__ = "loan_matches"

    id = Column(Integer, primary_key=True, index=True)

    lender_id = Column(UUID(as_uuid=True), ForeignKey("lenders.id"), nullable=False)
    borrower_id = Column(Integer, ForeignKey("borrowers.id"), nullable=False)

    match_score = Column(Float) 
    match_tier = Column(SQLEnum(MatchTier), nullable=False, index=True)
    matched_program_name = Column(String, nullable=True) 

    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True) 

    lender = relationship("Lender", back_populates="matches")
    borrower = relationship("Borrower", back_populates="matches")


class Lender(Base):
    __tablename__ = "lenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    policies = relationship("LenderPolicy", back_populates="lender", cascade="all, delete-orphan")
    matches = relationship("LoanMatch", back_populates="lender", cascade="all, delete-orphan")

class LenderPolicy(Base):
    __tablename__ = "lender_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lender_id = Column(UUID(as_uuid=True), ForeignKey("lenders.id"), nullable=False)
    
    version_name = Column(String) 
    is_active = Column(Boolean, default=True, index=True)

    excluded_industries = Column(JSONB, server_default='[]')
    restricted_states = Column(JSONB, server_default='[]')

    programs = Column(JSONB, server_default='[]', nullable=False)
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    lender = relationship("Lender", back_populates="policies")


class Borrower(Base):
    __tablename__ = "borrowers"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    mobile_no = Column(String, nullable=False)
    
    business_name = Column(String, nullable=False)
    dba_name = Column(String, nullable=True)
    
    business_state = Column(String(2), nullable=False) 
    zip_code = Column(String(10), nullable=True)
    
    years_in_business = Column(Float, nullable=False) 
    business_start_date = Column(DateTime, nullable=True) 

    business_entity_type = Column(SQLEnum(EntityType), nullable=True)

    industry_tier = Column(SQLEnum(IndustryTier), nullable=True, default=IndustryTier.TIER_2)
    industry_naics = Column(String, nullable=True)

    annual_revenue = Column(Float, nullable=False) 
    
    avg_daily_balance = Column(Float, default=0.0) 
    
    nsf_count = Column(Integer, default=0) 
    
    dscr_ratio = Column(Float, default=1.0) 

    guarantor_fico = Column(Integer, nullable=False) 

    ownership_percentage = Column(Float, nullable=False, default=100.0)
    
    is_homeowner = Column(Boolean, default=False) 
    
    has_active_bankruptcy = Column(Boolean, default=False) 
    
    years_since_bankruptcy_discharge = Column(Float, nullable=True) 

    has_unpaid_tax_liens = Column(Boolean, default=False)

    years_since_last_judgment = Column(Float, nullable=True)

    paynet_score = Column(Integer, nullable=True)
    
    loan_amount = Column(Float, nullable=False) 
    
    ltv_ratio = Column(Float, default=100.0) 

    equipment_type = Column(SQLEnum(EquipmentType), nullable=False) 
    
    equipment_age = Column(Integer, default=0) 

    equipment_condition = Column(SQLEnum(EquipmentCondition), nullable=False) 
    
    vendor_type = Column(SQLEnum(VendorType), default=VendorType.DEALER)

    equipment_location_state = Column(String(2), nullable=True)

    matches = relationship("LoanMatch", back_populates="borrower", cascade="all, delete-orphan")