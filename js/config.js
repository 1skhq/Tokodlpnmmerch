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



// Batas gambar & dokumen Firestore (maks 1 MB per dokumen)
export const IMG = { maxPx: 800, quality: 0.7, targetChars: 150000 };
export const DOC = { warnBytes: 800000, maxBytes: 1000000 };

// Status pesanan
export const STATUS = [
  "Menunggu Pembayaran", "Pembayaran Diterima", "Menunggu Barang PO",
  "Diproses", "Dikirim", "Selesai",
];

// Ukuran cepat untuk admin
export const SIZE_PRESET = ["S", "M", "L", "XL", "XXL"];

// Kategori awal (dipakai jika belum ada kategori tersimpan di Firebase)
export const KATEGORI_AWAL = ["Kaos", "Kemeja", "Jaket", "Celana", "Lainnya"];