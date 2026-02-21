
import React, { useState } from 'react';
import { Store, ArrowRight } from 'lucide-react';

interface ShopSetupViewProps {
  onComplete: (name: string) => void;
}

const ShopSetupView: React.FC<ShopSetupViewProps> = ({ onComplete }) => {
  const [shopName, setShopName] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white animate-in fade-in duration-500">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-indigo-200 shadow-2xl">
            <Store className="text-white" size={40} />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2 text-center">Nom de votre boutique</h1>
        <p className="text-slate-500 mb-8 text-center">Ce nom apparaîtra sur vos reçus clients.</p>
        
        <div className="space-y-6">
          <input 
            type="text" 
            autoFocus
            placeholder="Ex: Ma Boutique Fashion"
            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-indigo-500 text-lg font-medium text-center transition-all"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          
          <button
            disabled={!shopName.trim()}
            onClick={() => onComplete(shopName.trim())}
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
          >
            COMMENCER
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopSetupView;
