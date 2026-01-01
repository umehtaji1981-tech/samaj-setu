
import React, { useState } from 'react';
import { User, SansthaSettings } from '../types';
import { Phone, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  settings: SansthaSettings;
}

const Login: React.FC<Props> = ({ onLogin, settings }) => {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      // For demo purposes, we don't actually send an SMS
      alert(`Your Login OTP is: 1234`);
    }, 1000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (mode === 'admin') {
        if (otp === 'admin123') { // Simple hardcoded admin password
          onLogin({ id: 'admin-1', mobile: 'admin', role: 'Admin', name: 'Administrator' });
        } else {
          setError('Invalid Admin Password (Try: admin123)');
        }
      } else {
        if (otp === '1234') { // Simple hardcoded user OTP
          onLogin({ id: crypto.randomUUID(), mobile, role: 'User' });
        } else {
          setError('Invalid OTP (Try: 1234)');
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-orange-600 p-8 text-center text-white relative">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10"></div>
           {settings.logoUrl ? (
             <img src={settings.logoUrl} className="w-20 h-20 mx-auto rounded-full bg-white p-1 mb-4 shadow-lg object-contain" />
           ) : (
             <div className="w-20 h-20 mx-auto rounded-full bg-white text-orange-600 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">
               {settings.name.charAt(0)}
             </div>
           )}
           <h1 className="text-2xl font-bold relative z-10">{settings.name}</h1>
           <p className="text-orange-100 text-sm relative z-10">Member Portal Login</p>
        </div>

        {/* Toggle Mode */}
        <div className="flex border-b">
          <button 
            onClick={() => { setMode('user'); setStep('input'); setMobile(''); setOtp(''); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'user' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Family Member
          </button>
          <button 
            onClick={() => { setMode('admin'); setStep('input'); setMobile(''); setOtp(''); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'admin' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Admin Access
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
           {step === 'input' ? (
             <form onSubmit={handleSendOtp} className="space-y-6">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {mode === 'user' ? 'Mobile Number' : 'Admin Username'}
                 </label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     {mode === 'user' ? <Phone className="text-gray-400" size={18} /> : <ShieldCheck className="text-gray-400" size={18} />}
                   </div>
                   <input 
                     type={mode === 'user' ? "tel" : "text"}
                     value={mobile}
                     onChange={(e) => setMobile(e.target.value)}
                     className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-all"
                     placeholder={mode === 'user' ? "Enter 10 digit number" : "admin"}
                     required
                   />
                 </div>
               </div>
               
               {error && <p className="text-red-500 text-sm">{error}</p>}

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-orange-700 transition-transform active:scale-95 flex justify-center items-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
               </button>
             </form>
           ) : (
             <form onSubmit={handleVerify} className="space-y-6">
               <div className="text-center mb-6">
                 <p className="text-gray-600 text-sm">Enter the code sent to</p>
                 <p className="font-bold text-gray-800 text-lg">{mobile}</p>
                 <button type="button" onClick={() => setStep('input')} className="text-orange-600 text-xs hover:underline mt-1">Change Number</button>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {mode === 'user' ? 'OTP Verification Code' : 'Password'}
                 </label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Lock className="text-gray-400" size={18} />
                   </div>
                   <input 
                     type={mode === 'user' ? "number" : "password"}
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                     className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-all tracking-widest"
                     placeholder={mode === 'user' ? "1234" : "********"}
                     required
                   />
                 </div>
               </div>

               {error && <p className="text-red-500 text-sm">{error}</p>}

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-orange-700 transition-transform active:scale-95 flex justify-center items-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
               </button>
             </form>
           )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
           Protected by SamajSetu Secure Login
        </div>
      </div>
    </div>
  );
};

export default Login;
