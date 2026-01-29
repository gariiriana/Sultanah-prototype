import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  X,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { db } from '../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface AgentUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  autoCreateReferralCode: (userId: string, email: string) => Promise<boolean>;
}

const AgentUpgradeDialog: React.FC<AgentUpgradeDialogProps> = ({ open, onOpenChange, currentUser, autoCreateReferralCode }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setShowTerms(false);
      setHasScrolledToBottom(false);
      setAcceptedTerms(false);
      setLoading(false);
    }
  }, [open]);

  const handleScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
      // Check if scrolled to bottom (with 10px tolerance)
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAccept = async () => {
    if (!acceptedTerms || !currentUser) {
      return;
    }

    try {
      setLoading(true);

      // ✅ Upgrade user role to agen
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        role: 'agen',
        upgradedToAgenAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      // ✅ Create agent referral document (code will be auto-created)
      const success = await autoCreateReferralCode(
        currentUser.uid,
        currentUser.email || 'unknown@sultanah.com'
      );

      if (!success) {
        toast.error('Gagal membuat kode referral. Silakan hubungi admin.');
        setLoading(false);
        return;
      }

      toast.success('🎉 Selamat! Anda sekarang menjadi Agen Syiar!', {
        description: 'Dashboard Anda akan dimuat ulang untuk menampilkan fitur agen.',
        duration: 4000,
      });

      // ✅ Mark as seen in localStorage so dialog doesn't show again
      localStorage.setItem(`agent-upgrade-seen-${currentUser.uid}`, 'true');

      // ✅ Close dialog
      onOpenChange(false);

      // ✅ Reload to apply role change
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error upgrading to agent:', error);
      toast.error('Gagal upgrade ke agen. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Agent Upgrade Dialog */}
      <Dialog open={open && !showTerms} onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">
              🎉 Selamat! Anda Telah Menjadi Alumni Jamaah Umroh
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Alhamdulillah, perjalanan spiritual Anda telah selesai. Apakah Anda siap untuk membantu orang lain merasakan pengalaman yang sama dengan menjadi <span className="font-bold text-[#D4AF37]">Agen Syiar</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Keuntungan Menjadi Agen Syiar:
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Dapatkan <span className="font-bold">komisi Rp500.000</span> untuk setiap jamaah yang berhasil mendaftar dan membayar menggunakan kode referral Anda</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Kode referral otomatis dibuat sistem (SULTANAH-XXXXX)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Dashboard khusus untuk tracking referral dan komisi real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Bersyiar sambil beramal dan mendapat penghasilan tambahan</span>
                </li>
              </ul>
            </div>

            {/* Warning Section */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-1">Penting!</h4>
                  <p className="text-sm text-orange-800">
                    Sebagai Agen Syiar, Anda harus mematuhi persyaratan, kewajiban, dan larangan yang telah ditetapkan.
                    Pelanggaran akan dikenakan sanksi termasuk pencabutan status agen.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms & Conditions Button */}
            <button
              onClick={() => setShowTerms(true)}
              className="w-full bg-white border-2 border-[#D4AF37] rounded-xl p-4 hover:bg-[#FFF9F0] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-semibold text-gray-900">Baca Syarat & Ketentuan</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
              </div>
            </button>

            {/* Checkbox */}
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Checkbox
                id="accept-terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                disabled={!hasScrolledToBottom}
              />
              <label
                htmlFor="accept-terms"
                className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-900 cursor-pointer'}`}
              >
                {!hasScrolledToBottom ? (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Anda harus membaca Syarat & Ketentuan sampai bawah terlebih dahulu
                  </span>
                ) : (
                  <span>
                    Saya telah membaca dan menyetujui <span className="font-semibold">Syarat & Ketentuan</span> menjadi Agen Syiar
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-300"
            >
              Batalkan
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!acceptedTerms || loading}
              className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acceptedTerms ? '✓ Siap Menjadi Agen!' : 'Baca Syarat & Ketentuan Dulu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#D4AF37]" />
              Syarat & Ketentuan Agen Syiar
            </DialogTitle>
            <DialogDescription>
              Harap baca dengan seksama sebelum menjadi Agen Syiar
            </DialogDescription>
          </DialogHeader>

          <div
            ref={termsRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-6 max-h-[60vh]"
          >
            {/* Kewajiban */}
            <section>
              <h3 className="font-bold text-lg text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Hal-hal yang Harus Dilakukan (Kewajiban)
              </h3>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Verifikasi Data dan Identitas</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen:</strong> Wajib memastikan bahwa data pribadi calon jamaah yang mereka daftarkan adalah valid dan akurat. Semua informasi seperti nama, alamat, nomor telepon, dan email harus sesuai dengan data yang terdaftar di KTP atau identitas lainnya.</li>
                    <li><strong>Jamaah:</strong> Wajib mengisi formulir pendaftaran dengan data yang benar dan memberikan dokumen pendukung seperti KTP, paspor, atau bukti pembayaran.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Menggunakan Kode Referral yang Sah</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen:</strong> Harus memastikan bahwa kode referral yang diberikan kepada calon jamaah adalah valid dan terdaftar dalam sistem. Kode referral tidak boleh digunakan oleh orang yang tidak berhak (misalnya, agen yang tidak terdaftar atau pengguna yang tidak terdaftar sebagai agen).</li>
                    <li><strong>Jamaah:</strong> Wajib menggunakan kode referral yang diberikan oleh agen yang sah, terutama jika mereka ingin mendapatkan keuntungan dari program referral (misalnya, diskon atau insentif lainnya).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Mengikuti Prosedur Pembayaran yang Sah</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Semua pembayaran untuk paket umroh harus dilakukan melalui saluran yang disetujui oleh penyelenggara (misalnya, melalui transfer bank atau metode pembayaran yang terintegrasi dalam sistem).</li>
                    <li><strong>Agen:</strong> Wajib memastikan bahwa bukti transfer diserahkan kepada admin dan terkonfirmasi dengan jelas, termasuk informasi yang sesuai mengenai jumlah pembayaran dan nomor rekening yang digunakan.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Mengunggah Bukti Transfer dengan Benar</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Harus mengunggah bukti transfer yang jelas, dengan detail yang mudah dibaca dan sah, seperti screenshot dari bank atau bukti pembayaran elektronik lainnya. Bukti ini harus menunjukkan rincian transaksi dengan jelas.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">5. Memastikan Kelengkapan Dokumen</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Semua dokumen yang dibutuhkan, seperti fotokopi paspor, visa, dan dokumen lainnya, harus diserahkan sesuai dengan ketentuan yang berlaku. Agen harus membantu jamaah dalam proses pengumpulan dan verifikasi dokumen tersebut.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">6. Menghormati Proses Persetujuan Admin</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Harus menunggu persetujuan dari admin terkait status pendaftaran dan pembayaran. Setelah semua proses diverifikasi, agen dan jamaah harus mengikuti ketentuan dan keputusan yang diberikan oleh admin.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Larangan */}
            <section className="border-t pt-6">
              <h3 className="font-bold text-lg text-red-900 mb-3 flex items-center gap-2">
                <X className="w-5 h-5" />
                Hal-hal yang Dilarang (Larangan)
              </h3>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Menggunakan Kode Referral yang Tidak Sah</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Dilarang menggunakan kode referral yang tidak terdaftar atau tidak sah untuk tujuan pribadi atau keuntungan yang tidak sah. Penggunaan kode referral palsu dapat menyebabkan pencabutan hak komisi atau bahkan pembatalan pendaftaran jamaah.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Memalsukan Data atau Dokumen</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Dilarang memalsukan data pribadi, bukti transfer, atau dokumen lainnya. Jika terbukti memalsukan dokumen, agen atau jamaah akan dikenakan sanksi, termasuk pembatalan pendaftaran atau denda.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Menyebarkan Informasi yang Menyesatkan</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen:</strong> Dilarang memberikan informasi yang salah atau menyesatkan kepada jamaah mengenai paket umroh atau proses pendaftaran. Semua informasi yang diberikan harus jelas dan sesuai dengan ketentuan yang telah ditetapkan.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Melakukan Pembayaran Tidak Sah</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Dilarang melakukan pembayaran di luar saluran yang telah disetujui, seperti menggunakan metode pembayaran tidak resmi atau melakukan transfer langsung ke rekening pribadi tanpa melalui sistem yang terintegrasi.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">5. Mendapatkan Komisi Tanpa Melakukan Referral yang Sah</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen:</strong> Dilarang menerima komisi tanpa melakukan referral yang sah. Jika agen menerima komisi dari referral yang tidak valid, komisi tersebut akan dibatalkan dan agen tersebut dapat dikenakan tindakan lebih lanjut.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">6. Menunda Pengunggahan Bukti Transfer</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen dan Jamaah:</strong> Dilarang menunda-nunda dalam mengunggah bukti transfer atau dokumen yang diperlukan. Pengunggahan bukti transfer yang tidak tepat waktu dapat menyebabkan keterlambatan dalam proses persetujuan dan pencairan komisi.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">7. Memanipulasi Data untuk Keuntungan Pribadi</h4>
                  <ul className="space-y-1 ml-4 list-disc list-inside">
                    <li><strong>Agen:</strong> Dilarang memanipulasi data jamaah atau informasi pembayaran untuk mendapatkan keuntungan pribadi atau keuntungan yang tidak sah, termasuk memalsukan jumlah jamaah atau pembayaran.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Sanksi */}
            <section className="border-t pt-6">
              <h3 className="font-bold text-lg text-orange-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Penegakan Aturan & Sanksi
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Sanksi dan Tindakan:</strong> Pihak yang melanggar aturan ini (baik agen atau jamaah) akan dikenakan sanksi, yang dapat berupa pembatalan pendaftaran, pencabutan hak komisi, atau bahkan tindakan hukum lebih lanjut jika ditemukan pelanggaran yang lebih serius.
                </p>
                <p>
                  <strong>Pemantauan Sistem:</strong> Semua tindakan yang dilakukan oleh agen dan jamaah akan dipantau secara transparan dalam sistem. Setiap aktivitas akan dicatat dan dapat diperiksa oleh admin untuk memastikan kepatuhan terhadap ketentuan yang berlaku.
                </p>
              </div>
            </section>

            {/* Scroll indicator */}
            {!hasScrolledToBottom && (
              <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 text-center">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold"
                >
                  <span>Scroll ke bawah untuk melanjutkan</span>
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </motion.div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 px-6 pb-6">
            <Button
              onClick={() => setShowTerms(false)}
              className="w-full bg-[#D4AF37] hover:bg-[#C5A572] text-white"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentUpgradeDialog;