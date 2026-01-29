import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Wallet, Building2, Smartphone } from 'lucide-react';

interface CommissionWithdrawalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WithdrawalFormData) => Promise<void>;
  maxAmount: number;
  userType: 'alumni' | 'agen';
}

export interface WithdrawalFormData {
  amount: number;
  paymentMethod: 'bank' | 'ewallet';
  // Bank Transfer
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  // E-Wallet
  ewalletProvider?: string;
  ewalletNumber?: string;
  ewalletAccountName?: string;
}

const CommissionWithdrawalForm: React.FC<CommissionWithdrawalFormProps> = ({
  open,
  onClose,
  onSubmit,
  maxAmount,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    paymentMethod: 'bank',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ewalletProvider: '',
    ewalletNumber: '',
    ewalletAccountName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.amount <= 0) {
      return;
    }

    if (formData.amount > maxAmount) {
      return;
    }

    if (formData.paymentMethod === 'bank') {
      if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
        return;
      }
    } else {
      if (!formData.ewalletProvider || !formData.ewalletNumber || !formData.ewalletAccountName) {
        return;
      }
    }

    try {
      setLoading(true);
      await onSubmit(formData);

      // Reset form
      setFormData({
        amount: 0,
        paymentMethod: 'bank',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ewalletProvider: '',
        ewalletNumber: '',
        ewalletAccountName: '',
      });

      onClose();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            Ajukan Pencairan Komisi
          </DialogTitle>
          <DialogDescription>
            Saldo tersedia: <span className="text-green-600 font-semibold">
              Rp {(maxAmount || 0).toLocaleString('id-ID')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Jumlah Pencairan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="Masukkan jumlah"
              min="0"
              max={maxAmount}
              required
              className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
            />
            {formData.amount > maxAmount && (
              <p className="text-sm text-red-600">Jumlah melebihi saldo tersedia</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Metode Pembayaran <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: 'bank' | 'ewallet') => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger className="border-slate-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Transfer Bank
                  </div>
                </SelectItem>
                <SelectItem value="ewallet">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    E-Wallet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Transfer Fields */}
          {formData.paymentMethod === 'bank' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Informasi Rekening Bank
              </h3>

              <div className="space-y-2">
                <Label htmlFor="bankName">
                  Nama Bank <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  required={formData.paymentMethod === 'bank'}
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Nomor Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Masukkan nomor rekening"
                  required={formData.paymentMethod === 'bank'}
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolderName">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="Sesuai dengan rekening bank"
                  required={formData.paymentMethod === 'bank'}
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* E-Wallet Fields */}
          {formData.paymentMethod === 'ewallet' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Informasi E-Wallet
              </h3>

              <div className="space-y-2">
                <Label htmlFor="ewalletProvider">
                  Penyedia E-Wallet <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.ewalletProvider}
                  onValueChange={(value) => setFormData({ ...formData, ewalletProvider: value })}
                >
                  <SelectTrigger className="border-slate-300 focus:border-amber-500 focus:ring-amber-500">
                    <SelectValue placeholder="Pilih e-wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gopay">GoPay</SelectItem>
                    <SelectItem value="ovo">OVO</SelectItem>
                    <SelectItem value="dana">DANA</SelectItem>
                    <SelectItem value="shopeepay">ShopeePay</SelectItem>
                    <SelectItem value="linkaja">LinkAja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ewalletNumber">
                  Nomor E-Wallet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ewalletNumber"
                  value={formData.ewalletNumber}
                  onChange={(e) => setFormData({ ...formData, ewalletNumber: e.target.value })}
                  placeholder="08123456789"
                  required={formData.paymentMethod === 'ewallet'}
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ewalletAccountName">
                  Nama Akun E-Wallet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ewalletAccountName"
                  value={formData.ewalletAccountName}
                  onChange={(e) => setFormData({ ...formData, ewalletAccountName: e.target.value })}
                  placeholder="Sesuai dengan akun e-wallet"
                  required={formData.paymentMethod === 'ewallet'}
                  className="border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              disabled={loading || formData.amount <= 0 || formData.amount > maxAmount}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Ajukan Pencairan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionWithdrawalForm;