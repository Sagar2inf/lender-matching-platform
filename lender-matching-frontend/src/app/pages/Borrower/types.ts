export enum EquipmentType {
  MEDICAL = "Medical",
  TRUCKING = "Trucking",
  CNC = "CNC",
  CONSTRUCTION = "Construction",
  AGRICULTURAL = "Agricultural",
  INDUSTRIAL = "Industrial"
}

export enum EquipmentCondition {
  NEW = "new",
  USED = "used"
}

export enum EntityType {
  LLC = "LLC",
  CORP = "Corp",
  SOLE_PROP = "Sole Prop",
  PARTNERSHIP = "Partnership"
}

export enum IndustryTier {
  TIER_1 = 1,
  TIER_2 = 2, 
  TIER_3 = 3  
}

export enum VendorType {
  DEALER = "Dealer",
  PRIVATE_PARTY = "Private Party"
}

export interface BorrowerFormData {
  full_name: string;
  email: string;
  mobile_no: string;
  
  business_name: string;
  dba_name: string;           
  business_state: string;     
  zip_code: string;           
  years_in_business: number;
  business_entity_type: EntityType;
  industry_tier: IndustryTier;
  industry_naics: string;     
  
  annual_revenue: number;
  avg_daily_balance: number;
  nsf_count: number;
  dscr_ratio: number;        
  
  guarantor_fico: number;
  ownership_percentage: number; 
  is_homeowner: boolean;
  paynet_score: number;
  
  has_active_bankruptcy: boolean;
  years_since_bankruptcy_discharge: number; 
  has_unpaid_tax_liens: boolean;
  years_since_last_judgment: number;
  
  loan_amount: number;
  ltv_ratio: number;          
  equipment_type: EquipmentType; 
  equipment_condition: EquipmentCondition;
  equipment_age: number;
  vendor_type: VendorType;
  equipment_location_state: string;
}