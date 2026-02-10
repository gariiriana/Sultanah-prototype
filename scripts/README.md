# Sultanah Umroh - Dummy Data Script

Script ini akan membuat data dummy yang terintegrasi untuk Owner Dashboard dan Admin Panel.

## Data yang Dibuat

### 1. **Mutawwif** (2 users)
- Email: `mutawwif1@sultanah.com` & `mutawwif2@sultanah.com`
- Password: `Mutawwif123!`
- Masing-masing punya **3 group booking** dengan total jamaah berbeda
- Data bisa dilihat di **User Management** → Detail → **Riwayat Bimbingan**

### 2. **Tour Leader** (2 users)
- Email: `tourleader1@sultanah.com` & `tourleader2@sultanah.com`
- Password: `TourLeader123!`
- Masing-masing punya **4 group booking** dengan total jamaah berbeda
- Data bisa dilihat di **User Management** → Detail → **Riwayat Bimbingan**

### 3. **Influencer** (1 user)
- Email: `influencer1@sultanah.com`
- Password: `Influencer123!`
- **8 referral bookings** dengan komisi 5%
- Data bisa dilihat di **User Management** → Detail → **Order Statistics & Referral Commission**

### 4. **Affiliator** (1 user)
- Email: `affiliator1@sultanah.com`
- Password: `Affiliator123!`
- **12 referral bookings** dengan komisi 6%
- Data bisa dilihat di **User Management** → Detail → **Order Statistics & Referral Commission**

### 5. **Brand Ambassador** (1 user)
- Email: `ba1@sultanah.com`
- Password: `BrandAmbassador123!`
- **15 referral bookings** dengan komisi 7%
- Data bisa dilihat di **User Management** → Detail → **Order Statistics & Referral Commission**

## Cara Menggunakan

### 1. Install Dependencies
```bash
cd scripts
npm install
```

### 2. Jalankan Script
```bash
npm run populate-dummy
```

### 3. Cek Hasilnya
1. Login sebagai **Owner** di aplikasi
2. Buka **User Management**
3. Filter berdasarkan role (Mutawwif, Tour Leader, Influencer, dll)
4. Klik **Detail** pada user untuk melihat:
   - **Mutawwif/Tour Leader**: Riwayat Bimbingan (total group & jamaah)
   - **Influencer/Affiliator/BA**: Order Statistics & Referral Commission

## Catatan Penting

✅ **Data terintegrasi dengan Admin Panel** - Semua data bisa dilihat di Owner Dashboard dan Admin Panel

✅ **Realistic Data** - Tanggal booking random dalam 6 bulan terakhir

✅ **Referral Tracking** - Komisi otomatis dihitung dan disimpan

⚠️ **Jalankan Sekali Saja** - Jika dijalankan lagi, akan error karena email sudah ada (kecuali user dihapus dulu)

## Troubleshooting

Jika ada error `auth/email-already-in-use`:
- User sudah dibuat sebelumnya
- Hapus user dari Firebase Console atau gunakan email berbeda

Jika ada error lain:
- Pastikan Firebase config sudah benar
- Pastikan koneksi internet stabil
- Cek Firebase Console untuk error details
