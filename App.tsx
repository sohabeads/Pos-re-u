
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { db } from './db';
import { User } from './types';
import LoginView from './views/LoginView';
import POSView from './views/POSView';
import ProductsView from './views/ProductsView';
import HistoryView from './views/HistoryView';
import ReceiptView from './views/ReceiptView';
import ReportsView from './views/ReportsView';
import AdminView from './views/AdminView';
import SuspendedView from './views/SuspendedView';
import DebtsView from './views/DebtsView';
import BottomNav from './components/BottomNav';
import ShopSetupView from './views/ShopSetupView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(db.getUser());
  const navigate = useNavigate();
  const location = useLocation();

  const isReceiptPage = location.pathname.startsWith('/receipt');
  
  // Vérification de l'abonnement
  const isSubscriptionActive = (u: User) => {
    if (u.role === 'admin') return true;
    if (u.subscriptionType === 'lifetime') return true;
    if (u.subscriptionType === 'monthly' && u.lastPaymentDate) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      return (Date.now() - u.lastPaymentDate) < thirtyDaysInMs;
    }
    return false;
  };

  const isSuspended = user?.status === 'suspended';
  const isExpired = user && user.role === 'user' && !isSubscriptionActive(user);
  
  const showNav = user && user.shopName && !isReceiptPage && !isSuspended && !isExpired;

  useEffect(() => {
    const updatedUser = db.getUser();
    if (updatedUser && (updatedUser.status !== user?.status || updatedUser.subscriptionType !== user?.subscriptionType)) {
      setUser(updatedUser);
    }

    if (!user && !isReceiptPage && location.pathname !== '/login') {
      navigate('/login');
    } else if (user && !user.shopName && !isReceiptPage && location.pathname !== '/setup-shop' && user.role !== 'admin') {
      navigate('/setup-shop');
    }
  }, [user, navigate, location.pathname, isReceiptPage]);

  const handleLogin = (u: User) => {
    db.setUser(u);
    setUser(u);
    if (u.role === 'admin') navigate('/admin');
    else if (!u.shopName) navigate('/setup-shop');
    else navigate('/');
  };

  const handleShopSetup = (name: string) => {
    const updatedUser = db.updateShopName(name);
    setUser(updatedUser);
    navigate('/');
  };

  if (user && isSuspended && !isReceiptPage) {
    return <SuspendedView type="suspended" onLogout={() => { db.setUser(null); setUser(null); navigate('/login'); }} />;
  }

  if (user && isExpired && !isReceiptPage) {
    return <SuspendedView type="expired" onLogout={() => { db.setUser(null); setUser(null); navigate('/login'); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0 md:pt-0">
      <Routes>
        <Route path="/login" element={<LoginView onLogin={handleLogin} />} />
        <Route path="/setup-shop" element={user ? <ShopSetupView onComplete={handleShopSetup} /> : <Navigate to="/login" />} />
        
        {/* User Routes */}
        <Route path="/" element={user && user.shopName ? <POSView /> : <Navigate to="/login" />} />
        <Route path="/products" element={user && user.shopName ? <ProductsView /> : <Navigate to="/login" />} />
        <Route path="/history" element={user && user.shopName ? <HistoryView /> : <Navigate to="/login" />} />
        <Route path="/debts" element={user && user.shopName ? <DebtsView /> : <Navigate to="/login" />} />
        <Route path="/reports" element={user && user.shopName ? <ReportsView /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={user?.role === 'admin' ? <AdminView /> : <Navigate to="/login" />} />
        
        {/* Public Routes */}
        <Route path="/receipt/:orderId" element={<ReceiptView />} />
      </Routes>
      
      {showNav && <BottomNav />}
    </div>
  );
};

export default App;
