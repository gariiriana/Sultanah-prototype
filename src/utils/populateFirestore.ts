import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Sample Data untuk Promos
const samplePromos = [
  {
    title: "Promo Early Bird Ramadhan 2025",
    description: "Dapatkan diskon spesial untuk pendaftaran paket Umroh Ramadhan sebelum akhir Februari",
    discount: "20%",
    validUntil: "28 Februari 2025",
    color: "gold",
    icon: "gift",
    badge: "TERBATAS",
    createdAt: Timestamp.now(),
  },
  {
    title: "Cashback Spesial Hari Raya",
    description: "Cashback hingga Rp 3.000.000 untuk paket keberangkatan bulan Syawal",
    discount: "Rp 3 Juta",
    validUntil: "31 Maret 2025",
    color: "purple",
    icon: "star",
    badge: "EKSKLUSIF",
    createdAt: Timestamp.now(),
  },
  {
    title: "Gratis Perlengkapan Umroh",
    description: "Bonus koper, tas, dan perlengkapan umroh premium senilai Rp 2.500.000",
    discount: "GRATIS",
    validUntil: "15 Maret 2025",
    color: "blue",
    icon: "package",
    badge: "BONUS",
    createdAt: Timestamp.now(),
  },
];

// Sample Data untuk Packages
const samplePackages = [
  {
    name: "Paket Umroh Ekonomis",
    price: 25000000,
    duration: "9 Hari 7 Malam",
    description: "Paket umroh hemat dengan fasilitas lengkap dan nyaman untuk jamaah",
    features: [
      "Tiket Pesawat PP",
      "Hotel Bintang 3 dekat Masjidil Haram & Nabawi",
      "Visa Umroh",
      "Makan 3x Sehari",
      "Tour Guide Berpengalaman",
      "Perlengkapan Umroh",
    ],
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800",
    available: true,
    capacity: 45,
    booked: 12,
    category: "umroh",
    createdAt: Timestamp.now(),
  },
  {
    name: "Paket Umroh Ramadhan VIP",
    price: 45000000,
    duration: "12 Hari 10 Malam",
    description: "Paket premium khusus Ramadhan dengan hotel bintang 5 dan fasilitas VIP",
    features: [
      "Tiket Pesawat Kelas Bisnis",
      "Hotel Bintang 5 Walking Distance",
      "Visa Umroh Fast Track",
      "Makan Prasmanan Premium",
      "Private Tour Guide",
      "Ziarah Lengkap + Wisata Religi",
      "Travel Kit Premium",
      "Asuransi Perjalanan",
    ],
    image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800",
    available: true,
    capacity: 20,
    booked: 8,
    category: "umroh-ramadhan",
    badge: "RECOMMENDED",
    createdAt: Timestamp.now(),
  },
  {
    name: "Paket Umroh Plus Turki",
    price: 38000000,
    duration: "14 Hari 12 Malam",
    description: "Umroh lengkap dengan city tour ke Istanbul, Turki",
    features: [
      "Tiket Pesawat PP Jakarta-Jeddah-Istanbul-Jakarta",
      "Hotel Bintang 4",
      "Visa Umroh & Visa Turki",
      "Makan 3x Sehari",
      "Tour Guide Indonesia & Lokal",
      "Wisata Turki: Hagia Sophia, Blue Mosque, Bosphorus",
      "Free Shopping Time",
    ],
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
    available: true,
    capacity: 30,
    booked: 15,
    category: "umroh-plus",
    badge: "POPULAR",
    createdAt: Timestamp.now(),
  },
];

// Sample Data untuk Testimonials
const sampleTestimonials = [
  {
    name: "Ibu Siti Rahmawati",
    location: "Jakarta",
    rating: 5,
    comment: "Alhamdulillah, pengalaman umroh bersama Sultanah Travel sangat menyenangkan. Pelayanan ramah, hotel nyaman, dan tour guide sangat membantu. Jazakumullah khairan!",
    date: "15 Januari 2025",
    packageName: "Paket Umroh Ramadhan VIP",
    avatar: "https://ui-avatars.com/api/?name=Siti+Rahmawati&background=D4AF37&color=fff",
    verified: true,
    createdAt: Timestamp.now(),
  },
  {
    name: "Bapak Ahmad Hidayat",
    location: "Bandung",
    rating: 5,
    comment: "Subhanallah, perjalanan umroh yang sangat berkesan. Semua diatur dengan rapi, tidak ada kendala berarti. Terima kasih Sultanah Travel, insyaAllah akan merekomendasikan ke keluarga dan teman-teman.",
    date: "8 Januari 2025",
    packageName: "Paket Umroh Ekonomis",
    avatar: "https://ui-avatars.com/api/?name=Ahmad+Hidayat&background=C5A572&color=fff",
    verified: true,
    createdAt: Timestamp.now(),
  },
  {
    name: "Ibu Nurul Fadhilah",
    location: "Surabaya",
    rating: 5,
    comment: "Pengalaman umroh plus Turki yang luar biasa! Tidak hanya ibadah di Tanah Suci, tapi juga bisa wisata religi di Turki. Paket lengkap dengan harga terjangkau. Highly recommended!",
    date: "22 Desember 2024",
    packageName: "Paket Umroh Plus Turki",
    avatar: "https://ui-avatars.com/api/?name=Nurul+Fadhilah&background=F4D03F&color=333",
    verified: true,
    createdAt: Timestamp.now(),
  },
  {
    name: "Bapak Dedi Kurniawan",
    location: "Medan",
    rating: 5,
    comment: "Pelayanan sangat memuaskan dari awal pendaftaran sampai pulang ke Indonesia. Tim Sultanah Travel sangat profesional dan responsif. Jazakumullah khairan kathira!",
    date: "30 Desember 2024",
    packageName: "Paket Umroh Ramadhan VIP",
    avatar: "https://ui-avatars.com/api/?name=Dedi+Kurniawan&background=D4AF37&color=fff",
    verified: true,
    createdAt: Timestamp.now(),
  },
];

