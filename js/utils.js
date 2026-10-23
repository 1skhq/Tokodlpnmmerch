import { IMG, DOC } from "./config.js";

export const $ = (sel, root = document) => root.querySelector(sel);

export const esc = v =>
  String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");

// 0812... → 62812...
export const normWA = v => {
  const d = String(v || "").replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};

// Kode acak tanpa karakter yang mudah tertukar (0/O, 1/I)
export function genCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(8));
  return "TK-" + Array.from(r, x => abc[x % abc.length]).join("");
}

/* ---------- stok ---------- */
export const colorStock = c => (c?.sizes || []).reduce((t, z) => t + (Number(z.stock) || 0), 0);
export const productStock = p => (p.colors || []).reduce((t, c) => t + colorStock(c), 0);
export function sizeStock(p, colorName, size) {
  const c = (p.colors || []).find(x => x.name === colorName);
  const z = (c?.sizes || []).find(x => x.size === size);
  return Number(z?.stock) || 0;
}

/* ---------- pre-order ---------- */
export function isPOOpen(p) {
  if (!p.isPO || p.poClosed) return false;
  if (p.poDeadline && new Date(p.poDeadline + "T23:59:59") < new Date()) return false;
  if (p.poQuota > 0 && (p.poSold || 0) >= p.poQuota) return false;
  return true;
}
export const isAvailable = p => (p.isPO ? isPOOpen(p) : productStock(p) > 0);
export const daysLeft = d => Math.ceil((new Date(d + "T23:59:59") - new Date()) / 864e5);
export const sisaKuota = p => (p.poQuota > 0 ? Math.max(0, p.poQuota - (p.poSold || 0)) : null);

/* ---------- notifikasi & clipboard ---------- */
export function toast(msg, type = "info") {
  const t = $("#toast");
  t.textContent = msg;
  t.dataset.type = type;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2800);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Tersalin ✓", "ok");
  } catch {
    toast("Gagal menyalin. Salin manual: " + text, "warn");
  }
}

/* ---------- foto: kompres di browser → base64 ---------- */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, IMG.maxPx / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);

        let q = IMG.quality;
        let out = c.toDataURL("image/jpeg", q);
        while (out.length > IMG.targetChars && q > 0.3) {
          q = +(q - 0.1).toFixed(1);
          out = c.toDataURL("image/jpeg", q);
        }
        if (out.length > IMG.targetChars) toast("Foto masih besar. Pertimbangkan foto lain.", "warn");
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- batas ukuran dokumen Firestore ---------- */
export function checkDocSize(obj) {
  const bytes = new Blob([JSON.stringify(obj)]).size;
  if (bytes > DOC.maxBytes) {
    toast("Data lebih dari 1MB. Kurangi jumlah atau ukuran foto.", "error");
    return false;
  }
  if (bytes > DOC.warnBytes) toast("Peringatan: data mendekati batas 1MB.", "warn");
  return true;
}

/* ---------- harga diskon ---------- */
// Harga yang dibayar pembeli: harga diskon bila valid, jika tidak harga asli
export const hargaJual = p =>
  p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;

// Persentase diskon (0 jika tidak diskon)
export const persenDiskon = p =>
  hargaJual(p) < p.price ? Math.round((1 - hargaJual(p) / p.price) * 100) : 0;

