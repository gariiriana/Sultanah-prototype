# 🕋 Sultanah — Umrah & Halal Travel Platform

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth_·_Firestore_·_Storage-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Midtrans](https://img.shields.io/badge/Midtrans-Payment_Gateway-00A5CF?style=flat-square&logo=data:image/svg+xml;base64,&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel&logoColor=white)

**Sultanah** adalah platform full-stack untuk manajemen **Umrah & Halal Travel** yang dibangun dengan arsitektur modern. Aplikasi ini menyediakan ekosistem lengkap mulai dari **booking paket Umrah**, **manajemen jamaah**, **sistem pembayaran**, hingga **portal alumni** — seluruhnya terintegrasi secara real-time melalui web app dengan tampilan **premium responsive** dan backend yang aman dengan **Firebase Authentication** serta **Role-Based Access Control (RBAC)** untuk 10+ role pengguna.

> ⚠️ **Repository ini bersifat private.** Seluruh credentials, API keys, dan konfigurasi sensitif dikecualikan dari version control melalui `.gitignore`.

---

## 📋 Table of Contents

- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Scripts](#-scripts)
- [License](#-license)

---

## 🛠️ Tech Stack

| Layer | Technology |
| ----- | ---------- |
| **Frontend** | React 18 · TypeScript 5.7 |
| **Styling** | Tailwind CSS v4 · Radix UI · shadcn/ui |
| **Build Tool** | Vite 6 |
| **Backend** | Firebase Auth · Cloud Firestore · Cloud Storage |
| **Payment** | Midtrans Payment Gateway |
| **Routing** | React Router v7 |
| **Animation** | Framer Motion (motion) |
| **Charts** | Recharts |
| **PDF Export** | jsPDF · jspdf-autotable |
| **Deployment** | Vercel · Firebase Hosting |

---

## 🏗️ Architecture

```text
sultanah/
├── src/
│   ├── app/
│   │   ├── components/          # Reusable UI components
│   │   └── pages/               # Page components organized by role
│   │       ├── admin/           # Admin dashboard & management
│   │       ├── owner/           # Owner oversight panel
│   │       ├── agent/           # Agent referral portal
│   │       ├── affiliator/      # Affiliator management
│   │       ├── influencer/      # Influencer dashboard
│   │       ├── tour-leader/     # Tour Leader operations
│   │       ├── mutawwif/        # Mutawwif guidance tools
│   │       ├── current-jamaah/  # Active Jamaah portal
│   │       ├── alumni/          # Alumni community
│   │       ├── guest/           # Public-facing pages
│   │       ├── auth/            # Authentication flows
│   │       ├── booking/         # Booking & reservation
│   │       └── invoice/         # Invoice & billing
│   ├── config/                  # Firebase & app configuration
│   ├── constants/               # Application constants
│   ├── contexts/                # React Context providers (Auth, Theme)
│   ├── styles/                  # Global styles & design tokens
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions & helpers
├── api/                         # Serverless API functions (Vercel)
├── scripts/                     # Build & data scripts
├── public/                      # Static assets
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore composite indexes
├── vite.config.ts               # Vite build configuration
├── vercel.json                  # Vercel deployment config
└── tsconfig.json                # TypeScript configuration
```

---

## 🎯 Features

### Role-Based Access Control (RBAC)

Platform mendukung **10+ role** dengan hak akses terkontrol secara granular:

| Role | Deskripsi |
| ---- | --------- |
| **Owner** | Oversight penuh seluruh operasional |
| **Admin** | Manajemen sistem, data jamaah, dan keuangan |
| **Tour Leader** | Manajemen grup perjalanan, komunikasi jamaah |
| **Mutawwif** | Bimbingan ibadah dan koordinasi di tanah suci |
| **Agent** | Portal referral, tracking komisi |
| **Affiliator** | Program afiliasi dan konversi |
| **Influencer** | Dashboard kolaborasi marketing |
| **Calon Jamaah** | Pendaftaran, booking, dan pembayaran |
| **Jamaah Aktif** | Informasi perjalanan real-time |
| **Alumni** | Komunitas alumni dan testimoni |

### Core Modules

- **📦 Booking & Paket Umrah** — Pemilihan paket, penjadwalan keberangkatan, dan reservasi
- **💳 Sistem Pembayaran** — Integrasi Midtrans, cicilan, tracking pembayaran, dan invoice otomatis
- **📊 Dashboard Analytics** — Visualisasi data dengan Recharts untuk setiap role
- **📰 Portal Berita & Artikel** — CMS untuk konten edukasi dan informasi
- **🎯 Sistem Referral & Afiliasi** — Multi-tier referral dengan tracking komisi real-time
- **🖼️ Banner Management** — Dynamic banner dengan drag & drop positioning
- **💬 WhatsApp Integration** — Floating widget dengan template pesan per role
- **🎓 Education Center** — Materi belajar, video konten, dan progress tracking
- **🏅 Alumni Portal** — Direktori alumni, testimoni, dan networking
- **🛒 Marketplace** — Listing produk, order management, dan payment tracking
- **📄 PDF Export** — Generate invoice dan laporan dalam format PDF
- **🖼️ User Frames** — Badge visual per role dengan integrasi profil

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Firebase project (Auth, Firestore, Storage enabled)
- Midtrans merchant account (untuk payment gateway)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd sultanah

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan konfigurasi Firebase & Midtrans Anda

# 4. Deploy Firestore security rules
# Buka Firebase Console → Firestore → Rules
# Copy-paste isi file firestore.rules → Publish

# 5. Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173/`

---

## 🔐 Environment Variables

Buat file `.env.local` di root project dan isi dengan variabel berikut:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Midtrans Configuration
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_IS_PRODUCTION=false
```

> 🔒 **Jangan pernah commit file `.env` atau `.env.local` ke repository.** File ini sudah tercantum dalam `.gitignore`.

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push repository ke GitHub
2. Import project di [Vercel Dashboard](https://vercel.com)
3. Tambahkan semua environment variables di **Project Settings → Environment Variables**
4. Deploy — Vercel akan auto-detect konfigurasi Vite
5. Authorize domain di **Firebase Console → Authentication → Settings**

### Firebase Hosting (Alternative)

```bash
npm run deploy
```

---

## 📝 Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build & deploy ke Firebase Hosting |

---

## 📄 License

**Private** — All rights reserved. Unauthorized distribution is prohibited.