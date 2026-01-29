import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Upload,
  MessageCircle,
  AlertCircle,
  ArrowLeft,
  Package,
  CreditCard,
  Image as ImageIcon,
  CheckCircle
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { MarketplaceItem } from '../../../types/marketplace';
import imageCompression from 'browser-image-compression';

interface CartItem {
  item: MarketplaceItem;
  quantity: number;
}

const MarketplaceCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Get cart data from location state
    const state = location.state as { cartItems: CartItem[]; totalAmount: number } | null;

    if (!state || !state.cartItems || state.cartItems.length === 0) {
      toast.error('Keranjang kosong');
      navigate('/marketplace');
      return;
    }

    setCartItems(state.cartItems);
    setTotalAmount(state.totalAmount);
  }, [location.state, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Allow up to 10MB for compression
        toast.error('Ukuran file maksimal 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }

      // Show compression progress
      const compressToast = toast.loading('Mengompres gambar...');

      try {
        // Compress image before storing
        const options = {
          maxSizeMB: 1, // Max 1MB after compression
          maxWidthOrHeight: 1920, // Max dimension
          useWebWorker: true,
          fileType: 'image/jpeg' as const
        };

        const compressedFile = await imageCompression(file, options);

        toast.dismiss(compressToast);
        toast.success(`✓ Ukuran dikurangi ${Math.round((1 - compressedFile.size / file.size) * 100)}%`);

        setPaymentProof(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        toast.dismiss(compressToast);
        console.error('Compression error:', error);
        toast.error('Gagal mengompres gambar, menggunakan gambar original');

        // Fallback to original file
        setPaymentProof(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleContactCS = () => {
    const orderDetails = cartItems.map(({ item, quantity }) =>
      `- ${item.name} (${quantity}x) = Rp ${(item.price * quantity).toLocaleString('id-ID')}`
    ).join('\n');

    const message = `🛍️ *Permintaan Pembayaran Marketplace*\n\nHalo Admin, saya ingin melakukan pembayaran untuk pesanan berikut:\n\n${orderDetails}\n\n💰 *Total: Rp ${totalAmount.toLocaleString('id-ID')}*\n\n👤 Nama: ${userProfile?.displayName || userProfile?.email}\n📧 Email: ${userProfile?.email}\n\nMohon informasi rekening untuk pembayaran. Terima kasih!`;

    const whatsappUrl = `https://wa.me/6281234700116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `MPO-${timestamp}-${random}`;
  };

  const handleSubmitPayment = async () => {
    if (!paymentProof) {
      toast.error('Silakan upload bukti pembayaran');
      return;
    }

    setUploading(true);

    try {
      // ✅ SIMPLIFIED: Use Base64 directly (no Firebase Storage dependency)
      // This is more reliable and doesn't require Storage rules configuration
      console.log('📤 Converting payment proof to Base64...');
      const reader = new FileReader();
      const paymentProofUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          console.log('✅ Base64 conversion complete');
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.error('❌ Base64 conversion failed');
          reject(new Error('Gagal memproses file'));
        };
        reader.readAsDataURL(paymentProof);
      });

      console.log('📝 Creating order data...');
      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order data
      const orderData = {
        orderNumber,
        userId: userProfile?.id || userProfile?.email,
        userEmail: userProfile?.email,
        userName: userProfile?.displayName || userProfile?.email,
        items: cartItems.map(({ item, quantity }) => ({
          itemId: item.id,
          itemName: item.name, // ✅ FIXED: Changed from 'name' to 'itemName' (match admin read)
          price: item.price,
          quantity,
          subtotal: item.price * quantity,
          image: item.image || '' // ✅ FIXED: Changed from 'imageUrl' to 'image' (match admin read)
        })),
        totalAmount,
        paymentProofUrl: paymentProofUrl, // ✅ FIXED: Changed from 'paymentProof' to 'paymentProofUrl' (match admin read)
        paymentProofFileName: paymentProof.name,
        notes,
        status: 'pending',
        deliveryAddress: '', // ✅ Add delivery address (can be optional for now)
        phoneNumber: userProfile?.phoneNumber || '', // ✅ Add phone number
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Saving to Firestore...');
      console.log('Order Number:', orderNumber);
      console.log('Total Amount:', totalAmount);
      console.log('Items count:', cartItems.length);

      // Save to Firestore
      await addDoc(collection(db, 'marketplaceOrders'), orderData);

      console.log('✅ Order saved successfully!');
      toast.success('✅ Bukti pembayaran berhasil dikirim!');
      setShowSuccessModal(true);

      // ✅ UPDATED: Redirect to unified Pesanan page (not marketplace)
      // User can see all their orders (Umroh payments + Marketplace orders) in one place
      navigate('/marketplace'); // ✅ Redirect back to marketplace

    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      toast.error('Gagal mengirim bukti pembayaran. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/marketplace')}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Marketplace
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Pembayaran Marketplace
          </h1>
          <p className="text-purple-100 text-sm mt-1">Selesaikan pembayaran Anda</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Important Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-lg">📢 Penting! Cara Pembayaran</h3>
              <ol className="text-blue-800 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[24px]">1️⃣</span>
                  <span>Klik tombol <strong>"Hubungi CS untuk Pembayaran"</strong> di bawah untuk mendapatkan nomor rekening</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[24px]">2️⃣</span>
                  <span>Lakukan transfer ke rekening yang diberikan oleh CS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[24px]">3️⃣</span>
                  <span>Setelah transfer, <strong>upload bukti pembayaran</strong> di halaman ini</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold min-w-[24px]">4️⃣</span>
                  <span>Admin akan memverifikasi pembayaran Anda</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Ringkasan Pesanan
            </h2>

            <div className="space-y-3 mb-6">
              {cartItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')} x {quantity}</p>
                    <p className="text-purple-600 font-bold text-sm mt-1">
                      Rp {(item.price * quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-bold text-lg">Total Pembayaran:</span>
                <span className="text-2xl font-bold text-purple-600">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Contact CS Button */}
            <Button
              onClick={handleContactCS}
              className="w-full mt-6 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hubungi CS untuk Pembayaran
            </Button>
          </div>

          {/* Payment Proof Upload */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Upload Bukti Pembayaran
            </h2>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="payment-proof" className="text-sm font-semibold mb-2 block">
                  Bukti Transfer <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-all cursor-pointer bg-gray-50">
                  <input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    {previewUrl ? (
                      <div>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg shadow-md mb-3"
                        />
                        <p className="text-sm text-green-600 font-semibold">✓ File dipilih</p>
                        <p className="text-xs text-gray-500 mt-1">Klik untuk mengganti</p>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">Klik untuk upload</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max. 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
                  Catatan (Opsional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk admin..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitPayment}
                disabled={!paymentProof || uploading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Kirim Bukti Pembayaran
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Dengan mengirim bukti pembayaran, Anda menyetujui bahwa informasi yang diberikan adalah benar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Berhasil!</h3>
              <p className="text-gray-600 mb-6">
                Bukti pembayaran Anda telah dikirim. Admin akan memverifikasi pembayaran dalam 1x24 jam.
              </p>
              <Button
                onClick={() => navigate('/marketplace')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Kembali ke Marketplace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceCheckout;