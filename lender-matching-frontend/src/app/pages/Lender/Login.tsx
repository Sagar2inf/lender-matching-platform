import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { lenderService } from '../../../services/lender_Register';

const LenderLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await lenderService.login(email);
      if (res.status === 'success') {
        setShowOtpModal(true);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert("Account not found. Please register first.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await lenderService.loginWithOtp(email, otp.join(''));
      
      if (res.status === 'success' || res.success) {
        navigate('/lender/dashboard', { 
          state: { 
            lender_id: res.lender_id,  
            name: res.name || res.lender_name,
            email: email
          } 
        });
      } else {
        alert("Invalid code.");
      }
    } catch (error) {
      alert("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
      
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 ${showOtpModal ? 'blur-sm scale-[0.98] pointer-events-none' : ''}`}>
        
        <div className="bg-blue-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-blue-100 mt-2">Enter your email to access your dashboard.</p>
        </div>

        <div className="p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Work Email</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400">✉️</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 pl-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white text-slate-900 font-medium" 
                  placeholder="name@organization.com" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
            >
              {loading ? "Sending Code..." : "Send Login Code"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-400">
              New Lender? <button onClick={() => navigate('/lender/register')} className="text-blue-600 font-bold hover:underline">Create Account</button>
            </p>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔓</div>
              <h3 className="text-xl font-bold text-slate-900">Secure Login</h3>
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
              {loading ? "Verifying..." : "Verify & Enter Dashboard"}
            </button>
            
            <button 
              onClick={() => setShowOtpModal(false)}
              className="w-full mt-4 text-slate-400 text-sm font-medium hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <p className="mt-8 text-slate-400 text-xs">Secure Passwordless Authentication</p>
    </div>
  );
};

export default LenderLoginPage;