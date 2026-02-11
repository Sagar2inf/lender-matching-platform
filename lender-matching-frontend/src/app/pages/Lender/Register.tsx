import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { lenderService } from '../../../services/lender_Register';

const LenderRegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const res = await lenderService.register(name, email);
        if(res.status !== 'success' && !res.success) {
            alert(res.message);
            navigate('/lender/login');
        }
        setShowOtpModal(true); 
    } catch (error) {
        alert("Registration failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
        const res = await lenderService.verifyOtp(email, otp.join(''));
        
        if (res.status === 'success' || res.success) { 
            navigate('/lender/dashboard', { 
                state: { 
                    email: email,   
                    name: name,
                    lender_id: res.lender_id
                } 
            });
            
        } else {
            alert("Invalid OTP code. Please try again.");
        }    
    } catch (error) {
        alert("Verification error. Check your code or connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 relative">
      
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 ${showOtpModal ? 'blur-sm scale-[0.98] pointer-events-none' : ''}`}>
        
        <div className="flex h-1.5 w-full bg-slate-100">
          <div className="w-1/3 bg-blue-600 transition-all duration-500"></div>
          <div className="w-2/3 bg-transparent"></div>
        </div>

        <div className="p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lender Registration</h2>
            <p className="text-slate-500 mt-2">Create your account to start matching with borrowers.</p>
          </div>

          <form onSubmit={handleRegistration} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white text-slate-900" 
                placeholder="e.g., Gotham Commercial Capital" required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Work Email</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white text-slate-900" 
                placeholder="name@organization.com" required 
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3">
              {loading ? "Processing..." : "Continue to Verification"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-400">
              Already have a Lender ID? <button onClick={() => navigate('/lender/login')} className="text-blue-600 font-semibold hover:underline">Sign In</button>
            </p>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✉️</div>
              <h3 className="text-xl font-bold text-slate-900">Verify Email</h3>
              <p className="text-slate-500 text-sm mt-2">Enter the code sent to <br/><span className="font-semibold text-slate-800">{email}</span></p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-10 h-12 text-center text-xl font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              ))}
            </div>

            <button 
              onClick={handleVerifyOtp}
              disabled={otp.some(v => !v) || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-200"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            
            <button 
              onClick={() => setShowOtpModal(false)}
              className="w-full mt-4 text-slate-400 text-sm font-medium hover:text-slate-600"
            >
              Cancel and edit email
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-slate-400 text-xs">Secure FinTech Infrastructure • Built with Tailwind v4</p>
    </div>
  );
};

export default LenderRegisterPage;