// ============================================================
//  KONFIGURASI — satu-satunya file yang perlu diisi untuk koneksi
// ============================================================

// 1) Salin firebaseConfig dari Firebase Console
//    (Project settings > Your apps > Web app)
export const firebaseConfig = {
  apiKey: "AIzaSyDbGa57d6yxVnILAh7OxUCG5g7Vk92HkcY",
  authDomain: "dlpnm-merch.firebaseapp.com",
  projectId: "dlpnm-merch",
  storageBucket: "dlpnm-merch.firebasestorage.app",
  messagingSenderId: "561977784210",
  appId: "1:561977784210:web:429d322210287aed3c334b",
};



// Kompresi foto (dibuat lebih kecil agar muat banyak foto dalam 1 MB per dokumen)
export const IMG = { maxPx: 800, quality: 0.7, targetChars: 110000 };

// Batas dokumen Firestore (maks 1 MB per dokumen)
export const DOC = { warnBytes: 800000, maxBytes: 1000000 };

// Batas fitur
export const LIMITS = {
  orders: 100,      // jumlah pesanan terbaru yang dimuat
  gallery: 5,       // foto per produk
  banner: 5,        // foto banner beranda
  retainDays: 365,  // pesanan lebih tua dari ini dihapus otomatis
  purgeBatch: 50,   // jumlah dihapus per batch
};

export const STATUS = [
  "Menunggu Pembayaran", "Pembayaran Diterima", "Menunggu Barang PO",
  "Diproses", "Dikirim", "Selesai",
];

// Ukuran cepat untuk admin
export const SIZE_PRESET = ["S", "M", "L", "XL", "XXL"];

// Kategori awal (dipakai jika belum ada kategori tersimpan di Firebase)
export const KATEGORI_AWAL = ["Best Seller", "Lainnya"];


// Kontak & sosial media (tampil di halaman pembeli)
export const CONTACT = {
  wa: "6285182247816",          // format internasional tanpa + dan spasi
  waDisplay: "+62 851-8224-7816",
  tiktok: "dlpnmmerch",
  instagram: "dlpnmmerch",
};
