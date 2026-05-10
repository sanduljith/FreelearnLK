import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, Youtube } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 border-8 border-slate-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-12 rounded-none border border-slate-200 shadow-[20px_20px_0px_0px_rgba(226,232,240,1)]"
        id="login-card"
      >
        <div className="flex flex-col items-center justify-center mb-8 gap-4">
          <div className="geometric-logo">
            <div className="geometric-logo-inner"></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900 uppercase">Stratum LMS</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Foundations of Digital Art</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <button
            onClick={handleLogin}
            id="google-login-btn"
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-4 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 invert" alt="Google" />
            Establish Identity
          </button>
          
          <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-tight leading-relaxed">
            By accessing this node, you agree to the industrial standard hardware and intellectual property protocols.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
