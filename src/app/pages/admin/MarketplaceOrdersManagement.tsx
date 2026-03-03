import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    ShoppingBag, Search, CheckCircle, Clock, Package, Eye,
    ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { MarketplaceOrder } from '../../../types';

const statusConfig = {
    pending: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    bayar: { label: 'Sudah Dibayar', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
    selesai: { label: 'Pesanan Selesai', color: 'bg-green-100 text-green-800 border-green-200', icon: Package },
};

const MarketplaceOrdersManagement: React.FC = () => {
    const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
    const [filtered, setFiltered] = useState<MarketplaceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'bayar' | 'selesai'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => { fetchOrders(); }, []);
    useEffect(() => { filterOrders(); }, [orders, searchTerm, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'marketplaceOrders'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MarketplaceOrder[];
            setOrders(data);
        } catch (err) {
            console.error('Error fetching marketplace orders:', err);
            toast.error('Gagal memuat data pesanan marketplace');
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        let result = [...orders];
        if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.userName.toLowerCase().includes(t) ||
                o.userEmail.toLowerCase().includes(t) ||
                o.orderNumber.toLowerCase().includes(t) ||
                o.items.some(i => i.itemName.toLowerCase().includes(t))
            );
        }
        setFiltered(result);
    };

    const handleUpdateStatus = async (order: MarketplaceOrder, newStatus: 'pending' | 'bayar' | 'selesai') => {
        setUpdating(true);
        try {
            const orderRef = doc(db, 'marketplaceOrders', order.id);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedByAdmin: 'Admin',
                updatedAt: new Date().toISOString(),
            });
            toast.success(`Status pesanan ${order.orderNumber} berhasil diubah ke "${statusConfig[newStatus].label}"`);
            fetchOrders();
            setShowDetail(false);
        } catch (err) {
            console.error('Error updating order status:', err);
            toast.error('Gagal mengubah status pesanan');
        } finally {
            setUpdating(false);
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        bayar: orders.filter(o => o.status === 'bayar').length,
        selesai: orders.filter(o => o.status === 'selesai').length,
    };

    const formatDate = (d: any) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                                <ShoppingBag className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Pesanan Marketplace</h1>
                                <p className="text-white/90 text-sm mt-0.5">Kelola pesanan item marketplace dari jamaah</p>
                            </div>
                        </div>
                        <Button onClick={fetchOrders} variant="ghost" className="text-white hover:bg-white/20">
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Pesanan', value: stats.total, color: 'bg-blue-100 text-blue-600' },
                        { label: 'Menunggu', value: stats.pending, color: 'bg-yellow-100 text-yellow-600' },
                        { label: 'Sudah Bayar', value: stats.bayar, color: 'bg-blue-100 text-blue-600' },
                        { label: 'Selesai', value: stats.selesai, color: 'bg-green-100 text-green-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                        >
                            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Cari nama jamaah, email, nomor pesanan, atau item..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'pending', 'bayar', 'selesai'] as const).map(s => (
                                <Button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    variant={statusFilter === s ? 'default' : 'outline'}
                                    className={statusFilter === s ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : ''}
                                    size="sm"
                                >
                                    {s === 'all' ? 'Semua' : statusConfig[s]?.label || s}
                                </Button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Orders List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
                >
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Memuat pesanan...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pesanan</h3>
                            <p className="text-gray-500">Pesanan dari jamaah akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filtered.map((order, index) => {
                                const isExpanded = expandedId === order.id;
                                const StatusIcon = statusConfig[order.status]?.icon || Clock;
                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">No. Pesanan</p>
                                                            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{order.items.length} item</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Jamaah</p>
                                                            <p className="font-medium text-gray-900 truncate">{order.userName}</p>
                                                            <p className="text-xs text-gray-500 truncate">{order.userEmail}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Total</p>
                                                            <p className="font-bold text-emerald-600">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                                                            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Status</p>
                                                            <Badge className={`${statusConfig[order.status]?.color} border`}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {statusConfig[order.status]?.label}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <Button
                                                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setSelectedOrder(order); setShowDetail(true); }}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Detail
                                                    </Button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-4 pt-4 border-t border-gray-100"
                                                >
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">ITEM YANG DIPESAN:</p>
                                                    <div className="space-y-2">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                                                <span className="text-gray-800">{item.itemName}</span>
                                                                <div className="flex gap-4 text-gray-600">
                                                                    <span>x{item.quantity}</span>
                                                                    <span className="font-semibold">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Detail & Update Status Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Pesanan {selectedOrder?.orderNumber}</DialogTitle>
                        <DialogDescription>
                            Dari: {selectedOrder?.userName} • {selectedOrder?.userEmail}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 mb-3">ITEM YANG DIPESAN</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{item.itemName} <span className="text-gray-400">x{item.quantity}</span></span>
                                            <span className="font-semibold text-gray-900">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                        <span>Total</span>
                                        <span className="text-emerald-600">Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Status Saat Ini</p>
                                <Badge className={`${statusConfig[selectedOrder.status]?.color} border text-sm px-3 py-1`}>
                                    {statusConfig[selectedOrder.status]?.label}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Ubah Status Pesanan</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['pending', 'bayar', 'selesai'] as const).map(s => (
                                        <Button
                                            key={s}
                                            onClick={() => handleUpdateStatus(selectedOrder, s)}
                                            disabled={updating || selectedOrder.status === s}
                                            variant={selectedOrder.status === s ? 'default' : 'outline'}
                                            size="sm"
                                            className={selectedOrder.status === s ? 'bg-emerald-600 text-white' : ''}
                                        >
                                            {statusConfig[s].label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MarketplaceOrdersManagement;
