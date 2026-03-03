/**
 * BookingInvoicePDF.ts
 * Generates a professional PDF invoice for a user booking.
 * Includes all package detail fields: features, includes, excludes,
 * itinerary, highlights, guide info, accommodation, meeting point, terms, etc.
 * Uses browser print API (window.print) — no external library needed.
 */

export interface BookingInvoiceData {
  name: string;
  email: string;
  phone: string;
  jamaahList: { name: string }[];
  pax: number;
  pkg: {
    id?: string;
    name?: string;
    price?: string | number;
    duration?: string | number;
    description?: string;
    detailDescription?: string;
    // Fasilitas Paket
    features?: string[];
    // Paket Termasuk
    includes?: string[];
    // Tidak Termasuk
    excludes?: string[];
    // Itinerary (array of strings, one per day)
    itinerary?: string[];
    // Highlight Paket
    highlight?: string[];
    // Perlengkapan Paket
    packageItems?: { itemName: string; quantity: number | string }[];
    // Tim Pembimbing
    tourLeaderName?: string;
    muthawifName?: string;
    // Akomodasi & Transportasi
    hotel?: string;
    airline?: string;
    // Titik Keberangkatan
    meetingPoint?: string;
    // Syarat & Ketentuan
    terms?: string;
    // Tambahan
    departureDate?: string;
    type?: string;
    packageClass?: string;
    [key: string]: any;
  };
  voucherCode?: string;
  voucherDiscount?: number;
  referralCode?: string;
  bookingId?: string;
}

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function generateBookingInvoiceNumber(bookingId?: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = bookingId ? bookingId.slice(-6).toUpperCase() : String(Date.now()).slice(-6);
  return `INV/${yy}${mm}${dd}/STH/${suffix}`;
}