// Sample Data untuk Education
const sampleEducation = [
  {
    title: "Panduan Lengkap Persiapan Umroh untuk Pemula",
    excerpt: "Pelajari langkah-langkah persiapan umroh mulai dari dokumen, perlengkapan, hingga tips ibadah yang perlu Anda ketahui",
    content: `
# Panduan Lengkap Persiapan Umroh untuk Pemula

Umroh adalah ibadah yang sangat dianjurkan dalam Islam. Bagi Anda yang baru pertama kali akan berangkat umroh, berikut adalah panduan lengkap persiapannya:

## 1. Dokumen yang Diperlukan
- Paspor (masa berlaku minimal 6 bulan)
- Kartu Keluarga & KTP
- Akta Kelahiran
- Buku Nikah (untuk pasangan suami istri)
- Foto ukuran 4x6 (background putih)
- Kartu Vaksin Meningitis & COVID-19

## 2. Perlengkapan Ibadah
- Kain ihram (untuk pria)
- Mukena (untuk wanita)
- Sajadah portable
- Al-Quran & doa-doa haji
- Tasbih

## 3. Perlengkapan Pribadi
- Pakaian secukupnya
- Sandal yang nyaman
- Tas/koper (max 20kg)
- Obat-obatan pribadi
- Toiletries

## 4. Persiapan Finansial
- Biaya paket umroh
- Uang saku (disarankan 500-1000 riyal)
- Kartu kredit/debit internasional

## 5. Persiapan Mental & Spiritual
- Pelajari doa-doa & tata cara umroh
- Lunas hutang & minta maaf kepada keluarga
- Niat yang ikhlas karena Allah SWT

Semoga panduan ini bermanfaat untuk persiapan umroh Anda! 🤲
    `,
    category: "Panduan",
    author: "Tim Sultanah Travel",
    readTime: "5 menit",
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800",
    tags: ["Umroh", "Panduan", "Persiapan"],
    publishedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  },
  {
    title: "10 Amalan Sunnah di Masjidil Haram",
    excerpt: "Ketahui amalan-amalan sunnah yang dianjurkan saat berada di Masjidil Haram agar ibadah umroh Anda lebih berkah",
    content: `
# 10 Amalan Sunnah di Masjidil Haram

Masjidil Haram adalah tempat paling mulia di dunia. Berikut amalan-amalan sunnah yang dianjurkan:

## 1. Memperbanyak Thawaf
Satu shalat di Masjidil Haram setara dengan 100.000 shalat di tempat lain.

## 2. Minum Air Zamzam
Minumlah air zamzam sambil berdoa. Rasulullah SAW bersabda: "Air zamzam sesuai dengan niat yang meminumnya."

## 3. Shalat di Hijr Ismail
Area ini termasuk bagian dari Ka'bah dan sangat mustajab untuk berdoa.

## 4. Mengusap Hajar Aswad
Jika memungkinkan, cium atau usap Hajar Aswad. Jika tidak bisa, cukup isyarat dengan tangan.

## 5. Shalat di Multazam
Tempat antara Hajar Aswad dan pintu Ka'bah, sangat mustajab untuk berdoa.

## 6. Memperbanyak Sedekah
Berikanlah sedekah kepada fakir miskin di sekitar Masjidil Haram.

## 7. I'tikaf di Masjidil Haram
Luangkan waktu untuk i'tikaf dan mendekatkan diri kepada Allah.

## 8. Mengerjakan Shalat Tahiyatul Masjid
Setiap masuk masjid, kerjakan shalat tahiyatul masjid 2 rakaat.

## 9. Membaca Al-Quran
Bacalah Al-Quran sebanyak-banyaknya di Masjidil Haram.

## 10. Memperbanyak Doa
Perbanyak berdoa untuk diri sendiri, keluarga, dan kaum muslimin.

Semoga bermanfaat! 🕋
    `,
    category: "Ibadah",
    author: "Ustadz Muhammad Ali",
    readTime: "7 menit",
    image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800",
    tags: ["Umroh", "Ibadah", "Sunnah"],
    publishedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  },
  {
    title: "Doa-Doa Penting Saat Umroh",
    excerpt: "Kumpulan doa-doa penting yang perlu Anda hafalkan dan amalkan selama menunaikan ibadah umroh",
    content: `
# Doa-Doa Penting Saat Umroh

Berikut adalah doa-doa yang sangat penting untuk diamalkan saat umroh:

## 1. Doa Niat Umroh
اللَّهُمَّ إِنِّيْ أُرِيْدُ الْعُمْرَةَ فَيَسِّرْهَا لِيْ وَتَقَبَّلْهَا مِنِّيْ

*"Allahumma inni uriidul 'umrata fayassirha lii wa taqabbalha minnii"*

Artinya: "Ya Allah, sesungguhnya aku berniat umroh, maka mudahkanlah dan terimalah dariku."

## 2. Doa Memasuki Masjidil Haram
بِسْمِ اللهِ وَالصَّلاَةُ وَالسَّلاَمُ عَلَى رَسُوْلِ اللهِ، اللَّهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ

*"Bismillahi wasshalatu wassalamu 'ala rasulillah, Allahumma aftah lii abwaaba rahmatik"*

Artinya: "Dengan nama Allah, shalawat dan salam atas Rasulullah. Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu."

## 3. Doa Melihat Ka'bah Pertama Kali
اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيْفًا وَتَكْرِيْمًا وَتَعْظِيْمًا وَبِرًّا

*"Allahumma zid hadhal baita tasyriifan wa ta'zhiiman wa takriiman wa mahaabah..."*

## 4. Doa Thawaf
Setiap putaran thawaf, perbanyak dzikir, doa, dan membaca Al-Quran.

Antara Rukun Yamani dan Hajar Aswad, baca:
رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ

*"Rabbana aatina fid dunya hasanah wa fil akhirati hasanah wa qina 'adzaaban naar"*

## 5. Doa Sa'i
Saat berada di atas bukit Shafa dan Marwah:
لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِيْ وَيُمِيْتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرٌ

Hafalkan dan amalkan doa-doa ini untuk kesempurnaan ibadah umroh Anda! 🤲
    `,
    category: "Doa",
    author: "Ustadz Abdullah Rahman",
    readTime: "8 menit",
    image: "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800",
    tags: ["Doa", "Umroh", "Panduan"],
    publishedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  },
];

// Main Function to Populate All Collections
export const populateFirestore = async () => {
  try {
    console.log('🚀 Starting Firestore population...');
    
    // 1. Populate Promos
    console.log('📦 Adding Promos...');
    const promosRef = collection(db, 'promos');
    const existingPromos = await getDocs(promosRef);
    
    if (existingPromos.size === 0) {
      for (const promo of samplePromos) {
        await addDoc(promosRef, promo);
      }
      console.log(`✅ Added ${samplePromos.length} promos`);
    } else {
      console.log(`ℹ️ Promos already exist (${existingPromos.size} docs)`);
    }
    
    // 2. Populate Packages
    console.log('📦 Adding Packages...');
    const packagesRef = collection(db, 'packages');
    const existingPackages = await getDocs(packagesRef);
    
    if (existingPackages.size === 0) {
      for (const pkg of samplePackages) {
        await addDoc(packagesRef, pkg);
      }
      console.log(`✅ Added ${samplePackages.length} packages`);
    } else {
      console.log(`ℹ️ Packages already exist (${existingPackages.size} docs)`);
    }
    
    // 3. Populate Testimonials
    console.log('📦 Adding Testimonials...');
    const testimonialsRef = collection(db, 'testimonials');
    const existingTestimonials = await getDocs(testimonialsRef);
    
    if (existingTestimonials.size === 0) {
      for (const testimonial of sampleTestimonials) {
        await addDoc(testimonialsRef, testimonial);
      }
      console.log(`✅ Added ${sampleTestimonials.length} testimonials`);
    } else {
      console.log(`ℹ️ Testimonials already exist (${existingTestimonials.size} docs)`);
    }
    
    // 4. Populate Education
    console.log('📦 Adding Education Articles...');
    const educationRef = collection(db, 'education');
    const existingEducation = await getDocs(educationRef);
    
    if (existingEducation.size === 0) {
      for (const article of sampleEducation) {
        await addDoc(educationRef, article);
      }
      console.log(`✅ Added ${sampleEducation.length} education articles`);
    } else {
      console.log(`ℹ️ Education articles already exist (${existingEducation.size} docs)`);
    }
    
    console.log('');
    console.log('🎉 ═══════════════════════════════════════════');
    console.log('✅ FIRESTORE POPULATION COMPLETED!');
    console.log('🎉 ═══════════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Promos: ${samplePromos.length} documents`);
    console.log(`   • Packages: ${samplePackages.length} documents`);
    console.log(`   • Testimonials: ${sampleTestimonials.length} documents`);
    console.log(`   • Education: ${sampleEducation.length} documents`);
    console.log('');
    console.log('🔄 Refresh the page to see the data!');
    
    return {
      success: true,
      message: 'All collections populated successfully!',
      counts: {
        promos: samplePromos.length,
        packages: samplePackages.length,
        testimonials: sampleTestimonials.length,
        education: sampleEducation.length,
      }
    };
    
  } catch (error: any) {
    console.error('❌ Error populating Firestore:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Export sample data for manual use if needed
export { samplePromos, samplePackages, sampleTestimonials, sampleEducation };
