from enum import Enum
from typing import Dict, Any, List

class CriteriaField(str, Enum):
    GUARANTOR_FICO = "guarantor_fico"
    PAYNET_SCORE = "paynet_score"
    YEARS_IN_BUSINESS = "years_in_business"
    ENTITY_TYPE = "business_entity_type"
    IS_HOMEOWNER = "is_homeowner"
    BUSINESS_STATE = "business_state"

    ANNUAL_REVENUE = "annual_revenue"
    AVG_DAILY_BALANCE = "avg_daily_balance"
    NSF_COUNT = "nsf_count"
    DSCR_RATIO = "dscr_ratio"
    INDUSTRY_TIER = "industry_tier"

    HAS_ACTIVE_BANKRUPTCY = "has_active_bankruptcy"
    YEARS_SINCE_BANKRUPTCY = "years_since_bankruptcy_discharge"
    HAS_UNPAID_LIENS = "has_unpaid_tax_liens"
    YEARS_SINCE_JUDGMENT = "years_since_last_judgment"

    LOAN_AMOUNT = "loan_amount"
    LTV_RATIO = "ltv_ratio"
    EQUIPMENT_TYPE = "equipment_type"
    EQUIPMENT_AGE = "equipment_age"
    EQUIPMENT_CONDITION = "equipment_condition"
    VENDOR_TYPE = "vendor_type"


class EntityType(str, Enum):
    LLC = "LLC"
    CORP = "Corp"
    SOLE_PROP = "Sole Prop"
    PARTNERSHIP = "Partnership"

class IndustryTier(int, Enum):
    TIER_1 = 1
    TIER_2 = 2
    TIER_3 = 3

class EquipmentType(str, Enum):
    MEDICAL = "Medical"
    TRUCKING = "Trucking"
    CNC = "CNC"
    CONSTRUCTION = "Construction"
    AGRICULTURAL = "Agricultural"
    INDUSTRIAL = "Industrial"

class EquipmentCondition(str, Enum):
    NEW = "new"
    USED = "used"

class VendorType(str, Enum):
    DEALER = "Dealer"
    PRIVATE_PARTY = "Private Party"


FIELD_METADATA: Dict[CriteriaField, Dict[str, Any]] = {
    CriteriaField.GUARANTOR_FICO: {"label": "Guarantor FICO", "type": "int", "min": 300, "max": 850},
    CriteriaField.PAYNET_SCORE: {"label": "PayNet Score", "type": "int", "min": 0, "max": 100},
    CriteriaField.YEARS_IN_BUSINESS: {"label": "Years in Business", "type": "float", "min": 0},
    CriteriaField.ENTITY_TYPE: {"label": "Entity Type", "type": "enum", "options": [e.value for e in EntityType]},
    CriteriaField.ANNUAL_REVENUE: {"label": "Annual Revenue", "type": "currency"},
    CriteriaField.AVG_DAILY_BALANCE: {"label": "Avg Daily Balance", "type": "currency"},
    CriteriaField.NSF_COUNT: {"label": "NSF Count (Last 3mo)", "type": "int"},
    CriteriaField.DSCR_RATIO: {"label": "DSCR Ratio", "type": "float"},
    CriteriaField.INDUSTRY_TIER: {"label": "Industry Tier", "type": "enum", "options": [e.value for e in IndustryTier]},
    CriteriaField.LOAN_AMOUNT: {"label": "Loan Amount", "type": "currency"},
    CriteriaField.LTV_RATIO: {"label": "LTV Ratio (%)", "type": "float", "max": 100},
    CriteriaField.EQUIPMENT_TYPE: {"label": "Equipment Type", "type": "enum", "options": [e.value for e in EquipmentType]},
    CriteriaField.EQUIPMENT_AGE: {"label": "Equipment Age (Years)", "type": "int"},
    CriteriaField.EQUIPMENT_CONDITION: {"label": "Condition", "type": "enum", "options": [e.value for e in EquipmentCondition]},
    CriteriaField.VENDOR_TYPE: {"label": "Vendor Type", "type": "enum", "options": [e.value for e in VendorType]},
    CriteriaField.BUSINESS_STATE: {"label": "State", "type": "str", "length": 2},
    CriteriaField.IS_HOMEOWNER: {"label": "Is Homeowner", "type": "bool"},
    CriteriaField.HAS_ACTIVE_BANKRUPTCY: {"label": "Has Active Bankruptcy", "type": "bool"},
    CriteriaField.YEARS_SINCE_BANKRUPTCY: {"label": "Years Since BK Discharge", "type": "float"},
    CriteriaField.HAS_UNPAID_LIENS: {"label": "Has Unpaid Tax Liens", "type": "bool"},
    CriteriaField.YEARS_SINCE_JUDGMENT: {"label": "Years Since Last Judgment", "type": "float"},
}

OPERATORS = [">=", "<=", "==", "!=", ">", "<", "in", "not_in"]