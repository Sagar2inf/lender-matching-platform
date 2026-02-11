export const CRITERIA_GROUPS = {
  "Credit & Identity": [
    { value: "guarantor_fico", label: "Guarantor FICO" }, // sig
    { value: "paynet_score", label: "PayNet Score" }, // sig
    { value: "years_in_business", label: "Years in Business" }, // sig
    { value: "business_entity_type", label: "Entity Type" }, // strict
    { value: "is_homeowner", label: "Is Homeowner" },  // strict
    { value: "business_state", label: "Business State" }, // strict
  ],
  "Financials": [
    { value: "annual_revenue", label: "Annual Revenue" }, // sig
    { value: "avg_daily_balance", label: "Avg Daily Balance" }, // sig
    { value: "nsf_count", label: "NSF Count" }, //  exp
    { value: "dscr_ratio", label: "DSCR Ratio" }, // sig
    { value: "industry_tier", label: "Industry Tier" },  // strict
  ],
  "Negative Events": [
    { value: "has_active_bankruptcy", label: "Active Bankruptcy" }, // strict
    { value: "years_since_bankruptcy_discharge", label: "Yrs Since Bankruptcy" }, // exp
    { value: "has_unpaid_tax_liens", label: "Unpaid Liens" }, // strict
    { value: "years_since_last_judgment", label: "Yrs Since Judgment" }, // exp
  ],
  "Loan & Asset": [
    { value: "loan_amount", label: "Loan Amount" }, // exp
    { value: "ltv_ratio", label: "LTV Ratio" }, // exp
    { value: "equipment_type", label: "Equipment Type" }, // strict
    { value: "equipment_age", label: "Equipment Age" }, // exp
    { value: "equipment_condition", label: "Condition" }, // strict
    { value: "vendor_type", label: "Vendor Type" }, // strict 
  ]
};

export const OPERATORS = [
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "in", label: "in" },
  { value: "not_in", label: "not in" },
];

export interface Rule {
  field_name: string;
  operator: string;
  value: any;
  failure_reason: string;
  strict: boolean;
}

export interface Program {
  program_name: string;
  min_loan_amount: number;
  max_loan_amount: number;
  rules: Rule[];
}

export interface PolicyState {
  lender_name: string;
  excluded_industries: string[];
  restricted_states: string[];
  programs: Program[];
  is_active: boolean;
}