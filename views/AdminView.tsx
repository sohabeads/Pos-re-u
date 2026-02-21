
import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { User, SubscriptionTransaction } from '../types';
import { Users, DollarSign, ShieldAlert, ShieldCheck, LogOut, Search, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(db.getAllUsers());
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>(db.getSubTransactions());
  const [search, setSearch] = useState('');

  const totalRevenue = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.shopName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    db.updateUserStatus(user.id, newStatus);
    setUsers(db.getAllUsers());
  };

  const handleLogout = () => {
    db.setUser(null);
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto w-full pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Admin Dashboard</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Contrôle Global du Système</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-indigo-200" /><span className="text-[10px] font-black uppercase tracking-widest">Revenus Abonnements</span></div>
          <h2 className="text-3xl font-black">{totalRevenue.toLocaleString()} <span className="text-sm">FCFA</span></h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-400"><Users size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Utilisateurs</span></div>
          <h2 className="text-3xl font-black text-slate-800">{users.length}</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-400"><CreditCard size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Transactions</span></div>
          <h2 className="text-3xl font-black text-slate-800">{transactions.length}</h2>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-lg text-slate-800">Gestion des Comptes</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Boutique</th>
                <th className="px-6 py-4">Abonnement</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.photoUrl} className="w-8 h-8 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-indigo-600">{u.shopName || 'Non configuré'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${
                        u.subscriptionType === 'lifetime' ? 'bg-green-100 text-green-700' : 
                        u.subscriptionType === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {u.subscriptionType === 'lifetime' ? 'À VIE' : u.subscriptionType === 'monthly' ? 'MENSUEL' : 'AUCUN'}
                      </span>
                      {u.lastPaymentDate && (
                        <span className="text-[8px] text-slate-400 mt-1">Depuis le {new Date(u.lastPaymentDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          u.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                        {u.status === 'active' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                        {u.status === 'active' ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
