
import React from 'react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    const mockUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: 'Vendeur QuickPOS',
      email: 'vendeur@example.com',
      photoUrl: 'https://picsum.photos/seed/user/100',
      role: 'user',
      status: 'active',
      subscriptionType: 'monthly',
      lastPaymentDate: Date.now()
    };
    onLogin(mockUser);
  };

  const handleAdminLogin = () => {
    const adminUser: User = {
      id: 'admin_1',
      name: 'Administrateur',
      email: 'admin@quickpos.com',
      photoUrl: 'https://picsum.photos/seed/admin/100',
      role: 'admin',
      status: 'active',
      subscriptionType: 'lifetime'
    };
    onLogin(adminUser);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center shadow-indigo-100 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">QuickPOS</h1>
        <p className="text-slate-500 mb-12 text-sm font-medium">Gérez vos ventes et envoyez vos reçus par WhatsApp en un clic.</p>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-4 px-4 rounded-[1.5rem] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs uppercase"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            Accès Vendeur
          </button>

          <button
            onClick={handleAdminLogin}
            className="w-full bg-slate-900 text-white py-4 px-4 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest"
          >
            Accès Administration
          </button>
        </div>
        
        <p className="mt-12 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          Version 2.0 - 2024
        </p>
      </div>
    </div>
  );
};

export default LoginView;
