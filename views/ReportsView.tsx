
import React, { useMemo, useState } from 'react';
import { db } from '../db';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Plus,
  PiggyBank,
  X,
  Wallet,
  ArrowDownRight
} from 'lucide-react';

type FilterMode = 'today' | 'day' | 'month' | 'year';

const ReportsView: React.FC = () => {
  const allOrders = useMemo(() => db.getOrders(), []);
  const allDebts = useMemo(() => db.getDebts(), []);
  const [allDisbursements, setAllDisbursements] = useState(() => db.getDisbursements());
  
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expComment, setExpComment] = useState('');

  const filteredData = useMemo(() => {
    const filterFn = (itemDate: number) => {
      const d = new Date(itemDate);
      const isoDate = d.toISOString().split('T')[0];
      const isoMonth = d.toISOString().slice(0, 7);
      const year = d.getFullYear();
      if (filterMode === 'today') return isoDate === new Date().toISOString().split('T')[0];
      if (filterMode === 'day') return isoDate === selectedDate;
      if (filterMode === 'month') return isoMonth === selectedMonth;
      if (filterMode === 'year') return year === selectedYear;
      return true;
    };

    const filteredOrders = allOrders.filter(o => filterFn(o.timestamp));
    const filteredExp = allDisbursements.filter(d => filterFn(d.timestamp));
    const filteredDebts = allDebts.filter(d => filterFn(d.timestamp));

    let theoreticalRevenue = 0; // Chiffre d'Affaires (Tout ce qui est vendu)
    let totalCost = 0; // Somme des prix d'achat
    let pendingDebtFromPeriod = 0; // Montant non encore payé sur les ventes de la période

    filteredOrders.forEach(order => {
      theoreticalRevenue += order.total;
      order.items.forEach(item => {
        totalCost += (item.costPrice || 0);
      });
    });

    // On calcule ce qui manque en caisse à cause des dettes créées durant cette période
    filteredDebts.forEach(debt => {
      if (debt.status === 'pending') {
        pendingDebtFromPeriod += (debt.totalAmount - debt.totalPaid);
      }
    });

    const totalExp = filteredExp.reduce((s, e) => s + e.amount, 0);
    
    // BÉNÉFICE NET : (Prix de Vente Total - Prix d'Achat Total) - Dépenses
    // C'est ce que vous avez réellement gagné sur les articles vendus
    const netProfit = (theoreticalRevenue - totalCost) - totalExp;
    
    // ARGENT EN CAISSE : Chiffre d'Affaire - Dettes non payées - Dépenses
    // C'est l'argent liquide que vous avez devant vous
    const cashInHand = theoreticalRevenue - pendingDebtFromPeriod - totalExp;

    return {
      chiffreAffaire: theoreticalRevenue,
      argentEnCaisse: cashInHand,
      beneficeNet: netProfit,
      pendingDebt: pendingDebtFromPeriod,
      totalExp,
      grossMargin: theoreticalRevenue - totalCost // Marge brute simple (Vente - Achat sans les frais)
    };
  }, [allOrders, allDisbursements, allDebts, filterMode, selectedDate, selectedMonth, selectedYear]);

  const handleAddDisbursement = () => {
    if (!expAmount) return;
    const newDisbursement = { 
      id: Math.random().toString(36).substr(2,9), 
      amount: parseFloat(expAmount), 
      comment: expComment, 
      timestamp: Date.now() 
    };
    db.saveDisbursement(newDisbursement);
    setAllDisbursements(prev => [newDisbursement, ...prev]);
    setIsExpModalOpen(false); 
    setExpAmount(''); 
    setExpComment(''); 
  };

  return (
    <div className="p-4 md:mt-20 max-w-4xl mx-auto w-full pb-24">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-black text-slate-800 tracking-tighter">Rapports</h1><p className="text-slate-500 text-sm">Gestion des bénéfices et caisse</p></div>
        <button onClick={() => setIsExpModalOpen(true)} className="bg-red-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-2 font-black active:scale-95 transition-all"><Plus size={20} /> <span className="hidden sm:inline text-xs uppercase">Ajouter Dépense</span></button>
      </div>

      {/* FILTRES */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1 mb-6 overflow-x-auto no-scrollbar">
        {(['today', 'day', 'month', 'year'] as FilterMode[]).map((mode) => (
          <button key={mode} onClick={() => setFilterMode(mode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex-1 transition-all ${filterMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            {mode === 'today' ? "Aujourd'hui" : mode === 'day' ? 'Jour' : mode === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
      </div>

      {/* SÉLECTEURS DE DATE */}
      <div className="mb-8">
        {filterMode === 'day' && <input type="date" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}
        {filterMode === 'month' && <input type="month" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />}
        {filterMode === 'year' && (
          <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold appearance-none outline-none focus:border-indigo-500" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {[0,1,2].map(i => { const y = new Date().getFullYear()-i; return <option key={y} value={y}>{y}</option> })}
          </select>
        )}
      </div>

      {/* BLOC PRINCIPAL : ARGENT EN CAISSE */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden mb-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-indigo-200" /><p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Argent Actuellement en Caisse</p></div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter">{filteredData.argentEnCaisse.toLocaleString()} <span className="text-lg">FCFA</span></h2>
          <div className="flex flex-wrap gap-2">
            <div className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase">Encaissé: {(filteredData.chiffreAffaire - filteredData.pendingDebt).toLocaleString()} F</div>
            <div className="bg-red-500/30 px-3 py-1.5 rounded-xl border border-red-400/30 text-[9px] font-black uppercase">Dépenses: {filteredData.totalExp.toLocaleString()} F</div>
          </div>
        </div>
        <TrendingUp className="absolute -right-4 -bottom-4 text-indigo-500/20 w-40 h-40 -rotate-12" />
      </div>

      {/* GRID DES KPIS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Bénéfice Net (Ce que vous avez vraiment gagné) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm col-span-2">
          <div className="flex items-center justify-between">
             <div>
                <div className="p-3 bg-green-50 text-green-600 w-fit rounded-2xl mb-2"><PiggyBank size={24} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Bénéfice Net Réel</p>
                <p className="text-2xl font-black text-green-600 leading-tight">{filteredData.beneficeNet.toLocaleString()} F</p>
                <p className="text-[9px] text-slate-400 mt-1 italic">(Prix de vente - Prix d'achat - Dépenses)</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">CA Total</p>
                <p className="text-sm font-black text-slate-800">{filteredData.chiffreAffaire.toLocaleString()} F</p>
             </div>
          </div>
        </div>

        {/* Autres métriques */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 w-fit rounded-2xl mb-4"><Wallet size={20} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dettes Clients</p>
          <p className="text-lg font-black text-orange-600 leading-tight">{filteredData.pendingDebt.toLocaleString()} F</p>
          <p className="text-[9px] text-slate-400 mt-2">Sommes non perçues</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 w-fit rounded-2xl mb-4"><ArrowDownRight size={20} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Dépenses</p>
          <p className="text-lg font-black text-red-600 leading-tight">{filteredData.totalExp.toLocaleString()} F</p>
          <p className="text-[9px] text-slate-400 mt-2">Frais divers</p>
        </div>
      </div>

      {isExpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] md:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black tracking-tighter">Enregistrer Sortie</h2><button onClick={() => setIsExpModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button></div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Montant décaissé</label>
                <input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-red-500 font-black outline-none transition-all" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0 FCFA" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Motif de la dépense</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-red-500 font-bold outline-none transition-all" value={expComment} onChange={(e) => setExpComment(e.target.value)} placeholder="Ex: Loyer, Facture, Achat fournitures..." />
              </div>
              <button onClick={handleAddDisbursement} className="w-full bg-red-500 text-white py-6 rounded-[2.5rem] font-black shadow-xl shadow-red-100 active:scale-95 transition-all mt-4 uppercase text-sm">VALIDER LA DÉPENSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
