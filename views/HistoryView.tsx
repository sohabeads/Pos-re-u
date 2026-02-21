
import React, { useState } from 'react';
import { db } from '../db';
import { Order } from '../types';
import { Search, Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HistoryView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:mt-20 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Commandes</h1>
        <p className="text-slate-500">Historique complet de vos ventes</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Client ou N° de commande..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredOrders.map(order => (
          <Link 
            key={order.id} 
            to={`/receipt/${order.id}`}
            className="block bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">#{order.id}</span>
                <h3 className="font-bold text-slate-800 text-lg">{order.customerName}</h3>
              </div>
              <span className="font-black text-indigo-600">{order.total.toLocaleString()} FCFA</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Calendar size={14} />
                {new Date(order.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold">
                Reçu <ExternalLink size={12} />
              </div>
            </div>
          </Link>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 text-slate-400 italic">
            Aucune commande trouvée.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
