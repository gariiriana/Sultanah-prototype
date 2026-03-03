/**
 * GuestInvoicePDF.tsx
 * Generates a professional PDF invoice for a registered guest.
 * Uses browser print API (window.print) — no external library needed.
 */

import { db } from '../../../../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface GuestInvoiceData {
  // Guest info
  userId: string;
  userName: string;
  userEmail: string;
  phoneNumber?: string;
  // Booking / package info
  packageId?: string;
  packageName?: string;
  paxCount?: number;
  totalInvoice?: number;
  paymentStatus?: string;
  registeredAt?: string;
  // Address (optional)
  address?: string;
  // Jamaah list (optional — can be passed directly or will be fetched from bookings)
  jamaahList?: { name: string; email?: string; phone?: string; note?: string }[];
}

interface PackageData {
  name: string;
  price: number;
  duration?: string | number;
  description?: string;
  detailDescription?: string;
  features?: string[];
  inclusions?: string[];
  includes?: string[];
  excludes?: string[];
  itinerary?: string[];
  highlight?: string[];
  packageItems?: { itemName: string; quantity: number | string }[];
  tourLeaderName?: string;
  muthawifName?: string;
  hotel?: string;
  airline?: string;
  meetingPoint?: string;
  terms?: string;
  departure?: string;
  departureDate?: string;
  destination?: string;
  category?: string;
  type?: string;
  packageClass?: string;
  [key: string]: any;
}

function generateInvoiceNumber(userId: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = userId.slice(-4).toUpperCase();
  return `INV/${yy}${mm}${dd}/STH/${suffix}`;
}

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function statusLabel(status?: string): string {
  if (status === 'lunas' || status === 'approved') return 'LUNAS';
  if (status === 'dibatalkan' || status === 'cancelled') return 'DIBATALKAN';
  return 'BELUM BAYAR';
}

function statusColor(status?: string): string {
  if (status === 'lunas' || status === 'approved') return '#059669';
  if (status === 'dibatalkan' || status === 'cancelled') return '#dc2626';
  return '#d97706';
}

export async function exportGuestInvoicePDF(data: GuestInvoiceData): Promise<void> {
  // Fetch package detail from Firestore if packageId available
  let pkg: PackageData | null = null;
  if (data.packageId) {
    try {
      const snap = await getDoc(doc(db, 'packages', data.packageId));
      if (snap.exists()) pkg = snap.data() as PackageData;
    } catch {
      // ignore — continue without package details
    }
  }

  // Fetch jamaah list from booking if not provided
  let jamaahList: { name: string; email?: string; phone?: string; note?: string }[] = data.jamaahList || [];
  if (jamaahList.length === 0 && data.userId) {
    try {
      const bookingsRef = collection(db, 'bookings');
      const bq = query(bookingsRef, where('userId', '==', data.userId));
      const snapshot = await getDocs(bq);
      if (!snapshot.empty) {
        const bookingData = snapshot.docs[0].data();
        if (Array.isArray(bookingData.jamaah) && bookingData.jamaah.length > 0) {
          jamaahList = bookingData.jamaah.map((j: any) => ({
            name: j.name || '-',
            email: j.email,
            phone: j.phone,
          }));
        }
      }
    } catch {
      // ignore
    }
  }

  // If still empty, at least put the primary guest
  if (jamaahList.length === 0) {
    jamaahList = [{ name: data.userName, email: data.userEmail, phone: data.phoneNumber, note: '(Pemesan Utama)' }];
  }

  const invoiceNumber = generateInvoiceNumber(data.userId);
  const invoiceDate = formatDate(data.registeredAt || new Date().toISOString());
  const pax = data.paxCount || jamaahList.length || 1;
  const pricePerPax = pkg?.price || (data.totalInvoice ? Math.round(data.totalInvoice / pax) : 0);
  const total = data.totalInvoice || (pricePerPax * pax);

  // Build inclusions list
  const inclusions: string[] = pkg?.features || pkg?.inclusions || pkg?.includes || [];

  // Build all package detail sections HTML
  const featuresHtml = inclusions.length > 0 ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">⭐ Fasilitas Paket</p>
  <div class="two-col-list">
    ${inclusions.map(f => `<div class="list-chip" style="background:#fef9c3; border-color:#fde68a;">✓ ${f}</div>`).join('')}
  </div>
</div>` : '';

  const includesHtml = (pkg?.includes && pkg.includes !== pkg?.features) && pkg.includes.length > 0 ? `
<div class="section-box" style="border-color:#d1fae5; background:#fafdf5;">
  <p class="section-title" style="color:#059669;">✅ Paket Termasuk</p>
  <div class="two-col-list">
    ${pkg.includes.map((i: string) => `<div class="list-chip" style="background:#f0fdf4; border-color:#d1fae5;">• ${i}</div>`).join('')}
  </div>
</div>` : '';

  const excludesHtml = pkg?.excludes && pkg.excludes.length > 0 ? `
<div class="section-box" style="border-color:#fecaca; background:#fff5f5;">
  <p class="section-title" style="color:#dc2626;">❌ Tidak Termasuk</p>
  <div class="two-col-list">
    ${pkg.excludes.map((e: string) => `<div class="list-chip" style="background:#fff1f2; border-color:#fecaca;">✕ ${e}</div>`).join('')}
  </div>
</div>` : '';

  const itemsHtml = pkg?.packageItems && pkg.packageItems.length > 0 ? `
<div class="section-box" style="border-color:#e0e7ff; background:#eef2ff;">
  <p class="section-title" style="color:#4338ca;">🎁 Perlengkapan dalam Paket</p>
  <div class="two-col-list">
    ${pkg.packageItems.map((it: any) => `<div class="list-chip" style="background:#f0f4ff; border-color:#c7d2fe;">✓ ${it.itemName} <span style="color:#6366f1; font-size:10px;">(${it.quantity}x)</span></div>`).join('')}
  </div>
</div>` : '';

  const highlightsHtml = pkg?.highlight && pkg.highlight.length > 0 ? `
<div class="section-box" style="border-color:#d1fae5; background:#fafdf5;">
  <p class="section-title" style="color:#059669;">🌟 Highlight Paket</p>
  <div class="two-col-list">
    ${pkg.highlight.map((h: string) => `<div class="list-chip" style="background:#f0fdf4; border-color:#d1fae5;">★ ${h}</div>`).join('')}
  </div>
</div>` : '';

  const tourLeader = (pkg?.tourLeaderName && pkg.tourLeaderName.trim()) ? pkg.tourLeaderName : 'Akan Segera Diumumkan';
  const muthawif = (pkg?.muthawifName && pkg.muthawifName.trim()) ? pkg.muthawifName : 'Akan Segera Diumumkan';
  const guideHtml = `
<div class="section-box" style="border-color:#e9d5ff; background:#faf5ff;">
  <p class="section-title" style="color:#7c3aed;">👥 Tim Pembimbing Perjalanan</p>
  <div style="display:flex; gap:16px;">
    <div style="flex:1; background:#fff; border:1px solid #ddd6fe; border-radius:8px; padding:10px;">
      <p style="font-size:9px; font-weight:700; text-transform:uppercase; color:#7c3aed; letter-spacing:1px;">Tour Leader</p>
      <p style="font-size:13px; font-weight:800; color:#1a1a1a; margin-top:2px;">${tourLeader}</p>
      <p style="font-size:10px; color:#888;">Pembimbing Teknis</p>
    </div>
    <div style="flex:1; background:#fff; border:1px solid #d1fae5; border-radius:8px; padding:10px;">
      <p style="font-size:9px; font-weight:700; text-transform:uppercase; color:#059669; letter-spacing:1px;">Muthawif</p>
      <p style="font-size:13px; font-weight:800; color:#1a1a1a; margin-top:2px;">${muthawif}</p>
      <p style="font-size:10px; color:#888;">Pembimbing Ibadah</p>
    </div>
  </div>
</div>`;

  const accommodationHtml = (pkg?.hotel || pkg?.airline) ? `
<div class="section-box" style="border-color:#bae6fd; background:#f0f9ff;">
  <p class="section-title" style="color:#0369a1;">🏨 Akomodasi &amp; Transportasi</p>
  <div style="display:flex; gap:16px;">
    ${pkg.hotel ? `<div style="flex:1;"><p style="font-size:10px; color:#888; font-weight:600;">Hotel</p><p style="font-weight:800; font-size:13px; color:#1a1a1a;">${pkg.hotel}</p></div>` : ''}
    ${pkg.airline ? `<div style="flex:1;"><p style="font-size:10px; color:#888; font-weight:600;">Maskapai</p><p style="font-weight:800; font-size:13px; color:#1a1a1a;">${pkg.airline}</p></div>` : ''}
  </div>
</div>` : '';

  const meetingHtml = pkg?.meetingPoint ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">📍 Titik Keberangkatan</p>
  <p style="font-size:13px; font-weight:700; color:#1a1a1a;">${pkg.meetingPoint}</p>
</div>` : '';

  const itineraryHtml = pkg?.itinerary && pkg.itinerary.length > 0 ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">🗺️ Itinerary Perjalanan</p>
  <table style="width:100%; border-collapse:collapse; font-size:11px;">
    <thead><tr style="background:#D4AF37;">
      <th style="width:60px; text-align:center; padding:6px; color:#fff; font-weight:700;">Hari</th>
      <th style="text-align:left; padding:6px; color:#fff; font-weight:700;">Kegiatan</th>
    </tr></thead>
    <tbody>
      ${pkg.itinerary.map((day: string, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#fffbeb' : '#fff'};"><td style="text-align:center; padding:6px; font-weight:700; color:#D4AF37; border-bottom:1px solid #fde68a;">Hari ${i + 1}</td><td style="padding:6px 8px; color:#555; border-bottom:1px solid #fde68a;">${day}</td></tr>`).join('')}
    </tbody>
  </table>
</div>` : '';

  const termsHtml = pkg?.terms ? `
<div class="section-box" style="border-color:#e5e7eb; background:#f9fafb;">
  <p class="section-title" style="color:#374151;">📋 Syarat &amp; Ketentuan</p>
  <p style="font-size:11px; color:#555; line-height:1.8; white-space:pre-wrap;">${pkg.terms}</p>
</div>` : '';

  // Also show hotel/airline/duration if available
  const packageMeta: { label: string; value: string }[] = [];
  if (pkg?.duration) packageMeta.push({ label: 'Durasi', value: `${pkg.duration} hari` });
  if (pkg?.hotel) packageMeta.push({ label: 'Hotel', value: pkg.hotel });
  if (pkg?.airline) packageMeta.push({ label: 'Maskapai', value: pkg.airline });
  if (pkg?.departure || pkg?.departureDate) packageMeta.push({ label: 'Keberangkatan', value: pkg.departure || pkg.departureDate || '' });
  if (pkg?.destination) packageMeta.push({ label: 'Destinasi', value: pkg.destination });
  if (pkg?.category) packageMeta.push({ label: 'Kategori', value: pkg.category });
  if (pkg?.meetingPoint) packageMeta.push({ label: 'Titik Kump.', value: pkg.meetingPoint });

  // Build jamaah rows HTML
  const jamaahRows = jamaahList.map((j, i) => `
    <tr>
      <td style="text-align:center; color:#888;">${i + 1}</td>
      <td style="font-weight:600;">${j.name || '-'}</td>
      <td style="font-size:11px; color:#555;">${j.email || ''}</td>
      <td style="font-size:11px; color:#555;">${j.phone || ''}</td>
      <td style="font-size:11px; color:#059669; font-weight:600;">${i === 0 ? '(Pemesan Utama)' : j.note || ''}</td>
    </tr>`).join('');

  const logoUrl = `${window.location.origin}/images/logo.png`;
  const statusText = statusLabel(data.paymentStatus);
  const statusClr = statusColor(data.paymentStatus);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#1a1a1a; font-size:13px; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print { display:none !important; }
    @page { margin: 0.6in 0.7in; size: A4; }
  }

  /* ===== HEADER ===== */
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom:3px solid #D4AF37; margin-bottom:24px; }
  .logo-wrap img { max-height:64px; max-width:160px; object-fit:contain; }
  .logo-wrap .tagline { font-size:10px; color:#888; margin-top:4px; }
  .invoice-meta { text-align:right; }
  .invoice-meta h1 { font-size:28px; font-weight:900; color:#D4AF37; letter-spacing:2px; }
  .invoice-meta .inv-number { font-size:13px; color:#555; margin-top:4px; font-weight:600; }
  .invoice-meta .inv-date { font-size:11px; color:#888; margin-top:2px; }

  /* ===== STATUS STAMP ===== */
  .status-stamp { display:inline-block; border:3px solid ${statusClr}; border-radius:8px; padding:6px 18px; font-size:14px; font-weight:900; color:${statusClr}; letter-spacing:2px; margin-top:8px; }

  /* ===== BILLED TO ===== */
  .bill-section { display:flex; justify-content:space-between; margin-bottom:24px; }
  .bill-box { flex:1; }
  .bill-box h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#D4AF37; margin-bottom:8px; }
  .bill-box p { font-size:13px; color:#333; line-height:1.6; }
  .bill-box .name { font-size:16px; font-weight:800; color:#111; }

  /* ===== DIVIDER ===== */
  .divider { border:none; border-top:1px solid #eee; margin:20px 0; }

  /* ===== PACKAGE DETAIL TABLE ===== */
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#D4AF37; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  thead tr { background:linear-gradient(135deg, #1a1a1a, #333); color:#D4AF37; }
  thead th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  thead th:last-child { text-align:right; }
  tbody tr:nth-child(even) { background:#fafafa; }
  tbody td { padding:10px 12px; vertical-align:top; border-bottom:1px solid #f0f0f0; }
  tbody td:last-child { text-align:right; font-weight:600; }
  .pkg-name { font-weight:700; font-size:14px; color:#111; }
  .pkg-desc { font-size:11px; color:#777; margin-top:3px; }

  /* ===== META GRID ===== */
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:14px; }
  .meta-item { display:flex; gap:8px; font-size:11px; }
  .meta-label { color:#888; min-width:90px; }
  .meta-value { color:#333; font-weight:600; }

  /* ===== INCLUSIONS ===== */
  .inclusions-box { background:#fafdf5; border:1px solid #d1fae5; border-radius:10px; padding:16px; margin-bottom:20px; }
  .inclusions-box h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#059669; margin-bottom:10px; }
  .inclusions-list { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .inclusion-item { display:flex; align-items:flex-start; gap:6px; font-size:12px; color:#1a1a1a; }
  .inclusion-dot { color:#059669; font-weight:900; flex-shrink:0; margin-top:1px; }

  /* ===== SECTION BOXES ===== */
  .section-box { border:1px solid #eee; border-radius:10px; padding:12px 14px; margin-bottom:12px; }
  .two-col-list { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .list-chip { border:1px solid #eee; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; }

  /* ===== TOTALS ===== */
  .totals-section { margin-left:auto; width:300px; }
  .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; border-bottom:1px solid #f0f0f0; }
  .totals-row.total { background:#1a1a1a; color:#D4AF37; padding:10px 12px; border-radius:8px; font-size:16px; font-weight:900; border:none; margin-top:6px; }
  .totals-row.total span:last-child { color:#fff; }

  /* ===== FOOTER ===== */
  .footer { margin-top:32px; padding-top:16px; border-top:2px solid #D4AF37; display:flex; justify-content:space-between; align-items:flex-end; }
  .footer-left p { font-size:11px; color:#888; line-height:1.7; }
  .footer-right { text-align:right; }
  .footer-right .signed { width:120px; border-top:1.5px solid #333; padding-top:4px; font-size:11px; color:#555; text-align:center; margin-top:40px; margin-left:auto; }
  .watermark-paid { position:fixed; top:35%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-size:100px; font-weight:900; color:rgba(5,150,105,0.07); pointer-events:none; z-index:0; white-space:nowrap; }

  /* ===== PRINT BUTTON ===== */
  .print-bar { background:#1a1a1a; padding:12px 20px; display:flex; gap:10px; align-items:center; justify-content:flex-end; position:sticky; top:0; z-index:999; }
  .btn { padding:8px 20px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; border:none; }
  .btn-gold { background:#D4AF37; color:#1a1a1a; }
  .btn-ghost { background:transparent; color:#fff; border:1.5px solid #555; }
  .btn:hover { opacity:0.85; }

  /* ===== THANK YOU NOTE ===== */
  .thankyou { text-align:center; margin-top:24px; padding:16px; background:linear-gradient(135deg, #fffbeb, #fef3c7); border-radius:12px; border:1px solid #fde68a; }
  .thankyou h3 { color:#92400e; font-size:15px; font-weight:800; }
  .thankyou p { color:#b45309; font-size:11px; margin-top:4px; }
</style>
</head>
<body>

${statusText === 'LUNAS' ? `<div class="watermark-paid">LUNAS</div>` : ''}

<!-- Sticky print bar (hidden when printing) -->
<div class="print-bar no-print">
  <button class="btn btn-ghost" onclick="window.close()">✕ Tutup</button>
  <button class="btn btn-gold" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
</div>

<div style="padding:40px 48px;">

<!-- ===== HEADER ===== -->
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" alt="Sultanah Travel" onerror="this.style.display='none'"/>
    <p class="tagline">Sultanah Umroh & Haji Travel</p>
    <p class="tagline">sultanahtravel.id | info@sultanahtravel.id</p>
  </div>
  <div class="invoice-meta">
    <h1>INVOICE</h1>
    <div class="inv-number">${invoiceNumber}</div>
    <div class="inv-date">Tanggal: ${invoiceDate}</div>
    <div class="status-stamp">${statusText}</div>
  </div>
</div>

<!-- ===== BILLED TO ===== -->
<div class="bill-section">
  <div class="bill-box">
    <h4>Tagihan Untuk</h4>
    <p class="name">${data.userName || '-'}</p>
    <p>${data.userEmail || '-'}</p>
    ${data.phoneNumber ? `<p>${data.phoneNumber}</p>` : ''}
    ${data.address ? `<p>${data.address}</p>` : ''}
  </div>
  <div class="bill-box" style="text-align:right;">
    <h4>Ditagihkan Oleh</h4>
    <p class="name">Sultanah Travel</p>
    <p>Umroh & Haji Premium</p>
    <p>sultanahtravel.id</p>
  </div>
</div>

<hr class="divider"/>

<!-- ===== PACKAGE TABLE ===== -->
<p class="section-title">Detail Pemesanan</p>
<table>
  <thead>
    <tr>
      <th style="width:50%">Deskripsi Paket</th>
      <th style="width:15%; text-align:center;">Pax</th>
      <th style="width:17%; text-align:right;">Harga/Pax</th>
      <th style="width:18%; text-align:right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div class="pkg-name">${data.packageName || pkg?.name || 'Paket Umroh'}</div>
        ${pkg?.description ? `<div class="pkg-desc">${pkg.description}</div>` : ''}
        ${packageMeta.length > 0 ? `
        <div class="meta-grid">
          ${packageMeta.map(m => `
          <div class="meta-item">
            <span class="meta-label">${m.label}</span>
            <span class="meta-value">${m.value}</span>
          </div>`).join('')}
        </div>` : ''}
      </td>
      <td style="text-align:center; font-weight:700;">${pax} orang</td>
      <td style="text-align:right;">${pricePerPax > 0 ? formatRupiah(pricePerPax) : '-'}</td>
      <td>${pricePerPax > 0 ? formatRupiah(pricePerPax * pax) : formatRupiah(total)}</td>
    </tr>
  </tbody>
</table>

<!-- ===== PACKAGE DETAILS ===== -->
<p class="section-title" style="margin-top:4px; color:#D4AF37;">Detail Lengkap Paket</p>

${featuresHtml}
${includesHtml}
${excludesHtml}
${itemsHtml}
${highlightsHtml}
${guideHtml}
${accommodationHtml}
${meetingHtml}
${itineraryHtml}
${termsHtml}

<!-- ===== JAMAAH LIST ===== -->
${jamaahList.length > 0 ? `
<p class="section-title" style="margin-top:4px;">Daftar Jamaah yang Berangkat</p>
<table>
  <thead>
    <tr>
      <th style="width:6%; text-align:center;">No.</th>
      <th style="width:30%;">Nama Lengkap</th>
      <th style="width:30%;">Email</th>
      <th style="width:18%;">No. Telp</th>
      <th style="width:16%;">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    ${jamaahRows}
  </tbody>
</table>` : ''}

<!-- ===== TOTALS ===== -->
<div class="totals-section">
  <div class="totals-row">
    <span>Subtotal</span>
    <span>${formatRupiah(total)}</span>
  </div>
  <div class="totals-row">
    <span>Diskon</span>
    <span>Rp 0</span>
  </div>
  <div class="totals-row total">
    <span>TOTAL</span>
    <span>${formatRupiah(total)}</span>
  </div>
</div>

<hr class="divider" style="margin-top:24px;"/>

<!-- ===== FOOTER ===== -->
<div class="footer">
  <div class="footer-left">
    <p><strong>Catatan Pembayaran:</strong></p>
    <p>Pembayaran dapat dilakukan via transfer bank atau langsung ke kantor Sultanah Travel.</p>
    <p>Konfirmasi pembayaran melalui WhatsApp Admin.</p>
    <p style="margin-top:8px; color:#aaa;">Invoice ini dibuat secara otomatis oleh sistem Sultanah Travel.</p>
  </div>
  <div class="footer-right">
    <div class="signed">Admin Sultanah Travel</div>
  </div>
</div>

<!-- THANK YOU -->
<div class="thankyou" style="margin-top:32px;">
  <h3>Jazakumullah Khairan 🕌</h3>
  <p>Terima kasih telah mempercayakan perjalanan umroh Anda bersama Sultanah Travel.</p>
</div>

</div><!-- end padding -->
</body>
</html>`;

  // Open in new window
  const w = window.open('', '_blank', 'width=900,height=850,scrollbars=yes');
  if (!w) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk halaman ini dan coba lagi.');
    return;
  }
  w.document.write(html);
  w.document.close();
}
