
import { Product, Order, User, Disbursement, SubscriptionTransaction, Debt } from './types';

const STORAGE_KEYS = {
  PRODUCTS: 'qpos_products',
  ORDERS: 'qpos_orders',
  USER: 'qpos_user',
  ALL_USERS: 'qpos_all_users',
  DISBURSEMENTS: 'qpos_disbursements',
  SUB_TRANSACTIONS: 'qpos_sub_transactions',
  DEBTS: 'qpos_debts'
};

export const db = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = db.getOrders();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([order, ...orders]));
  },
  getDisbursements: (): Disbursement[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DISBURSEMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveDisbursement: (d: Disbursement) => {
    const list = db.getDisbursements();
    localStorage.setItem(STORAGE_KEYS.DISBURSEMENTS, JSON.stringify([d, ...list]));
  },

  // --- Dettes ---
  getDebts: (): Debt[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
    return data ? JSON.parse(data) : [];
  },
  saveDebts: (debts: Debt[]) => {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  },
  addDebt: (debt: Debt) => {
    const debts = db.getDebts();
    db.saveDebts([debt, ...debts]);
  },
  updateDebt: (updated: Debt) => {
    const debts = db.getDebts();
    db.saveDebts(debts.map(d => d.id === updated.id ? updated : d));
  },
  
  // Récupérer les clients uniques (pour suggestions POS)
  getUniqueCustomers: () => {
    const debts = db.getDebts();
    const orders = db.getOrders();
    const customers = new Map<string, {name: string, phone: string}>();
    
    debts.forEach(d => customers.set(d.customerPhone, {name: d.customerName, phone: d.customerPhone}));
    orders.forEach(o => customers.set(o.customerPhone, {name: o.customerName, phone: o.customerPhone}));
    
    return Array.from(customers.values());
  },

  // --- Auth ---
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (user.role === 'user') {
        const all = db.getAllUsers();
        const exists = all.find(u => u.id === user.id);
        if (!exists) db.saveAllUsers([...all, user]);
        else db.saveAllUsers(all.map(u => u.id === user.id ? user : u));
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },
  updateShopName: (name: string) => {
    const user = db.getUser();
    if (user) {
      const newUser = { ...user, shopName: name };
      db.setUser(newUser);
      return newUser;
    }
    return null;
  },
  getAllUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return data ? JSON.parse(data) : [];
  },
  saveAllUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  },
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => {
    const all = db.getAllUsers();
    const updated = all.map(u => u.id === userId ? { ...u, status } : u);
    db.saveAllUsers(updated);
    const current = db.getUser();
    if (current && current.id === userId) db.setUser({ ...current, status });
  },
  getSubTransactions: (): SubscriptionTransaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUB_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveSubTransaction: (t: SubscriptionTransaction) => {
    const list = db.getSubTransactions();
    localStorage.setItem(STORAGE_KEYS.SUB_TRANSACTIONS, JSON.stringify([t, ...list]));
  },
  getOrderById: (id: string): Order | undefined => {
    return db.getOrders().find(o => o.id === id);
  }
};
