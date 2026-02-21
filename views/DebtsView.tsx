
import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { Debt } from '../types';
import { Search, Wallet, HandCoins, User, CheckCircle2, Clock, X, Phone } from 'lucide-react';

const DebtsView: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>(db.getDebts());
  const [search, setSearch] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const filteredDebts = debts.filter(d => 
    d.customerName.toLowerCase().includes(search.toLowerCase()) || 
    d.customerPhone.includes(search)
  );

  const totalToCollect = useMemo(() => 
    debts.filter(d => d.status === 'pending').reduce((s, d) => s + (d.totalAmount - d.totalPaid), 0)
  , [debts]);

  const handleOpenPayModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setIsPayModalOpen(true);
  };

  const handleRegisterPayment = () => {
    if (!selectedDebt || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newPaid = selectedDebt.totalPaid + amount;
    const isSetted = newPaid >= selectedDebt.totalAmount;

    const updated: Debt = {
      ...selectedDebt,
      totalPaid: Math.min(newPaid, selectedDebt.totalAmount),
      status: isSetted ? 'paid' : 'pending',
      lastPaymentDate: Date.now()
    };

    db.updateDebt(updated);
    setDebts(db.getDebts());
    setIsPayModalOpen(false);
  };

  return (
    <div className="p-4 md:mt-20 max-w-4xl mx-auto w-full pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Dettes Clients</h1>
        <p className="text-slate-500 text-sm">Suivez les crédits accordés</p>
      </div>

      <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100 mb-8 relative overflow-hidden">
         <div className="relative z-10">
            <p className="text-orange-200 text-[10px] font-black uppercase tracking-widest mb-1">Total à recouvrir</p>
            <h2 className="text-4xl font-black tracking-tighter">{totalToCollect.toLocaleString()} <span className="text-lg">FCFA</span></h2>
         </div>
         <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 text-orange-500 opacity-20 -rotate-12" />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher un client..." 
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl font-medium outline-none focus:border-orange-400 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
             <HandCoins size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">Aucune dette enregistrée</p>
          </div>
        ) : filteredDebts.map(debt => {
          const remaining = debt.totalAmount - debt.totalPaid;
          const progress = (debt.totalPaid / debt.totalAmount) * 100;

          return (
            <div key={debt.id} className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all shadow-sm ${debt.status === 'paid' ? 'border-green-100' : 'border-slate-50'}`}>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${debt.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        <User size={24} />
                     </div>
                     <div>
                        <h3 className="font-black text-slate-800 text-lg leading-tight">{debt.customerName}</h3>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mt-1">
                           <Phone size={10} /> {debt.customerPhone}
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {debt.status === 'paid' ? 'SOLDEE' : 'EN ATTENTE'}
                     </span>
                     <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">#{debt.id}</p>
                  </div>
               </div>

               <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1.5">
                     <span>Progression du paiement</span>
                     <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <div className={`h-full transition-all duration-1000 ${debt.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }}></div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase">Total</p>
                        <p className="font-black text-slate-800 text-sm">{debt.totalAmount.toLocaleString()} F</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase">Restant</p>
                        <p className="font-black text-orange-600 text-sm">{remaining.toLocaleString()} F</p>
                     </div>
                  </div>
                  {debt.status === 'pending' && (
                    <button 
                      onClick={() => handleOpenPayModal(debt)}
                      className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-orange-100 active:scale-95 transition-all uppercase tracking-widest"
                    >
                      Verser
                    </button>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end md:items-center justify-center">
           <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] md:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter">Encaisser Versement</h2>
                    <p className="text-slate-400 font-bold text-sm">Client: {selectedDebt.customerName}</p>
                 </div>
                 <button onClick={() => setIsPayModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-3xl">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Somme due</p>
                       <p className="font-black text-slate-800">{(selectedDebt.totalAmount - selectedDebt.totalPaid).toLocaleString()} F</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-3xl">
                       <p className="text-[9px] font-black text-green-400 uppercase">Déjà payé</p>
                       <p className="font-black text-green-600">{selectedDebt.totalPaid.toLocaleString()} F</p>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Montant du versement</label>
                    <input 
                      type="number" 
                      className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:border-orange-500 font-black text-xl outline-none" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0 FCFA"
                      autoFocus
                    />
                 </div>

                 <button 
                   onClick={handleRegisterPayment}
                   className="w-full bg-orange-600 text-white py-6 rounded-[2.5rem] font-black shadow-xl shadow-orange-100 active:scale-95 transition-all uppercase tracking-widest"
                 >
                   CONFIRMER LE PAIEMENT
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DebtsView;
