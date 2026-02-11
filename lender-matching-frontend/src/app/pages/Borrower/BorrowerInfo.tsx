import React from 'react';

interface BorrowerDetails {
  business_name: string;
  full_name: string;
  business_state: string;
  zip_code: string;
  guarantor_fico: number;
  annual_revenue: number;
  years_in_business: number;
  business_entity_type: string;
  avg_daily_balance: number;
  dscr_ratio: number;
  nsf_count: number;
  has_active_bankruptcy: boolean;
  loan_amount: number;
  equipment_type: string;
  equipment_condition: string;
  equipment_age: number;
  vendor_type: string;
  email: string;
  mobile_no: string;
}

interface BorrowerInfoProps {
  borrower: BorrowerDetails | null;
  onClose: () => void;
}

const BorrowerInfo: React.FC<BorrowerInfoProps> = ({ borrower, onClose }) => {
  if (!borrower) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{borrower.business_name}</h2>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <span>{borrower.full_name}</span> • <span>{borrower.business_state}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">✕</button>
        </div>

        <div className="p-6 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <label className="text-[10px] uppercase font-bold text-blue-500">Credit Score</label>
              <p className="text-2xl font-bold text-slate-800">{borrower.guarantor_fico}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <label className="text-[10px] uppercase font-bold text-green-600">Annual Rev</label>
              <p className="text-xl font-bold text-slate-800">${(borrower.annual_revenue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <label className="text-[10px] uppercase font-bold text-amber-600">Time in Biz</label>
              <p className="text-xl font-bold text-slate-800">{borrower.years_in_business} <span className="text-sm">yrs</span></p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <label className="text-[10px] uppercase font-bold text-purple-600">Entity</label>
              <p className="text-xl font-bold text-slate-800">{borrower.business_entity_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Financials</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">DSCR Ratio</span>
                  <span className="font-medium">{borrower.dscr_ratio}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NSF Count</span>
                  <span className="font-medium">{borrower.nsf_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Bankruptcy</span>
                  <span className={`font-bold ${borrower.has_active_bankruptcy ? 'text-red-600' : 'text-slate-700'}`}>
                    {borrower.has_active_bankruptcy ? "YES" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Equipment</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested</span>
                  <span className="font-bold text-slate-800">${borrower.loan_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize">{borrower.equipment_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age</span>
                  <span className="font-medium">{borrower.equipment_age} Years</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
             <div className="text-xs text-slate-500">
                Contact: <span className="font-mono font-bold text-slate-700">{borrower.email}</span>
             </div>
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition">
                Download PDF Package
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerInfo;