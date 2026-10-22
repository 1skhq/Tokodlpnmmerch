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

// 2) (Opsional) Endpoint JSON saran kota: menerima ?q=kata, mengembalikan array string.
//    Kosongkan "" untuk memakai daftar KOTA_BAWAAN di bawah.
export const ADDRESS_API_URL = "";

// 3) Daftar kota bawaan (dipakai bila ADDRESS_API_URL kosong atau gagal)
export const KOTA_BAWAAN = [
  "Bandung", "Cimahi", "Sumedang", "Garut", "Tasikmalaya", "Bekasi", "Bogor", "Depok",
  "Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara",
  "Surabaya", "Malang", "Semarang", "Yogyakarta", "Solo", "Medan", "Palembang", "Pekanbaru",
  "Padang", "Batam", "Balikpapan", "Samarinda", "Banjarmasin", "Pontianak", "Makassar",
  "Manado", "Denpasar",
];

// 4) Batas gambar & dokumen Firestore (maks 1 MB per dokumen)
export const IMG = { maxPx: 800, quality: 0.7, targetChars: 150000 };
export const DOC = { warnBytes: 800000, maxBytes: 1000000 };

// 5) Pilihan umum
export const STATUS = [
  "Menunggu Pembayaran", "Pembayaran Diterima", "Menunggu Barang PO",
  "Diproses", "Dikirim", "Selesai",
];
export const SIZE_PRESET = ["S", "M", "L", "XL", "XXL"];
export const KATEGORI = ["Kaos", "Kemeja", "Jaket", "Celana", "Lainnya"];