export function exportBookingInvoicePDF(data: BookingInvoiceData): void {
  const { name, email, phone, jamaahList, pax, pkg, voucherCode, voucherDiscount = 0, referralCode, bookingId } = data;

  const invoiceNumber = generateBookingInvoiceNumber(bookingId);
  const invoiceDate = formatDate(new Date().toISOString());
  const pricePerPax = parseInt(String(pkg.price)) || 0;
  const subtotal = pricePerPax * pax;
  const discount = voucherCode ? voucherDiscount : 0;
  const total = subtotal - discount;

  const logoUrl = `${window.location.origin}/images/logo.png`;

  // All jamaah
  const allJamaah = [
    { name, note: '(Pemesan Utama)' },
    ...jamaahList.map(j => ({ name: j.name || '-', note: '' })),
  ];
  const jamaahRows = allJamaah.map((j, i) => `
    <tr>
      <td style="text-align:center; color:#888;">${i + 1}</td>
      <td style="font-weight:600;">${j.name}</td>
      <td style="font-size:11px; color:#059669; font-weight:600;">${j.note}</td>
    </tr>`).join('');

  // Features / Fasilitas
  const featuresHtml = pkg.features && pkg.features.length > 0 ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">⭐ Fasilitas Paket</p>
  <div class="two-col-list">
    ${pkg.features.map(f => `<div class="list-chip" style="background:#fef9c3; border-color:#fde68a;">✓ ${f}</div>`).join('')}
  </div>
</div>` : '';

  // Includes / Paket Termasuk
  const includesHtml = pkg.includes && pkg.includes.length > 0 ? `
<div class="section-box" style="border-color:#d1fae5; background:#fafdf5;">
  <p class="section-title" style="color:#059669;">✅ Paket Termasuk</p>
  <div class="two-col-list">
    ${pkg.includes.map(i => `<div class="list-chip" style="background:#f0fdf4; border-color:#d1fae5;">• ${i}</div>`).join('')}
  </div>
</div>` : '';

  // Excludes / Tidak Termasuk
  const excludesHtml = pkg.excludes && pkg.excludes.length > 0 ? `
<div class="section-box" style="border-color:#fecaca; background:#fff5f5;">
  <p class="section-title" style="color:#dc2626;">❌ Tidak Termasuk</p>
  <div class="two-col-list">
    ${pkg.excludes.map(e => `<div class="list-chip" style="background:#fff1f2; border-color:#fecaca;">✕ ${e}</div>`).join('')}
  </div>
</div>` : '';

  // Package Items / Perlengkapan
  const itemsHtml = pkg.packageItems && pkg.packageItems.length > 0 ? `
<div class="section-box" style="border-color:#e0e7ff; background:#eef2ff;">
  <p class="section-title" style="color:#4338ca;">🎁 Perlengkapan dalam Paket</p>
  <div class="two-col-list">
    ${pkg.packageItems.map(it => `<div class="list-chip" style="background:#f0f4ff; border-color:#c7d2fe;">✓ ${it.itemName} <span style="color:#6366f1; font-size:10px;">(${it.quantity}x)</span></div>`).join('')}
  </div>
</div>` : '';

  // Itinerary
  const itineraryHtml = pkg.itinerary && pkg.itinerary.length > 0 ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">🗺️ Itinerary Perjalanan</p>
  <table style="width:100%; border-collapse:collapse; font-size:11px;">
    <thead>
      <tr style="background:#D4AF37;">
        <th style="width:60px; text-align:center; padding:6px; color:#fff; font-weight:700;">Hari</th>
        <th style="text-align:left; padding:6px; color:#fff; font-weight:700;">Kegiatan</th>
      </tr>
    </thead>
    <tbody>
      ${pkg.itinerary.map((day, i) => `
      <tr style="background:${i % 2 === 0 ? '#fffbeb' : '#fff'};">
        <td style="text-align:center; padding:6px 4px; font-weight:700; color:#D4AF37; border-bottom:1px solid #fde68a;">Hari ${i + 1}</td>
        <td style="padding:6px 8px; color:#555; border-bottom:1px solid #fde68a;">${day}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : '';

  // Highlights
  const highlightsHtml = pkg.highlight && pkg.highlight.length > 0 ? `
<div class="section-box" style="border-color:#d1fae5; background:#fafdf5;">
  <p class="section-title" style="color:#059669;">🌟 Highlight Paket</p>
  <div class="two-col-list">
    ${pkg.highlight.map(h => `<div class="list-chip" style="background:#f0fdf4; border-color:#d1fae5;">★ ${h}</div>`).join('')}
  </div>
</div>` : '';

  // Tim Pembimbing
  const tourLeader = pkg.tourLeaderName && pkg.tourLeaderName.trim() ? pkg.tourLeaderName : 'Akan Segera Diumumkan';
  const muthawif = pkg.muthawifName && pkg.muthawifName.trim() ? pkg.muthawifName : 'Akan Segera Diumumkan';
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

  // Accommodation
  const accommodationHtml = (pkg.hotel || pkg.airline) ? `
<div class="section-box" style="border-color:#bae6fd; background:#f0f9ff;">
  <p class="section-title" style="color:#0369a1;">🏨 Akomodasi &amp; Transportasi</p>
  <div style="display:flex; gap:16px;">
    ${pkg.hotel ? `<div style="flex:1;"><p style="font-size:10px; color:#888; font-weight:600;">Hotel</p><p style="font-weight:800; font-size:13px; color:#1a1a1a;">${pkg.hotel}</p></div>` : ''}
    ${pkg.airline ? `<div style="flex:1;"><p style="font-size:10px; color:#888; font-weight:600;">Maskapai</p><p style="font-weight:800; font-size:13px; color:#1a1a1a;">${pkg.airline}</p></div>` : ''}
  </div>
</div>` : '';

  // Meeting Point
  const meetingHtml = pkg.meetingPoint ? `
<div class="section-box" style="border-color:#fde68a; background:#fffbeb;">
  <p class="section-title" style="color:#b45309;">📍 Titik Keberangkatan</p>
  <p style="font-size:13px; font-weight:700; color:#1a1a1a;">${pkg.meetingPoint}</p>
</div>` : '';

  // Terms
  const termsHtml = pkg.terms ? `
<div class="section-box" style="border-color:#e5e7eb; background:#f9fafb;">
  <p class="section-title" style="color:#374151;">📋 Syarat &amp; Ketentuan</p>
  <p style="font-size:11px; color:#555; line-height:1.8; white-space:pre-wrap;">${pkg.terms}</p>
</div>` : '';

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
    @page { margin: 0.5in 0.6in; size: A4; }
  }

  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:3px solid #D4AF37; margin-bottom:20px; }
  .logo-wrap img { max-height:60px; max-width:150px; object-fit:contain; }
  .logo-wrap .tagline { font-size:10px; color:#888; margin-top:4px; }
  .invoice-meta { text-align:right; }
  .invoice-meta h1 { font-size:26px; font-weight:900; color:#D4AF37; letter-spacing:2px; }
  .invoice-meta .inv-number { font-size:12px; color:#555; margin-top:4px; font-weight:600; }
  .invoice-meta .inv-date { font-size:11px; color:#888; margin-top:2px; }
  .status-stamp { display:inline-block; border:3px solid #d97706; border-radius:8px; padding:5px 14px; font-size:12px; font-weight:900; color:#d97706; letter-spacing:2px; margin-top:6px; }

  .bill-section { display:flex; justify-content:space-between; margin-bottom:20px; gap:20px; }
  .bill-box { flex:1; }
  .bill-box h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#D4AF37; margin-bottom:6px; }
  .bill-box p { font-size:12px; color:#333; line-height:1.6; }
  .bill-box .name { font-size:14px; font-weight:800; color:#111; }

  .divider { border:none; border-top:1px solid #eee; margin:16px 0; }
  .section-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; }

  /* Package summary table */
  table { width:100%; border-collapse:collapse; margin-bottom:16px; font-size:12px; }
  thead tr { background:linear-gradient(135deg, #1a1a1a, #333); color:#D4AF37; }
  thead th { padding:9px 10px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  tbody tr:nth-child(even) { background:#fafafa; }
  tbody td { padding:8px 10px; vertical-align:top; border-bottom:1px solid #f0f0f0; }
  .pkg-name { font-weight:700; font-size:13px; color:#111; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:3px 12px; margin-top:8px; }
  .meta-item { display:flex; gap:6px; font-size:10px; }
  .meta-label { color:#888; min-width:80px; }
  .meta-value { color:#333; font-weight:600; }

  /* Section boxes for package details */
  .section-box { border:1px solid #eee; border-radius:10px; padding:12px 14px; margin-bottom:12px; }
  .two-col-list { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .list-chip { border:1px solid #eee; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; }

  /* Jamaah table */
  .jamaah-table thead tr { background:linear-gradient(135deg, #1a3a2a, #2a5a3a); }
  .jamaah-table thead th { color:#a7f3d0; }

  /* Totals */
  .totals-section { margin-left:auto; width:300px; }
  .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:12px; border-bottom:1px solid #f0f0f0; }
  .totals-row.discount { color:#059669; }
  .totals-row.total { background:#1a1a1a; color:#D4AF37; padding:10px 14px; border-radius:8px; font-size:15px; font-weight:900; border:none; margin-top:6px; }
  .totals-row.total span:last-child { color:#fff; }

  .bsi-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px 16px; margin-top:12px; display:flex; align-items:center; gap:12px; }
  .bsi-box .acct { font-size:18px; font-weight:900; color:#1a1a1a; }
  .bsi-box .label { font-size:9px; font-weight:700; text-transform:uppercase; color:#0369a1; letter-spacing:1px; }

  .footer { margin-top:24px; padding-top:14px; border-top:2px solid #D4AF37; display:flex; justify-content:space-between; align-items:flex-end; }
  .footer-left p { font-size:11px; color:#888; line-height:1.7; }
  .footer-right .signed { width:120px; border-top:1.5px solid #333; padding-top:4px; font-size:10px; color:#555; text-align:center; margin-top:36px; margin-left:auto; }

  .thankyou { text-align:center; margin-top:24px; padding:14px; background:linear-gradient(135deg, #fffbeb, #fef3c7); border-radius:12px; border:1px solid #fde68a; }
  .thankyou h3 { color:#92400e; font-size:14px; font-weight:800; }
  .thankyou p { color:#b45309; font-size:11px; margin-top:4px; }

  .print-bar { background:#1a1a1a; padding:10px 20px; display:flex; gap:10px; align-items:center; justify-content:flex-end; position:sticky; top:0; z-index:999; }
  .btn { padding:7px 18px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px; border:none; }
  .btn-gold { background:#D4AF37; color:#1a1a1a; }
  .btn-ghost { background:transparent; color:#fff; border:1.5px solid #555; }
</style>
</head>
<body>

<!-- Sticky print bar -->
<div class="print-bar no-print">
  <button class="btn btn-ghost" onclick="window.close()">✕ Tutup</button>
  <button class="btn btn-gold" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
</div>

<div style="padding:36px 44px;">

<!-- HEADER -->
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" alt="Sultanah Travel" onerror="this.style.display='none'"/>
    <p class="tagline">Sultanah Umroh &amp; Haji Travel</p>
    <p class="tagline">sultanahtravel.id | info@sultanahtravel.id</p>
  </div>
  <div class="invoice-meta">
    <h1>INVOICE</h1>
    <div class="inv-number">${invoiceNumber}</div>
    <div class="inv-date">Tanggal: ${invoiceDate}</div>
    <div class="status-stamp">PENDING PEMBAYARAN</div>
  </div>
</div>

<!-- BILLED TO -->
<div class="bill-section">
  <div class="bill-box">
    <h4>Tagihan Untuk</h4>
    <p class="name">${name || '-'}</p>
    <p>${email || '-'}</p>
    <p>${phone || '-'}</p>
    ${referralCode ? `<p style="margin-top:4px; font-size:11px; color:#888;">Kode Referral: <strong>${referralCode}</strong></p>` : ''}
    ${voucherCode ? `<p style="font-size:11px; color:#888;">Kode Voucher: <strong>${voucherCode}</strong></p>` : ''}
  </div>
  <div class="bill-box" style="text-align:right;">
    <h4>Ditagihkan Oleh</h4>
    <p class="name">Sultanah Travel</p>
    <p>Umroh &amp; Haji Premium</p>
    <p>sultanahtravel.id</p>
  </div>
</div>

<hr class="divider"/>

<!-- PACKAGE SUMMARY TABLE -->
<p class="section-title" style="color:#D4AF37;">Detail Paket yang Dipesan</p>
<table>
  <thead>
    <tr>
      <th style="width:52%">Deskripsi Paket</th>
      <th style="width:13%; text-align:center;">Jamaah</th>
      <th style="width:17%; text-align:right;">Harga/Pax</th>
      <th style="width:18%; text-align:right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div class="pkg-name">${pkg.name || '-'}</div>
        ${pkg.type || pkg.packageClass ? `<div style="font-size:10px; color:#D4AF37; font-weight:700; margin-top:2px;">${[pkg.type, pkg.packageClass].filter(Boolean).join(' · ')}</div>` : ''}
        ${pkg.detailDescription || pkg.description ? `<div style="font-size:11px; color:#777; margin-top:4px; line-height:1.5;">${(pkg.detailDescription || pkg.description)?.slice(0, 180)}${((pkg.detailDescription || pkg.description)?.length || 0) > 180 ? '...' : ''}</div>` : ''}
        <div class="meta-grid">
          ${pkg.departureDate ? `<div class="meta-item"><span class="meta-label">Keberangkatan</span><span class="meta-value">${formatDate(pkg.departureDate)}</span></div>` : ''}
          ${pkg.duration ? `<div class="meta-item"><span class="meta-label">Durasi</span><span class="meta-value">${pkg.duration} Hari</span></div>` : ''}
          ${pkg.hotel ? `<div class="meta-item"><span class="meta-label">Hotel</span><span class="meta-value">${pkg.hotel}</span></div>` : ''}
          ${pkg.airline ? `<div class="meta-item"><span class="meta-label">Maskapai</span><span class="meta-value">${pkg.airline}</span></div>` : ''}
          ${pkg.meetingPoint ? `<div class="meta-item"><span class="meta-label">Titik Kump.</span><span class="meta-value">${pkg.meetingPoint}</span></div>` : ''}
        </div>
      </td>
      <td style="text-align:center; font-weight:700;">${pax} orang</td>
      <td style="text-align:right;">${pricePerPax > 0 ? formatRupiah(pricePerPax) : '-'}</td>
      <td style="text-align:right; font-weight:700;">${formatRupiah(subtotal)}</td>
    </tr>
  </tbody>
</table>

<hr class="divider"/>

<!-- PACKAGE DETAILS -->
<p class="section-title" style="color:#D4AF37; margin-bottom:12px;">Detail Lengkap Paket</p>

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

<hr class="divider"/>

<!-- JAMAAH LIST -->
<p class="section-title" style="color:#059669; margin-top:4px;">Daftar Jamaah yang Didaftarkan</p>
<table class="jamaah-table">
  <thead>
    <tr>
      <th style="width:8%; text-align:center;">No.</th>
      <th style="width:55%;">Nama Lengkap</th>
      <th style="width:37%;">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    ${jamaahRows}
  </tbody>
</table>

<!-- TOTALS -->
<div class="totals-section">
  <div class="totals-row">
    <span>Subtotal (${pax} Jamaah)</span>
    <span>${formatRupiah(subtotal)}</span>
  </div>
  ${discount > 0 ? `
  <div class="totals-row discount">
    <span>Diskon Voucher (${voucherCode})</span>
    <span>- ${formatRupiah(discount)}</span>
  </div>` : ''}
  <div class="totals-row total">
    <span>TOTAL BAYAR</span>
    <span>${formatRupiah(total)}</span>
  </div>
</div>

<!-- BSI Payment Info -->
<div class="bsi-box" style="margin-top:16px; max-width:300px; margin-left:auto;">
  <div>
    <p class="label">Transfer ke Rekening BSI</p>
    <p class="acct">7123456789</p>
    <p style="font-size:10px; color:#555; font-weight:600; margin-top:1px;">A.N. PT SULTANAH TRAVEL</p>
  </div>
</div>

<hr class="divider" style="margin-top:24px;"/>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-left">
    <p><strong>Catatan:</strong></p>
    <p>Kirim bukti transfer ke WhatsApp Admin Sultanah Travel setelah melakukan pembayaran.</p>
    <p style="margin-top:4px; color:#aaa; font-size:10px;">Invoice ini merupakan bukti pemesanan. Pembayaran akan dikonfirmasi oleh admin.</p>
  </div>
  <div class="footer-right">
    <div class="signed">Admin Sultanah Travel</div>
  </div>
</div>

<!-- THANK YOU -->
<div class="thankyou" style="margin-top:28px;">
  <h3>Jazakumullah Khairan 🕌</h3>
  <p>Terima kasih telah mempercayakan perjalanan umroh Anda bersama Sultanah Travel.</p>
  <p style="margin-top:2px; font-size:10px; color:#a16207;">Semoga menjadi ibadah yang mabrur. Aamiin.</p>
</div>

</div><!-- end padding -->
</body>
</html>`;

  const w = window.open('', '_blank', 'width=960,height=900,scrollbars=yes');
  if (!w) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk halaman ini dan coba lagi.');
    return;
  }
  w.document.write(html);
  w.document.close();
}
