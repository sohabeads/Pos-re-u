
export interface PriceTier {
  quantity: number;
  totalPrice: number;
}

export interface Variation {
  id: string;
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number; 
  costPrice: number; 
  priceTiers: PriceTier[]; 
  costTiers: PriceTier[];  
  stock: number;
  imageUrl: string;
  hasVariations: boolean;
  variations: Variation[];
  barcode?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number; 
  costPrice: number; 
  quantity: number;
  variationLabel?: string;
}

export interface Order {
  id: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  timestamp: number;
  isDebt?: boolean;
}

export interface Debt {
  id: string;
  orderId?: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  totalPaid: number;
  status: 'pending' | 'paid';
  timestamp: number;
  lastPaymentDate?: number;
}

export interface Disbursement {
  id: string;
  amount: number;
  comment: string;
  timestamp: number;
}

export type UserStatus = 'active' | 'suspended';
export type UserRole = 'admin' | 'user';
export type SubType = 'none' | 'monthly' | 'lifetime';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  shopName?: string;
  role: UserRole;
  status: UserStatus;
  subscriptionType: SubType;
  lastPaymentDate?: number;
}

export interface SubscriptionTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: SubType;
  timestamp: number;
}
