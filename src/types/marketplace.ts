// ========================================
// MARKETPLACE TYPES - SULTANAH TRAVEL
// ========================================

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'perlengkapan' | 'souvenir' | 'makanan' | 'lainnya';
  image: string; // Base64 or URL
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceOrderItem {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface MarketplaceOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: MarketplaceOrderItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  whatsappNumber: string;
  shippingAddress: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageItem {
  itemName: string;
  quantity: number;
}
