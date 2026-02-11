import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { lenderService } from '../../../services/lender_Register';
import BorrowerInfo from "../Borrower/BorrowerInfo";

import { 
  CRITERIA_GROUPS, 
  OPERATORS, 
  type Rule, 
  type Program, 
  type PolicyState 
} from '../../components/items';

// --- Components ---

const TagInput = ({ label, items, onAdd, onRemove, placeholder }: any) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      e.stopPropagation();
      if (input.trim()) {
        onAdd(input);
        setInput('');
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{label}</label>
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
        {(items || []).map((item: string, idx: number) => (
          <span key={idx} className="bg-white border border-slate-200 px-3 py-1 rounded-md text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm">
            {item} 
            <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-4 h-4 flex items-center justify-center transition">×</button>
          </span>
        ))}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none min-w-[120px] text-sm py-1"
          placeholder={placeholder}
        />
      </div>
      <p className="text-[10px] text-slate-400">Press Enter to add</p>
    </div>
  );
};

// --- Main Dashboard ---

const LenderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, lender_id } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const [policy, setPolicy] = useState<PolicyState>({
    lender_name: name,
    excluded_industries: [],
    restricted_states: [],
    programs: [],
    is_active: false
  });

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleBorrowerClick = async (borrowerId: number) => {
    setIsLoadingDetails(true);
    try {
      const details = await lenderService.getBorrowerDetails(lender_id, borrowerId);
      setSelectedBorrower(details);
    } catch (err) {
      console.error("Failed to load details");
    } finally {
      setIsLoadingDetails(false); 
    }
  };

  useEffect(() => {
    if (!lender_id) { 
        navigate('/lender/login'); 
        return; 
    }
    
    const fetchProfile = async () => {
      try {
        const data = await lenderService.getLenderPolicy(lender_id);
        if (data && data.policy) {
            setPolicy({
              lender_name: name,
              excluded_industries: data.policy.excluded_industries || [],
              restricted_states: data.policy.restricted_states || [],
              programs: data.policy.programs || [],
              is_active: data.policy.is_active || false
            });
        }
        const historyData = await lenderService.getPolicyHistory(lender_id);
        setHistory(historyData || []);

        const matchesData = await lenderService.getMatchedBorrowers(lender_id);
        setMatches(matchesData || []);

      } catch (err: any) {
        console.error("Failed to load policy", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [lender_id, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const extracted = await lenderService.uploadPolicyDoc(lender_id, file);
        setPolicy(prev => ({
            ...prev,
            excluded_industries: [...new Set([...prev.excluded_industries, ...(extracted.excluded_industries || [])])],
            restricted_states: [...new Set([...prev.restricted_states, ...(extracted.restricted_states || [])])],
            programs: [...prev.programs, ...(extracted.programs || [])]
        }));
        alert("Policy data merged!");
    } catch (error) {
        alert("Failed to process document.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  }; 

  const addItem = (field: 'excluded_industries' | 'restricted_states', value: string) => {
    if (!value.trim()) return;
    setPolicy(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
  };

  const removeItem = (field: 'excluded_industries' | 'restricted_states', index: number) => {
    setPolicy(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // --- UPDATED: addRule initializes strict to 0 ---
  const addRule = (progIdx: number) => {
    const newProgs = [...policy.programs];
    newProgs[progIdx].rules.push({
        field_name: "guarantor_fico", 
        operator: ">=",
        value: 0,
        failure_reason: "Criteria not met",
        strict: false
    });
    setPolicy({ ...policy, programs: newProgs });
  };

  const removeRule = (progIdx: number, ruleIdx: number) => {
    const newProgs = [...policy.programs];
    newProgs[progIdx].rules = newProgs[progIdx].rules.filter((_, i) => i !== ruleIdx);
    setPolicy({ ...policy, programs: newProgs });
  };

  const updateRule = (progIdx: number, ruleIdx: number, field: keyof Rule | 'strict', val: any) => {
    const newProgs = [...policy.programs];
    newProgs[progIdx].rules[ruleIdx] = { 
        ...newProgs[progIdx].rules[ruleIdx], 
        [field]: val 
    };
    setPolicy({ ...policy, programs: newProgs });
  };

  const updateProgramValue = (progIdx: number, field: keyof Program, val: any) => {
    const newProgs = [...policy.programs];
    newProgs[progIdx] = { ...newProgs[progIdx], [field]: val };
    setPolicy({ ...policy, programs: newProgs });
  };

  const removeProgram = (index: number) => {
    if(window.confirm("Delete this program?")) {
        setPolicy(prev => ({...prev, programs: prev.programs.filter((_, i) => i !== index)}));
    }
  }

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isValid = policy.programs.length > 0;
    const payload = { ...policy, is_active: isValid };

    try {
        await lenderService.updateLenderPolicy(lender_id, payload);
        setPolicy(prev => ({ ...prev, is_active: isValid }));
        alert("Policy updated successfully!");
        const newHistory = await lenderService.getPolicyHistory(lender_id);
        setHistory(newHistory || []);
    } catch (error) {
        alert("Failed to save policy.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!lender_id) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans relative">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lender Portal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Managing: <span className="font-semibold text-slate-900">{name}</span> 
          </p>
        </div>
        <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${policy.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'}`}>
                <span className={`text-sm font-bold ${policy.is_active ? 'text-green-700' : 'text-red-700'}`}>
                    {policy.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
            </div>
            <button onClick={() => setShowHistory(true)} className="text-blue-600 font-medium text-sm hover:underline">History</button>
            <button onClick={() => navigate('/lender/login')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-2 rounded-xl font-medium transition shadow-sm">Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Policy Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Credit Policy</h3>
                <p className="text-slate-400 text-sm">Define global knockouts and specific programs.</p>
              </div>
              <div className="relative">
                  <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition border border-white/10 shadow-lg">
                    {isUploading ? <span className="animate-pulse">Analyzing PDF...</span> : <><span>📄</span> Upload PDF Guidelines</>}
                  </button>
              </div>
            </div>

            <form onSubmit={handleSavePolicy} className="p-8 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TagInput 
                    label="Global Excluded Industries" 
                    items={policy.excluded_industries} 
                    onAdd={(v: string) => addItem('excluded_industries', v)} 
                    onRemove={(i: number) => removeItem('excluded_industries', i)}
                    placeholder="e.g. Cannabis, Firearms..."
                  />
                  <TagInput 
                    label="Restricted States" 
                    items={policy.restricted_states} 
                    onAdd={(v: string) => addItem('restricted_states', v.toUpperCase())} 
                    onRemove={(i: number) => removeItem('restricted_states', i)}
                    placeholder="e.g. NY, CA..."
                  />
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* Programs Section */}
              <div className="space-y-4">
                  <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Lending Programs ({policy.programs.length})</label>
                      <button type="button" onClick={() => setPolicy(prev => ({...prev, programs: [...prev.programs, {program_name: "New Program", min_loan_amount: 0, max_loan_amount: 100000, rules: []}]}))} className="text-blue-600 text-xs font-bold hover:underline">+ Add Manual Program</button>
                  </div>

                  {policy.programs.length === 0 && (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                          No programs defined. Upload a PDF or add one manually.
                      </div>
                  )}

                  {policy.programs.map((prog, pIdx) => (
                      <div key={pIdx} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-slate-50/50">
                          <div className="flex flex-wrap md:flex-nowrap justify-between items-start mb-4 gap-4">
                              <div className="flex-1 min-w-[200px]">
                                  <label className="text-[10px] uppercase text-slate-400 font-bold">Program Name</label>
                                  <input 
                                    className="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none font-bold text-slate-800"
                                    value={prog.program_name}
                                    onChange={(e) => updateProgramValue(pIdx, 'program_name', e.target.value)}
                                  />
                              </div>
                              <div className="w-32">
                                  <label className="text-[10px] uppercase text-slate-400 font-bold">Max Loan ($)</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-mono"
                                    value={prog.max_loan_amount}
                                    onChange={(e) => updateProgramValue(pIdx, 'max_loan_amount', +e.target.value)}
                                  />
                              </div>
                              <button type="button" onClick={() => removeProgram(pIdx)} className="text-slate-400 hover:text-red-500 font-bold text-xl px-2">×</button>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
                                      <tr>
                                          <th className="px-3 py-2">Field Name</th>
                                          <th className="px-3 py-2 w-32">Operator</th>
                                          <th className="px-3 py-2">Value</th>
                                          <th className="px-3 py-2 text-center w-24">Strict</th>
                                          <th className="w-8"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {prog.rules.map((rule, rIdx) => (
                                          <tr key={rIdx}>
                                              <td className="px-2 py-1 min-w-[180px]">
                                                <select 
                                                  className="w-full text-xs font-semibold text-slate-700 bg-transparent outline-none focus:bg-slate-50 rounded px-1 py-1 cursor-pointer"
                                                  value={rule.field_name}
                                                  onChange={(e) => updateRule(pIdx, rIdx, 'field_name', e.target.value)}
                                                >
                                                  {Object.entries(CRITERIA_GROUPS).map(([group, options]) => (
                                                    <optgroup key={group} label={group}>
                                                      {options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                      ))}
                                                    </optgroup>
                                                  ))}
                                                </select>
                                              </td>
                                              <td className="px-2 py-1">
                                                <select 
                                                    className="w-full text-xs font-mono font-bold text-blue-600 bg-transparent outline-none cursor-pointer"
                                                    value={rule.operator}
                                                    onChange={(e) => updateRule(pIdx, rIdx, 'operator', e.target.value)}
                                                >
                                                  {OPERATORS.map(op => (
                                                    <option key={op.value} value={op.value}>{op.label}</option>
                                                  ))}
                                                </select>
                                              </td>
                                              <td className="px-2 py-1">
                                                  <input 
                                                    className="w-full bg-blue-50/30 px-2 py-1 rounded text-slate-700 font-medium text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={String(rule.value)}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const finalVal = !isNaN(Number(val)) && val !== "" ? Number(val) : val;
                                                        updateRule(pIdx, rIdx, 'value', finalVal);
                                                    }}
                                                  />
                                              </td>
                                              
                                              {/* --- UPDATED: Strict Toggle Switch --- */}
                                              <td className="px-2 py-1 text-center">
                                                  <button
                                                      type="button"
                                                      onClick={() => updateRule(pIdx, rIdx, 'strict', (rule.strict === true) ? false : true)}
                                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        rule.strict === true ? 'bg-blue-600' : 'bg-slate-200'
                                                      }`}
                                                  >
                                                      <span className="sr-only">Use strict setting</span>
                                                      <span
                                                          aria-hidden="true"
                                                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                            rule.strict === true? 'translate-x-4' : 'translate-x-0'
                                                          }`}
                                                      />
                                                  </button>
                                              </td>
                                              {/* ----------------------------------- */}

                                              <td className="px-2 py-1 text-center">
                                                <button type="button" onClick={() => removeRule(pIdx, rIdx)} className="text-slate-300 hover:text-red-500 font-bold text-xs">×</button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              <button 
                                type="button" 
                                onClick={() => addRule(pIdx)} 
                                className="w-full text-center py-2 text-xs font-bold text-blue-500 hover:bg-blue-50 transition border-t border-slate-100"
                              >
                                + Add Condition
                              </button>
                          </div>
                      </div>
                  ))}
              </div>

              <button type="submit" disabled={isSaving} className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg ${isSaving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                {isSaving ? "Saving..." : "Save Policy Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Matches */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Live Matches</h3>
            <div className="space-y-4 flex-1">
              {matches.length === 0 ? (
                <p className="text-slate-400 text-sm text-center italic mt-10">No matching borrowers yet.</p>
              ) : (
                matches.map(borrower => (
                  <div 
                    key={borrower.id} 
                    className={`p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition 
                      ${isLoadingDetails ? 'cursor-wait opacity-70' : 'cursor-pointer'}
                    `}
                    onClick={() => !isLoadingDetails && handleBorrowerClick(borrower.borrower_id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{borrower.name}</h4>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          borrower.status.toLowerCase().includes('perfect') ? 'bg-green-100 text-green-700' :
                          borrower.status.toLowerCase().includes('high') ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-200 text-slate-600'
                      }`}>
                        {borrower.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">${borrower.amount.toLocaleString()} requested</p>
                    <p className="text-[11px] text-slate-400 italic">{borrower.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
            <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Version History</h2>
                    <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">✕</button>
                </div>
                
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="text-6xl grayscale opacity-50">📂</div>
                        <div>
                            <p className="text-slate-900 font-bold">No History Yet</p>
                            <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">Previous versions will appear here once saved.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((ver, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-500">{new Date(ver.created_at || Date.now()).toLocaleDateString()}</span>
                                    {idx === 0 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">CURRENT</span>}
                                </div>
                                <div className="text-sm text-slate-700 space-y-1">
                                    <div className="flex justify-between"><span>Programs:</span> <b>{ver.programs?.length || 0}</b></div>
                                    <div className="flex justify-between"><span>Version ID:</span> <span className="font-mono text-xs text-slate-400">{ver.id?.split('-')[0]}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
      {selectedBorrower && (
        <BorrowerInfo 
          borrower={selectedBorrower} 
          onClose={() => setSelectedBorrower(null)} 
        />
      )}
    </div>
  );
};

export default LenderDashboard;