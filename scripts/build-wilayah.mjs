// Menjalankan: node scripts/build-wilayah.mjs   (butuh Node.js 18 ke atas)
// Menghasilkan: js/wilayah.json berisi daftar kabupaten & kota se-Indonesia

import { writeFile } from "node:fs/promises";

const BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";
const get = async path => {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Gagal mengambil ${path} (${res.status})`);
  return res.json();
};

// "KABUPATEN BANDUNG" → "Kab. Bandung", "KOTA BANDUNG" → "Kota Bandung"
const rapikan = nama => {
  let s = nama.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  s = s.replace(/^Kabupaten /, "Kab. ");
  return s.replace(/\bDki\b/g, "DKI");
};

const provinsi = await get("provinces.json");
const hasil = [];

for (const prov of provinsi) {
  const kabKota = await get(`regencies/${prov.id}.json`);
  for (const r of kabKota) {
    hasil.push({ p: rapikan(prov.name), k: rapikan(r.name) });
  }
}

hasil.sort((a, b) => a.k.localeCompare(b.k, "id"));
await writeFile("js/wilayah.json", JSON.stringify(hasil));
console.log(`Selesai: ${hasil.length} kabupaten/kota ditulis ke js/wilayah.json`);
