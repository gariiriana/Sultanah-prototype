# 🕋 Sultanah - Umrah & Halal Travel Platform

Modern web application untuk manajemen Umrah & Halal Travel dengan Firebase integration dan role-based access control.

## 🎉 **LATEST UPDATE: IMAGES ISSUE FIXED!**

✅ **Problem:** `figma:asset` imports causing errors in localhost  
✅ **Solution:** Vite plugin auto-replaces with Unsplash placeholders  
✅ **Status:** READY TO RUN!  

**Read more:** [`/FIX-IMAGES-EXPLAINED.md`](/FIX-IMAGES-EXPLAINED.md)

---

## 🚀 QUICK START - RUNNING LOCALHOST

### **STEP 1: Deploy Firestore Rules** (WAJIB!)

1. **Buka Firebase Console**: https://console.firebase.google.com/
2. **Pilih project** "Sultanah"
3. **Klik** "Firestore Database" → Tab "Rules"
4. **COPY semua isi** dari file `/firestore.rules`
5. **PASTE** ke Firebase Console → Klik **"Publish"**
6. **TUNGGU 1-2 menit**

### **STEP 2: Install & Run**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Buka browser: http://localhost:5173/
```

**✅ Done! Website akan muncul di browser!**

**📖 Detailed Guide:** [`CARA-RUNNING-LOCALHOST.md`](/CARA-RUNNING-LOCALHOST.md)

---

## 🔥 CRITICAL UPDATES

### January 10, 2026 - Permission Error Fix
**Issue:** "Missing or insufficient permissions" error on user data load  
**Cause:** Firestore Rules belum ter-deploy  
**Status:** ✅ FIXED - Use `/DEPLOY-RULES-NOW.html` tool  
**Action Required:** Deploy Firestore rules ke Firebase Console

### January 6, 2026 - Referral Code Fix Applied
**Issue:** Kode referral Alumni tidak bisa digunakan  
**Status:** ✅ FIXED - Ready for deployment  
**Action Required:** Deploy updated Firestore rules

**Quick Deploy:**
```bash
# Windows:
deploy-referral-fix.bat

# Mac/Linux:
./deploy-referral-fix.sh
```

**Documentation:**
- **START HERE:** [`REFERRAL_FIX_MASTER_INDEX.md`](/REFERRAL_FIX_MASTER_INDEX.md) 🎯
- Quick Deploy: [`QUICK_ACTION_CHECKLIST.md`](/QUICK_ACTION_CHECKLIST.md) ⚡
- Detailed Fix: [`REFERRAL_CODE_FIX_CRITICAL.md`](/REFERRAL_CODE_FIX_CRITICAL.md)
- Testing Guide: [`TESTING_GUIDE_REFERRAL.md`](/TESTING_GUIDE_REFERRAL.md)

---

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Akun Vercel (free tier OK)
- Akun GitHub
- Firebase project sudah setup

### Deploy Steps (5 menit)

1. **Upload ke GitHub**
   ```bash
   # Atau upload manual via GitHub web interface
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sultanah-travel.git
   git push -u origin main
   ```

2. **Import ke Vercel**
   - Login ke https://vercel.com
   - Klik "Add New Project"
   - Import GitHub repository
   - Vercel auto-detect Vite settings ✅

3. **Add Environment Variables**
   
   Di Vercel Project Settings → Environment Variables, tambahkan:
   
   ```
   VITE_FIREBASE_API_KEY=AIzaSyBm80jrty9X28t90CsuJmwIwSKju2WStyc
   VITE_FIREBASE_AUTH_DOMAIN=sultanah-travel-6a382.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=sultanah-travel-6a382
   VITE_FIREBASE_STORAGE_BUCKET=sultanah-travel-6a382.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=696046595036
   VITE_FIREBASE_APP_ID=1:696046595036:web:394daa46627958b1487d19
   VITE_FIREBASE_MEASUREMENT_ID=G-PQEJ18JS64
   ```

4. **Deploy!**
   - Klik "Deploy"
   - Tunggu 2-5 menit
   - ✅ DONE! Website live!

5. **Authorize Domain di Firebase**
   - Buka: https://console.firebase.google.com/project/sultanah-travel-6a382/authentication/settings
   - Add domain: `your-app.vercel.app`
   - Klik "Add"

## 📦 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS v4
- **Build:** Vite 6
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Routing:** React Router v7
- **UI Components:** Radix UI + shadcn/ui
- **Deployment:** Vercel

## 🏗️ Project Structure

```
sultanah-travel/
├── src/
│   ├── app/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components by role
│   │   └── App.tsx         # Main app component
│   ├── config/
│   │   └── firebase.ts     # Firebase configuration
│   ├── contexts/
│   │   └── AuthContext.tsx # Auth state management
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── index.html             # Entry HTML
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── vercel.json            # Vercel deployment config
```

## 🎯 Features

### 1. Role-Based Access Control (10 Roles)
- Admin
- Staff
- Supervisor
- Direktur
- Tour Leader
- Mutawwif/Muthawif
- Prospective Jamaah (Calon Jamaah)
- Current Jamaah (Jamaah Aktif)
- Alumni Jamaah
- Agent (Agen Referral)

### 2. Portal Berita & Artikel
- Article management
- News feed
- Category filtering

### 3. Sistem Referral
- Agent dashboard
- Commission tracking
- Referral analytics

### 4. Banner Management
- Dynamic banner uploads
- Position management
- Active/inactive toggle

### 5. WhatsApp Customer Service
- Floating widget
- Auto-generated messages
- Role-specific templates

### 6. User Frames (Role Badges)
- Visual role indicators
- Custom frames per role
- Profile page integration

### 7. Marketplace System
- Product listings
- Order management
- Payment tracking

### 8. Payment System
- Installment tracking
- Payment history
- Status updates

### 9. Education Management
- Course materials
- Video content
- Progress tracking

### 10. Alumni Portal
- Alumni directory
- Testimonials
- Networking features

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

### Firebase Setup

1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Copy config to `.env.local`

### Firestore Rules (Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 3, 1);
    }
  }
}
```

**⚠️ WARNING:** This is for DEVELOPMENT only! Update rules for production!

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔐 Admin Access

Default admin credentials are auto-created on first run:

```
Email: admin@sultanah.com
Password: admin123456
Role: admin
```

**⚠️ IMPORTANT:** Change this in production!

## 📚 Documentation

- [QUICK-DEPLOY.md](./QUICK-DEPLOY.md) - Detailed deployment guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues & fixes
- [DEPLOYMENT-PACKAGE-README.md](./DEPLOYMENT-PACKAGE-README.md) - Full deployment docs

## 🤝 Support

For issues or questions:
1. Check TROUBLESHOOTING.md
2. Review Firebase console logs
3. Check Vercel deployment logs

## 📄 License

Private - All rights reserved

## 🎉 Deploy Status

- ✅ Code ready for deployment
- ✅ All dependencies installed
- ✅ TypeScript configured
- ✅ Vite build tested
- ✅ Firebase integrated
- ✅ Vercel configuration ready

**Deploy now!** 🚀