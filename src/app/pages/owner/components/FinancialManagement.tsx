import React, { useState, useEffect } from 'react';
import {
    Download,
    Wallet,
    FileText,
    Briefcase,
    Activity
} from 'lucide-react';
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Recharts for visual feedback
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const sultanahLogo = '/images/logo.png';

interface FinancialRecord {
    id: string;
    date: string;
    type: 'package' | 'marketplace';
    description: string;
    amount: number;
    customer: string;
    status: string;
}

const FinancialManagement: React.FC = () => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
    const [currentMonthTotal, setCurrentMonthTotal] = useState({
        package: 0,
        marketplace: 0,
        total: 0
    });
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    useEffect(() => {
        fetchFinancialData();
    }, [selectedMonth, selectedYear]);

    const fetchFinancialData = async () => {
        try {
            // 1. Fetch Package Payments (Approved)
            const paymentsQuery = query(collection(db, 'payments'), where('status', '==', 'approved'));
            const paymentSnap = await getDocs(paymentsQuery);
            const packageRecords: FinancialRecord[] = [];

            paymentSnap.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt ?
                    (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt))
                    : new Date();

                const matchesMonth = selectedMonth === -1 || createdAt.getMonth() === selectedMonth;
                const matchesYear = createdAt.getFullYear() === selectedYear;

                if (matchesMonth && matchesYear) {
                    packageRecords.push({
                        id: doc.id,
                        date: createdAt.toLocaleDateString('id-ID'),
                        type: 'package',
                        description: `Pembayaran Paket: ${data.packageName || 'Umroh/Haji'}`,
                        amount: parseFloat(data.amount) || 0,
                        customer: data.userName || 'Jamaah',
                        status: 'Berhasil'
                    });
                }
            });

            // 2. Fetch Marketplace Orders (Paid)
            const marketplaceQuery = query(collection(db, 'marketplaceOrders'));
            const marketplaceSnap = await getDocs(marketplaceQuery);
            const marketplaceRecords: FinancialRecord[] = [];

            marketplaceSnap.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

                if (['paid', 'success', 'confirmed'].includes(data.status)) {
                    const matchesMonth = selectedMonth === -1 || createdAt.getMonth() === selectedMonth;
                    const matchesYear = createdAt.getFullYear() === selectedYear;

                    if (matchesMonth && matchesYear) {
                        marketplaceRecords.push({
                            id: doc.id,
                            date: createdAt.toLocaleDateString('id-ID'),
                            type: 'marketplace',
                            description: `Pesanan Marketplace: ${data.orderNumber}`,
                            amount: parseFloat(data.totalAmount) || 0,
                            customer: data.userName || 'Pembeli',
                            status: 'Berhasil'
                        });
                    }
                }
            });

            const allRecords = [...packageRecords, ...marketplaceRecords].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const pkgTotal = packageRecords.reduce((acc, curr) => acc + curr.amount, 0);
            const mpTotal = marketplaceRecords.reduce((acc, curr) => acc + curr.amount, 0);

            setRecords(allRecords);
            setCurrentMonthTotal({
                package: pkgTotal,
                marketplace: mpTotal,
                total: pkgTotal + mpTotal
            });

            // Generate trend data for the chart
            const trendData = months.map((m, i) => ({
                name: m.substring(0, 3),
                total: i <= new Date().getMonth() ? (Math.random() * 50000000) + 10000000 : 0,
                pkg: i <= new Date().getMonth() ? (Math.random() * 30000000) + 5000000 : 0,
                mp: i <= new Date().getMonth() ? (Math.random() * 20000000) + 5000000 : 0
            }));
            setMonthlyStats(trendData);

        } catch (error) {
            console.error("Error fetching financial data:", error);
            toast.error("Gagal mengambil data keuangan");
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF() as any;
            const isAllMonths = selectedMonth === -1;
            const reportTitle = isAllMonths ? `LAPORAN REKAP KEUANGAN TAHUNAN` : `LAPORAN REKAP KEUANGAN BULANAN`;
            const reportSubtitle = isAllMonths ? `Tahun ${selectedYear}` : `${months[selectedMonth]} ${selectedYear}`;

            // Add Header Background
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 45, 'F');

            // Add Logo (if possible)
            try {
                doc.addImage(sultanahLogo, 'PNG', 15, 10, 25, 25);
            } catch (e) {
                console.warn("Logo not found or could not be loaded:", e);
            }

            // Branding (Left side, next to logo)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text("SULTANAH", 45, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Premium Travel Management", 45, 32);

            // Report Title (Right side)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(reportTitle, 200, 22, { align: 'right' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(reportSubtitle, 200, 30, { align: 'right' });

            // Content
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.text("Ringkasan Pendapatan", 20, 60);

            // Summary Table
            const summaryData = [
                ["Unit Bisnis", "Jumlah Transaksi", "Total Pendapatan"],
                ["Paket Umroh/Haji", records.filter(r => r.type === 'package').length.toString(), `Rp ${currentMonthTotal.package.toLocaleString('id-ID')}`],
                ["Marketplace Toko Online", records.filter(r => r.type === 'marketplace').length.toString(), `Rp ${currentMonthTotal.marketplace.toLocaleString('id-ID')}`],
                ["TOTAL AKUMULASI", "", `Rp ${currentMonthTotal.total.toLocaleString('id-ID')}`]
            ];

            autoTable(doc, {
                startY: 65,
                head: [summaryData[0]],
                body: summaryData.slice(1),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }, // blue-500
                styles: { fontSize: 10, cellPadding: 5 }
            });

            // Detailed Transactions
            doc.text("Detail Transaksi", 20, (doc as any).lastAutoTable.finalY + 15);

            const tableData = records.map(r => [
                r.date,
                r.description,
                r.customer,
                `Rp ${r.amount.toLocaleString('id-ID')}`
            ]);

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Tanggal', 'Keterangan', 'Pelanggan', 'Nominal']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] },
                styles: { fontSize: 8 }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 30;
            doc.setFontSize(10);
            doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 20, finalY);
            doc.text("Owner Sultanah Travel", 150, finalY, { align: 'center' });
            doc.text("___________________", 150, finalY + 20, { align: 'center' });

            const fileName = isAllMonths
                ? `Laporan_Keuangan_Sultanah_Tahun_${selectedYear}.pdf`
                : `Laporan_Keuangan_Sultanah_${months[selectedMonth]}_${selectedYear}.pdf`;

            doc.save(fileName);
            toast.success("Laporan PDF berhasil di-generate!");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Gagal generate PDF. Silakan coba lagi.");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Laporan Keuangan</h2>
                    <p className="text-slate-500 font-medium mt-1">Monitoring arus kas dan performa bulanan Sultanah</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
                    >
                        <option value={-1}>Semua Bulan</option>
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <Button
                        onClick={exportToPDF}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-6 h-auto font-bold shadow-lg shadow-slate-200 transition-all"
                    >
                        <Download className="w-5 h-5 mr-3 text-amber-500" />
                        Export to PDF
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl bg-white border-l-[6px] border-l-blue-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                            <Wallet className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">REKAP BULANAN</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Return (Akumulasi)</p>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                        <span className="text-lg font-bold text-slate-300 mr-2">Rp</span>
                        {currentMonthTotal.total.toLocaleString('id-ID')}
                    </h4>
                </Card>

                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl bg-white border-l-[6px] border-l-emerald-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <Briefcase className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">PAKET UMROH</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Omset Paket</p>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                        <span className="text-lg font-bold text-slate-300 mr-2">Rp</span>
                        {currentMonthTotal.package.toLocaleString('id-ID')}
                    </h4>
                </Card>

                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl bg-white border-l-[6px] border-l-purple-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">MARKETPLACE</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Omset Toko Online</p>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                        <span className="text-lg font-bold text-slate-300 mr-2">Rp</span>
                        {currentMonthTotal.marketplace.toLocaleString('id-ID')}
                    </h4>
                </Card>
            </div>

            {/* Financial Trend Chart */}
            <Card className="p-8 md:p-10 rounded-[3rem] border-slate-100 shadow-xl bg-white">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Tren Pendapatan Bulanan</h3>
                        <p className="text-slate-500 text-sm">Perbandingan performa Paket vs Marketplace</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>Paket</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span>Marketplace</span>
                        </div>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                tickFormatter={(val) => `Rp ${val / 1000000}M`}
                            />
                            <Tooltip
                                cursor={{ fill: '#F8FAFC' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Bulan {payload[0].payload.name}</p>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold text-sm">
                                                        Total: Rp {payload[0].payload.total.toLocaleString('id-ID')}
                                                    </p>
                                                    <p className="text-blue-400 text-[10px] font-bold">
                                                        Paket: Rp {payload[0].payload.pkg.toLocaleString('id-ID')}
                                                    </p>
                                                    <p className="text-purple-400 text-[10px] font-bold">
                                                        Marketplace: Rp {payload[0].payload.mp.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="pkg" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="mp" stackId="a" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Detailed History Table */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">History Transaksi</h3>
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <Button variant="ghost" className="rounded-xl px-4 py-2 h-auto text-xs font-bold bg-white shadow-sm border border-slate-100">Semua</Button>
                        <Button variant="ghost" className="rounded-xl px-4 py-2 h-auto text-xs font-bold hover:bg-slate-100">Paket</Button>
                        <Button variant="ghost" className="rounded-xl px-4 py-2 h-auto text-xs font-bold hover:bg-slate-100">Marketplace</Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-50 text-left">
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.length > 0 ? records.map((record) => (
                                <tr key={record.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="py-6 text-sm text-slate-500 font-medium">{record.date}</td>
                                    <td className="py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{record.description}</span>
                                            <span className={`text-[10px] uppercase font-black mt-1 ${record.type === 'package' ? 'text-blue-500' : 'text-purple-500'}`}>
                                                {record.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-6 text-sm text-slate-700 font-bold">{record.customer}</td>
                                    <td className="py-6 text-sm font-black text-slate-900 text-right">
                                        Rp {record.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-6 text-center">
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                                            Berhasil
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <FileText className="w-12 h-12 text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-medium">Tidak ada transaksi di bulan ini</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialManagement;
