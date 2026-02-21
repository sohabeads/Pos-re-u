
import React from 'react';
import { ShieldAlert, LogOut, Clock, CreditCard } from 'lucide-react';

interface SuspendedViewProps {
  type: 'suspended' | 'expired';
  onLogout: () => void;
}

const SuspendedView: React.FC<SuspendedViewProps> = ({ type, onLogout }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl ${
        type === 'suspended' ? 'bg-red-500 shadow-red-100' : 'bg-orange-500 shadow-orange-100'
      }`}>
        {type === 'suspended' ? <ShieldAlert size={48} className="text-white" /> : <Clock size={48} className="text-white" />}
      </div>

      <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">
        {type === 'suspended' ? 'Compte Suspendu' : 'Abonnement Expiré'}
      </h1>
      
      <p className="text-slate-500 max-w-sm mb-10 leading-relaxed">
        {type === 'suspended' 
          ? "Votre accès a été restreint par l'administrateur. Veuillez contacter le support technique pour plus d'informations."
          : "Votre abonnement mensuel est arrivé à son terme. Veuillez procéder au renouvellement pour continuer à gérer votre boutique."}
      </p>

      {type === 'expired' && (
        <div className="bg-indigo-50 p-6 rounded-[2.5rem] w-full max-w-xs mb-8">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Options de Renouvellement</p>
          <div className="space-y-3">
             <div className="flex justify-between items-center bg-white p-3 rounded-2xl">
                <span className="font-bold text-sm">Mensuel</span>
                <span className="font-black text-indigo-600">5 000 F</span>
             </div>
             <div className="flex justify-between items-center bg-white p-3 rounded-2xl border-2 border-indigo-500">
                <span className="font-bold text-sm">À Vie</span>
                <span className="font-black text-indigo-600">200 000 F</span>
             </div>
          </div>
        </div>
      )}

      <button 
        onClick={onLogout}
        className="flex items-center gap-3 text-slate-400 font-black uppercase text-xs hover:text-slate-900 transition-colors"
      >
        <LogOut size={16} />
        Déconnexion
      </button>

      <div className="mt-20">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Support Technique: +225 0102030405</p>
      </div>
    </div>
  );
};

export default SuspendedView;
