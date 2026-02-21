
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Package, ClipboardList, BarChart3, Wallet } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: ShoppingBag, label: 'Vente' },
    { path: '/products', icon: Package, label: 'Produits' },
    { path: '/history', icon: ClipboardList, label: 'Commandes' },
    { path: '/debts', icon: Wallet, label: 'Dettes' },
    { path: '/reports', icon: BarChart3, label: 'Rapports' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-1 z-50 shadow-lg md:top-0 md:bottom-auto md:h-20">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive(item.path) ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon size={20} className={isActive(item.path) ? 'scale-110 transition-transform' : ''} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
