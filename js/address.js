/*
  PSEUDOCODE:
  FUNGSI async cariKota(kata):
      JIKA kata < 2 huruf → KEMBALIKAN daftar kosong
      BATALKAN pencarian sebelumnya
      MUAT js/wilayah.json (hanya sekali, lalu disimpan di memori)
      CARI kabupaten/kota yang namanya DIAWALI kata (prioritas utama)
      LALU CARI yang MENGANDUNG kata atau nama provinsinya cocok
      KEMBALIKAN maksimal 8 hasil dalam bentuk "Kota Bandung, Jawa Barat"

  FUNGSI pasangAutocomplete(input, daftar, saatDipilih):
      SETIAP ketikan: tunggu 300 ms (debounce), lalu cariKota
      SAAT saran dipilih: isi input, panggil saatDipilih, tutup daftar
*/
let cache = null;       // data wilayah yang sudah dimuat
let controller = null;  // untuk membatalkan pencarian lama

async function muatWilayah() {
  if (cache) return cache;
  const res = await fetch("js/wilayah.json");
  if (!res.ok) throw new Error("wilayah-gagal-dimuat");
  cache = await res.json(); // [{ p: "Jawa Barat", k: "Kota Bandung" }, ...]
  return cache;
}

function cocokkan(data, q) {
  const awal = [];
  const sisa = [];
  for (const { p, k } of data) {
    const nama = k.toLowerCase();
    const tanpaJenis = nama.replace(/^(kota|kab\.?|kabupaten)\s+/, "");
    if (nama.startsWith(q) || tanpaJenis.startsWith(q)) awal.push({ p, k });
    else if (nama.includes(q) || p.toLowerCase().includes(q)) sisa.push({ p, k });
  }
  return [...awal, ...sisa].slice(0, 8).map(({ p, k }) => `${k}, ${p}`);
}

export async function cariKota(kata) {
  const q = (kata || "").trim().toLowerCase();
  if (q.length < 2) return [];

  controller?.abort();
  const mine = (controller = new AbortController());

  try {
    const data = await muatWilayah();
    if (controller !== mine) return null; // sudah ada pencarian baru
    return cocokkan(data, q);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function pasangAutocomplete(input, listEl, saatDipilih) {
  let t;
  const tampil = items => {
    listEl.innerHTML = items
      .map(v => `<li data-v="${v.replace(/"/g, "&quot;")}">${v}</li>`)
      .join("");
    listEl.hidden = items.length === 0;
  };

  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const hasil = await cariKota(input.value);
      if (hasil !== null) tampil(hasil);
    }, 300);
  });

  // mousedown agar pilihan tersimpan sebelum input kehilangan fokus
  listEl.addEventListener("mousedown", e => {
    const li = e.target.closest("li");
    if (!li) return;
    e.preventDefault();
    input.value = li.dataset.v;
    saatDipilih(li.dataset.v);
    listEl.hidden = true;
  });

  input.addEventListener("blur", () => setTimeout(() => (listEl.hidden = true), 150));
}
