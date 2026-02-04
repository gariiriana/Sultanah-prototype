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



  const DUMMY_ORDERS = [
    {
      id: 'dummy-1',
      orderNumber: 'ORD-MP-20240201-001',
      userName: 'Hendra Setiawan',
      userEmail: 'hendra.s@example.com',
      items: [
        {
          itemName: 'Kurma Ajwa Al-Madinah (1kg)',
          price: 350000,
          quantity: 2,
          subtotal: 700000,
          image: 'https://images.unsplash.com/photo-1628148967964-b525049b4999?w=300&h=300&fit=crop'
        },
        {
          itemName: 'Air Zamzam (5L)',
          price: 450000,
          quantity: 1,
          subtotal: 450000,
          image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&h=300&fit=crop'
        }
      ],
      totalAmount: 1150000,
      status: 'paid', // confirmed / success
      paymentMethod: 'Midtrans - Gopay',
      paymentProofUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500&h=500&fit=crop',
      createdAt: new Date('2024-02-01T10:30:00').toISOString(),
      notes: 'Tolong packing kayu ya kak untuk air zamzamnya'
    },
    {
      id: 'dummy-2',
      orderNumber: 'ORD-MP-20240202-045',
      userName: 'Siti Aminah',
      userEmail: 'siti.aminah@example.com',
      items: [
        {
          itemName: 'Sajadah Turki Premium',
          price: 1500000,
          quantity: 1,
          subtotal: 1500000,
          image: 'https://images.unsplash.com/photo-1678726558233-a3b092a71d79?w=300&h=300&fit=crop'
        }
      ],
      totalAmount: 1500000,
      status: 'pending',
      paymentMethod: 'Midtrans - BCA Virtual Account',
      paymentProofUrl: '',
      createdAt: new Date('2024-02-02T14:15:00').toISOString(),
      notes: ''
    },
    {
      id: 'dummy-3',
      orderNumber: 'ORD-MP-20240128-099',
      userName: 'Budi Santoso',
      userEmail: 'budi.santoso88@gmail.com',
      items: [
        {
          itemName: 'Parfum Kasturi Kijang',
          price: 250000,
          quantity: 3,
          subtotal: 750000,
          image: 'https://images.unsplash.com/photo-1594035910387-fea4779426e9?w=300&h=300&fit=crop'
        }
      ],
      totalAmount: 750000,
      status: 'paid',
      paymentMethod: 'Midtrans - Credit Card',
      paymentProofUrl: 'https://images.unsplash.com/photo-1556742132-05f3295c5240?w=500&h=500&fit=crop',
      createdAt: new Date('2024-01-28T09:00:00').toISOString(),
      notes: 'Dikirim ke alamat kantor ya'
    },
    {
      id: 'dummy-4',
      orderNumber: 'ORD-MP-20240125-112',
      userName: 'Rina Wati',
      userEmail: 'rina.wati@yahoo.com',
      items: [
        {
          itemName: 'Oleh-oleh Paket Hemat A',
          price: 500000,
          quantity: 5,
          subtotal: 2500000,
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop'
        }
      ],
      totalAmount: 2500000,
      status: 'failed',
      paymentMethod: 'Midtrans - Mandiri Bill',
      paymentProofUrl: '',
      createdAt: new Date('2024-01-25T16:45:00').toISOString(),
      notes: ''
    },
    {
      id: 'dummy-5',
      orderNumber: 'ORD-MP-20240203-007',
      userName: 'Umar Bakri',
      userEmail: 'umar.bakri@example.com',
      items: [
        {
          itemName: 'Baju Koko Modern White',
          price: 350000,
          quantity: 2,
          subtotal: 700000,
          image: 'https://images.unsplash.com/photo-1593032465175-d81f0f53d35b?w=300&h=300&fit=crop'
        },
        {
          itemName: 'Peci Rajut Yaman',
          price: 50000,
          quantity: 2,
          subtotal: 100000,
          image: ''
        }
      ],
      totalAmount: 800000,
      status: 'paid', // Shipped
      paymentMethod: 'Midtrans - ShopeePay',
      paymentProofUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500&h=500&fit=crop',
      createdAt: new Date('2024-02-03T11:20:00').toISOString(),
      notes: ''
    }
  ];

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

      // MERGE DUMMY DATA (Dummy data at the top/bottom based on needs, here merging all)
      const allOrders = [...ordersData, ...DUMMY_ORDERS];

      // Sort again to be sure mostly by date
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setMarketplaceOrders(allOrders);
    } catch (error) {
      console.error('Error fetching marketplace orders:', error);
      toast.error('Gagal memuat data pesanan marketplace');

      // Fallback to dummy data if error/offline
      setMarketplaceOrders(DUMMY_ORDERS);
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
