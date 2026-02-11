import React, { useState } from 'react';
import { 
  EquipmentCondition, 
  EntityType, 
  IndustryTier, 
  VendorType, 
  EquipmentType 
} from './types';
import type { BorrowerFormData } from "./types";
import { borrowerService } from '../../../services/borrower_Register';

const BorrowerForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bkDischargeYear, setBkDischargeYear] = useState<string>("");

  const [formData, setFormData] = useState<BorrowerFormData>({
    full_name: '',
    email: '',
    mobile_no: '',

    business_name: '',
    dba_name: '',           
    business_state: '', 
    zip_code: '',           
    years_in_business: 0,
    business_entity_type: EntityType.LLC,
    industry_tier: IndustryTier.TIER_2,
    industry_naics: '',    

    annual_revenue: 0,
    avg_daily_balance: 0,
    nsf_count: 0,
    dscr_ratio: 1.25,       

    guarantor_fico: 700,
    ownership_percentage: 100, 
    paynet_score: 0,
    is_homeowner: false,

    has_active_bankruptcy: false,
    years_since_bankruptcy_discharge: 99, 
    has_unpaid_tax_liens: false,
    years_since_last_judgment: 99,

    loan_amount: 0,
    ltv_ratio: 100,        
    equipment_type: '' as EquipmentType, 
    equipment_condition: EquipmentCondition.NEW,
    equipment_age: 0,
    vendor_type: VendorType.DEALER,
    equipment_location_state: '', 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    const numberFields = [
      'years_in_business', 'annual_revenue', 'avg_daily_balance', 
      'nsf_count', 'guarantor_fico', 'paynet_score', 
      'years_since_last_judgment', 'loan_amount', 'equipment_age',
      'ownership_percentage', 'dscr_ratio', 'ltv_ratio'
    ];
    
    if (numberFields.includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
      return;
    }

    if (name === 'business_state' || name === 'equipment_location_state') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMatchResult(null);

    const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        acc[key] = value === "" ? null : value;
        return acc;
    }, {} as any);

    if (bkDischargeYear) {
      const year = parseInt(bkDischargeYear);
      const currentYear = new Date().getFullYear();
      payload.years_since_bankruptcy_discharge = currentYear - year;
    }

    if (!payload.equipment_type) payload.equipment_type = EquipmentType.TRUCKING;
    

    try {
      const data = await borrowerService.register(payload);
      setMatchResult(data.matches_count); 
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (matchResult !== null) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-10 bg-green-50 border border-green-200 rounded-lg text-center shadow-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-green-800 mb-4">Application Received!</h2>
        <div className="text-5xl font-black text-green-600 mb-6">Searching for Lenders...</div>
        <button onClick={() => setMatchResult(null)} className="px-6 py-2 bg-green-600 text-white font-bold rounded">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-xl rounded-xl mt-10 mb-20">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Full Application</h1>
      <p className="text-gray-500 mb-8">Detailed form to maximize lender matching.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h2 className="section-title">👤 Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="full_name" placeholder="Full Name" className="input-field" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" className="input-field" onChange={handleChange} required />
            <input name="mobile_no" placeholder="Phone" className="input-field" onChange={handleChange} required />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h2 className="section-title">🏢 Business Entity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="business_name" placeholder="Legal Business Name" className="input-field col-span-2" onChange={handleChange} required />
            <input name="dba_name" placeholder="DBA Name (Optional)" className="input-field" onChange={handleChange} />
            
            <input name="business_state" placeholder="State (TX)" maxLength={2} value={formData.business_state} className="input-field uppercase" onChange={handleChange} required />
            <input name="zip_code" placeholder="Zip Code" maxLength={5} className="input-field" onChange={handleChange} />
            <input name="years_in_business" type="number" step="0.1" placeholder="Years in Business" className="input-field" onChange={handleChange} required />
            
            <select name="business_entity_type" className="input-field" onChange={handleChange} value={formData.business_entity_type}>
               {Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            <select name="industry_tier" className="input-field" onChange={handleChange} value={formData.industry_tier}>
               <option value={1}>Tier 1 (Medical, Gov)</option>
               <option value={2}>Tier 2 (Construction, Prof)</option>
               <option value={3}>Tier 3 (Trucking, Retail)</option>
            </select>

            <input name="industry_naics" placeholder="NAICS Code (Optional)" className="input-field" onChange={handleChange} />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h2 className="section-title">💰 Financial Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="label">Revenue ($)</label><input name="annual_revenue" type="number" className="input-field" onChange={handleChange} required /></div>
            <div><label className="label">Avg Balance ($)</label><input name="avg_daily_balance" type="number" className="input-field" onChange={handleChange} required /></div>
            <div><label className="label">NSF (3mo)</label><input name="nsf_count" type="number" className="input-field" onChange={handleChange} /></div>
            <div><label className="label">DSCR Ratio</label><input name="dscr_ratio" type="number" step="0.01" className="input-field" defaultValue={1.25} onChange={handleChange} /></div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h2 className="section-title">🛡️ Credit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="label">FICO Score</label><input name="guarantor_fico" type="number" className="input-field" defaultValue={700} onChange={handleChange} required /></div>
            <div><label className="label">Ownership %</label><input name="ownership_percentage" type="number" max="100" className="input-field" defaultValue={100} onChange={handleChange} required /></div>
            <div><label className="label">PayNet</label><input name="paynet_score" type="number" className="input-field" placeholder="Opt." onChange={handleChange} /></div>
            
            <div className="flex flex-col justify-center space-y-2">
               <div className="flex items-center"><input name="is_homeowner" type="checkbox" className="checkbox" onChange={handleChange} /><label className="ml-2">Homeowner?</label></div>
               <div className="flex items-center"><input name="has_active_bankruptcy" type="checkbox" className="checkbox" onChange={handleChange} /><label className="ml-2 text-red-600">Active BK?</label></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
            <div>
               <label className="label">Year of Discharge (if any)</label>
               <input type="number" placeholder="e.g. 2018" className="input-field" value={bkDischargeYear} onChange={(e) => setBkDischargeYear(e.target.value)} />
            </div>
            <div className="flex items-center mt-6">
              <input name="has_unpaid_tax_liens" type="checkbox" className="checkbox" onChange={handleChange} />
              <label className="ml-2">Unpaid Tax Liens?</label>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h2 className="section-title">🚜 Equipment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Loan Amount ($)</label><input name="loan_amount" type="number" className="input-field" onChange={handleChange} required /></div>
            <div><label className="label">LTV Ratio (%)</label><input name="ltv_ratio" type="number" className="input-field" defaultValue={100} onChange={handleChange} /></div>
            
            <div>
               <label className="label">Equipment Type</label>
               <select name="equipment_type" className="input-field" onChange={handleChange} value={formData.equipment_type} required>
                 <option value="" disabled>Select...</option>
                 {Object.values(EquipmentType).map((type) => <option key={type} value={type}>{type}</option>)}
               </select>
            </div>
            
            <div>
              <label className="label">Condition</label>
              <select name="equipment_condition" className="input-field" onChange={handleChange} value={formData.equipment_condition}>
                <option value={EquipmentCondition.NEW}>New</option>
                <option value={EquipmentCondition.USED}>Used</option>
              </select>
            </div>

            <div>
              <label className="label">Vendor Type</label>
              <select name="vendor_type" className="input-field" onChange={handleChange} value={formData.vendor_type}>
                <option value={VendorType.DEALER}>Dealership</option>
                <option value={VendorType.PRIVATE_PARTY}>Private Party</option>
              </select>
            </div>
            
            <div><label className="label">Age (Years)</label><input name="equipment_age" type="number" className="input-field" onChange={handleChange} /></div>
            <div><label className="label">Location State</label><input name="equipment_location_state" placeholder="If different" maxLength={2} className="input-field uppercase" onChange={handleChange} /></div>
          </div>
        </div>

        <div className="pt-2">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-lg text-white font-bold text-xl shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-800'}`}>
            {isSubmitting ? 'Processing...' : 'Find Matching Lenders'}
          </button>
        </div>
      </form>
      
      <style>{`
        .input-field { width: 100%; padding: 0.75rem; border-radius: 0.375rem; border: 1px solid #d1d5db; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #2563eb; ring: 2px solid #93c5fd; }
        .label { display: block; font-size: 0.75rem; font-weight: 700; color: #6b7280; margin-bottom: 0.25rem; text-transform: uppercase; }
        .section-title { font-size: 1.125rem; font-weight: 700; color: #1e40af; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; }
        .checkbox { height: 1.25rem; width: 1.25rem; color: #2563eb; }
        .uppercase { text-transform: uppercase; }
      `}</style>
    </div>
  );
};

export default BorrowerForm;