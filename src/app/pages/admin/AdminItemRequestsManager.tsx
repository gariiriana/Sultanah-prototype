import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { db } from '../../../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import MarketplaceOrdersSection from './components/MarketplaceOrdersSection';

const AdminItemRequestsManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [marketplaceOrders, setMarketplaceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceOrders();
  }, []);

  const fetchMarketplaceOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'marketplaceOrders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const ordersData: any[] = [];
      snapshot.forEach(doc => {
        ordersData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setMarketplaceOrders(ordersData);
    } catch (error) {
      console.error('Error fetching marketplace orders:', error);
      toast.error('Gagal memuat data pesanan marketplace');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#D4AF37] mb-4"></div>
          <p className="text-gray-600">Memuat data pesanan marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[#D4AF37]" />
            Pesanan Marketplace
          </h2>
          <p className="text-gray-600 mt-1">Kelola pesanan marketplace jamaah</p>
        </div>
      </div>

      {/* Marketplace Orders Section */}
      <MarketplaceOrdersSection orders={marketplaceOrders} onRefresh={fetchMarketplaceOrders} />
    </div>
  );
};

export default AdminItemRequestsManager;
