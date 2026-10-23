import { $, esc, toast, copyText, compressImage, checkDocSize, genCode, isPOOpen, sizeStock, hargaJual } from "./utils.js";
import { STATUS, KATEGORI_AWAL, LIMITS, CONTACT } from "./config.js";
import * as api from "./data.js";
import { getCart, addItem, setQty, removeItem, clearCart, cartCount, cartTotal } from "./cart.js";
import * as B from "./buyer.js";
import * as A from "./admin.js";
import { pasangAutocomplete } from "./address.js";
import { ic } from "./icons.js";


const DEFAULT_FORM = { pay: "Transfer Bank", rekIdx: 0, nama: "", phone: "", kota: "", alamat: "", detail: "", catatan: "", poOk: false };

/* ---------- STATE ---------- */
const S = {
  products: [], store: {}, banner: [], loading: true, error: false,
  search: "", cat: "Semua",
  pick: { pid: "", color: "", size: "", qty: 1 },
  form: { ...DEFAULT_FORM },
  direct: null,                 // barang untuk "Beli Langsung" (tidak masuk keranjang)
  track: null, trackCode: "",
  last: null,
  user: undefined, orders: [], orderSel: null, tab: "dashboard",
  draft: null, filter: { q: "", status: "", po: false, range: "" }, imgTmp: {},
};

/* ---------- ROUTING ---------- */
const route = () => {
  const [name = "", arg = ""] = location.hash.replace(/^#\/?/, "").split("/");
  return { name, arg: decodeURIComponent(arg) };
};
const curProduct = () => S.products.find(p => p.id === route().arg);

/* ---------- ERROR ---------- */
function authMsg(e) {
  const map = {
    "auth/invalid-credential": "Email atau password salah.",
    "auth/wrong-password": "Email atau password salah.",
    "auth/user-not-found": "Email atau password salah.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/network-request-failed": "Koneksi bermasalah. Periksa internet Anda.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba beberapa menit lagi.",
    "auth/unauthorized-domain": "Domain ini belum diizinkan. Tambahkan di Authentication > Settings > Authorized domains.",
  };
  return map[e.code] || "Login gagal. Coba lagi.";
}

function handleErr(e) {
  console.error(e);
  const code = String(e?.code || "");
  const msg = code === "permission-denied"
    ? "Akses ditolak. Pastikan login admin dan Security Rules sudah benar."
    : code.startsWith("auth/") ? authMsg(e)
    : "Koneksi bermasalah. Periksa internet lalu coba lagi.";
  toast(msg, "error");
}

/* ---------- DATA ---------- */
async function loadProducts() {
  S.loading = true;
  try { S.products = await api.fetchProducts(); S.error = false; }
  catch (e) { S.error = true; handleErr(e); }
  finally { S.loading = false; }
}

async function loadStore() {
  try { S.store = await api.fetchStore(); }
  catch (e) { handleErr(e); }
  try { S.banner = await api.fetchBanner(); }
  catch (e) { console.error(e); }
}

/* Rentang tanggal untuk filter pesanan di server */
function rangeSince(r) {
  const now = new Date();
  if (r === "bulan") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (r === "30") return new Date(Date.now() - 30 * 864e5);
  if (r === "365") return new Date(Date.now() - 365 * 864e5);
  return null;
}

let unwatch = null;
function startWatch() {
  if (unwatch) return;
  unwatch = api.watchOrders({ since: rangeSince(S.filter.range) }, list => {
    S.orders = list;
    if (route().name === "admin" && ["dashboard", "orders"].includes(S.tab)) render();
  }, handleErr);
}
function stopWatch() {
  unwatch?.();
  unwatch = null;
  S.orders = [];
}
function restartWatch() {
  stopWatch();
  if (S.user) startWatch();
}

/* Hapus pesanan > 1 tahun. Dijalankan sekali per sesi admin. */
let purged = false;
async function runPurge() {
  if (purged) return;
  purged = true;
  try {
    const n = await api.purgeOldOrders(LIMITS.retainDays);
    if (n) toast(`${n} pesanan lebih dari 1 tahun dihapus otomatis`, "info");
  } catch (e) {
    console.error(e);
  }
}

/* ---------- HELPER PRODUK ---------- */
function firstSize(p, colorName) {
  const c = p.colors.find(x => x.name === colorName);
  const z = (c?.sizes || []).find(z => p.isPO || Number(z.stock) > 0);
  return z?.size || "";
}

function ensurePick(p) {
  if (S.pick.pid === p.id) return;
  const c = p.colors.find(x => firstSize(p, x.name)) || p.colors[0];
  S.pick = { pid: p.id, color: c?.name || "", size: firstSize(p, c?.name), qty: 1 };
}

function uniqueSizes(list) {
  const seen = new Set();
  return list.filter(z => {
    if (!z.size || seen.has(z.size)) return false;
    seen.add(z.size);
    return true;
  });
}

function blankProduct() {
  return {
    id: null, name: "", price: 0, category: S.store.kategori?.[0] || KATEGORI_AWAL[0], description: "",
    images: [], isPO: false, poEstimate: "", poDeadline: "", poQuota: 0, poSold: 0, poNote: "", poClosed: false,
    colors: [{ name: "", hex: "#111111", image: "", sizes: [{ size: "S", stock: 0 }] }],
  };
}

/* ---------- RENDER ---------- */
function topbar(admin) {
  const logo = S.store.logo
    ? `<img class="logo" src="${S.store.logo}" alt="">`
    : `<span class="logo-ph">${ic("store", 18)}</span>`;
  const brand = `<a class="brand" href="#/">${logo}<span>${esc(S.store.storeName || "Dlpnm Merch")}</span></a>`;
  if (admin) return brand + `<span class="small muted">Admin</span>`;
  const n = cartCount();
  return brand + `
    <div class="row">
      <a class="icon-btn" href="#/cek" aria-label="Cek pesanan">${ic("box", 22)}</a>
      <a class="icon-btn" href="#/keranjang" aria-label="Keranjang">${ic("cart", 22)}${n ? `<i class="count">${n}</i>` : ""}</a>
    </div>`;
}

function bottomNav(name) {
  const active = { "": "", produk: "", keranjang: "keranjang", checkout: "keranjang", cek: "cek", sukses: "" }[name] ?? "";
  return [["", "home", "Beranda"], ["keranjang", "cart", "Keranjang"], ["cek", "box", "Cek Pesanan"]]
    .map(([h, i, l]) => `<a href="#/${h}" class="${h === active ? "on" : ""}">${ic(i, 22)}<span>${l}</span></a>`)
    .join("");
}

function buyerView(r) {
  switch (r.name) {
    case "produk": {
      const p = curProduct();
      if (p) ensurePick(p);
      return B.viewProduct(p, S);
    }
    case "keranjang": return B.viewCart(S);
    case "checkout": return B.viewCheckout(S, S.direct ? [S.direct] : getCart());
    case "sukses": return S.last ? B.viewSuccess(S.last, S.store) : B.viewHome(S);
    case "cek": return B.viewTrack(S);
    default: return B.viewHome(S);
  }
}

function adminView() {
  if (S.user === undefined) return B.skeleton();
  if (!S.user) return A.viewLogin();
  return A.viewAdmin(S);
}

function render() {
  const r = route();
  const admin = r.name === "admin";
  $("#topbar").innerHTML = topbar(admin);
  const nav = $("#bottomnav");
  nav.hidden = admin;
  nav.innerHTML = admin ? "" : bottomNav(r.name);
  $("#app").innerHTML = admin ? adminView() : buyerView(r);
  renderFab(admin);

  if (r.name === "checkout" && $("#kota")) {
    pasangAutocomplete($("#kota"), $("#kota-list"), v => { S.form.kota = v; });
  }
}

/* Tombol WhatsApp melayang: selalu tampil di halaman pembeli */
function renderFab(admin) {
  let fab = document.getElementById("wa-fab");
  if (admin) { fab?.remove(); return; }
  if (!fab) {
    fab = document.createElement("a");
    fab.id = "wa-fab";
    fab.className = "wa-fab";
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.setAttribute("aria-label", "Chat WhatsApp");
    document.body.appendChild(fab);
  }
  fab.href = `https://wa.me/${CONTACT.wa}`;
  fab.innerHTML = ic("chat", 26);
}

function refreshOrders() {
  const l = $("#olist");
  if (l) l.innerHTML = A.orderListHTML(S);
}

/* ---------- KERANJANG & BELI LANGSUNG ---------- */
function validatePick() {
  const p = curProduct();
  const { color, size, qty } = S.pick;
  if (!p) return null;
  if (!size) { toast("Pilih ukuran dulu", "warn"); return null; }
  if (p.isPO && !isPOOpen(p)) { toast("PO untuk produk ini sudah ditutup", "warn"); return null; }
  const stock = p.isPO ? 99 : sizeStock(p, color, size);
  if (!p.isPO && stock <= 0) { toast("Ukuran ini sedang habis", "warn"); return null; }
  return { p, color, size, qty, stock };
}

function addToCart() {
  const v = validatePick();
  if (!v) return;
  const { p, color, size, qty, stock } = v;
  const key = [p.id, color, size].join("|");
  const inCart = getCart().find(i => i.key === key)?.qty || 0;
  if (!p.isPO && inCart + qty > stock) {
    return toast(`Sisa stok untuk pilihan ini ${stock - inCart}`, "warn");
  }
  addItem({ product: p, color, size, qty, stock });
  S.pick.qty = 1;
  toast("Masuk keranjang ✓", "ok");
  render();
}

function buyNow() {
  const v = validatePick();
  if (!v) return;
  const { p, color, size, qty, stock } = v;
  if (!p.isPO && qty > stock) return toast(`Stok tersisa ${stock}`, "warn");
  S.direct = {
    key: [p.id, color, size].join("|"), id: p.id, name: p.name,     id: p.id, name: p.name, price: hargaJual(p),
    color, size, qty, isPO: !!p.isPO, poEstimate: p.poEstimate || "",
  };
  S.pick.qty = 1;
  location.hash = "#/checkout";
}

async function trackOrder() {
  const code = ($("#tcode")?.value || "").trim().toUpperCase();
  S.trackCode = code;
  if (!code) return toast("Masukkan kode pesanan", "warn");

  S.track = { status: "loading" };
  render();
  try {
    const d = await api.fetchOrder(code);
    S.track = d.exists() ? { status: "ok", order: d.data() } : { status: "notfound" };
  } catch (e) {
    handleErr(e);
    S.track = { status: "error" };
  }
  render();
}

async function submitOrder() {
  const f = S.form;
  const wasDirect = !!S.direct;
  const items = wasDirect ? [S.direct] : getCart();
  if (!items.length) { location.hash = "#/keranjang"; return; }

  const nama = (f.nama || "").trim();
  const phone = (f.phone || "").replace(/\D/g, "");
  const kota = (f.kota || "").trim();
  const alamat = (f.alamat || "").trim();
  if (!nama) return toast("Isi nama lengkap", "warn");
  if (phone.length < 9) return toast("Nomor WhatsApp belum valid", "warn");
  if (!alamat) return toast("Isi alamat lengkap", "warn");
  if (!kota) return toast("Isi kota / kabupaten", "warn");

  const hasPO = items.some(i => i.isPO);
  if (hasPO && !f.poOk) return toast("Centang persetujuan Pre-Order dulu", "warn");

  for (const i of items) {
    const p = S.products.find(x => x.id === i.id);
    if (!p) return toast(`${i.name} sudah tidak tersedia. Hapus dari keranjang.`, "error");
    if (p.isPO && !isPOOpen(p)) return toast(`PO ${p.name} sudah ditutup. Hapus dari keranjang.`, "warn");
    if (!p.isPO && sizeStock(p, i.color, i.size) < i.qty) {
      return toast(`Stok ${i.name} (${i.color}, ${i.size}) tidak cukup. Ubah jumlahnya.`, "warn");
    }
  }

  const list = A.rekeningList(S.store);
  const rek = list[Math.min(+f.rekIdx || 0, list.length - 1)];
  const payment = f.pay === "QRIS" ? "QRIS" : rek ? `Transfer ${rek.name} ${rek.number}` : "Transfer Bank";

  const code = genCode();
  const order = {
    code,
    customer: {
      name: nama, phone, kota, alamat,
      detail: (f.detail || "").trim(),
      catatan: (f.catatan || "").trim(),
    },
        items: items.map(({ name, color, size, qty, price, isPO, poEstimate }) =>
      ({ name, color, size, qty, price, isPO, poEstimate })),
    total: cartTotal(items),
    payment,
    status: STATUS[0],
    hasPO,
    poEstimate: [...new Set(items.filter(i => i.isPO).map(i => i.poEstimate).filter(Boolean))].join("; "),
    courier: "",
    trackingNumber: "",
    createdAt: api.serverTimestamp(),
    updatedAt: api.serverTimestamp(),
  };
  if (!checkDocSize(order)) return;

  const btn = $("#btn-submit");
  if (btn) { btn.disabled = true; btn.textContent = "Memproses…"; }

  try {
    await api.createOrder(code, order);
    S.last = { ...order, createdAt: null, updatedAt: null };
    if (!wasDirect) clearCart();
    S.direct = null;
    location.hash = "#/sukses";
  } catch (e) {
    handleErr(e);
    render();
  }
}

/* ---------- ADMIN ---------- */
async function doLogin() {
  const email = $("#l-email").value.trim();
  const pass = $("#l-pass").value;
  if (!email || !pass) return toast("Isi email dan password", "warn");
  try {
    await api.login(email, pass);
    toast("Login berhasil", "ok");
  } catch (e) {
    handleErr(e);
  }
}

/* Foto: bisa memilih banyak file sekaligus */
async function handleImage(t) {
  const files = [...(t.files || [])];
  if (!files.length) return;
  const k = t.dataset.img;
  try {
    if (k === "gallery") {
      S.draft = A.readProductForm(S.draft);
      const room = LIMITS.gallery - S.draft.images.length;
      if (room <= 0) return toast(`Maksimal ${LIMITS.gallery} foto per produk`, "warn");
      for (const f of files.slice(0, room)) S.draft.images.push(await compressImage(f));
      if (files.length > room) toast(`Hanya ${room} foto ditambahkan (maks ${LIMITS.gallery})`, "warn");
      return render();
    }

    if (k === "banner") {
      const room = LIMITS.banner - S.banner.length;
      if (room <= 0) return toast(`Maksimal ${LIMITS.banner} foto banner`, "warn");
      const next = [...S.banner];
      for (const f of files.slice(0, room)) next.push(await compressImage(f));
      if (!checkDocSize({ images: next })) return;
      await api.saveBanner(next);
      S.banner = next;
      toast("Banner ditambahkan", "ok");
      return render();
    }

    const url = await compressImage(files[0]);
    if (k === "color") {
      S.draft = A.readProductForm(S.draft);
      S.draft.colors[+t.dataset.i].image = url;
      render();
    } else {
      // logo / qris: pratinjau saja, disimpan lewat tombol Simpan pengaturan
      S.imgTmp[k] = url;
      const prev = $("#prev-" + k);
      if (prev) { prev.src = url; prev.hidden = false; }
      toast("Gambar siap. Klik Simpan pengaturan.", "ok");
    }
  } catch {
    toast("Gambar gagal dibaca. Coba file lain.", "error");
  }
}

async function saveProduct() {
  const d = A.readProductForm(S.draft);
  if (!d.name) return toast("Isi nama produk", "warn");
  if (!d.price) return toast("Isi harga produk", "warn");

  const colors = d.colors.map(c => ({
    name: c.name,
    hex: c.hex,
    image: c.image || "",
    sizes: uniqueSizes(c.sizes),
  }));
  if (colors.some(c => !c.name)) return toast("Setiap warna wajib diberi nama", "warn");
  if (!colors.some(c => c.sizes.length)) return toast("Tambahkan minimal satu ukuran beserta stoknya", "warn");

  const data = {
    name: d.name,
    price: d.price,
    category: d.category,
    description: d.description,
    images: d.images.slice(0, LIMITS.gallery),
    colors,
    isPO: d.isPO,
    poEstimate: d.isPO ? d.poEstimate : "",
    poDeadline: d.isPO ? d.poDeadline : "",
    poQuota: d.isPO ? d.poQuota : 0,
    poSold: d.isPO ? d.poSold : 0,
    poNote: d.isPO ? d.poNote : "",
    poClosed: !!d.poClosed,
  };
  if (!checkDocSize(data)) return;

  try {
    await api.saveProduct(d.id || null, data);
    S.draft = null;
    await loadProducts();
    toast("Produk tersimpan", "ok");
    render();
  } catch (e) {
    handleErr(e);
  }
}

async function seedProducts() {
  if (!confirm("Tambah 6 produk contoh?")) return;
  const dl = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const col = (name, hex, stock, sizes = ["S", "M", "L", "XL"]) =>
    ({ name, hex, image: "", sizes: sizes.map(size => ({ size, stock })) });
  const base = {
    description: "Contoh produk untuk percobaan.", images: [], isPO: false,
    poEstimate: "", poDeadline: "", poQuota: 0, poSold: 0, poNote: "", poClosed: false,
  };
  const po = {
    isPO: true, poEstimate: "14 hari kerja setelah PO ditutup", poDeadline: dl,
    poQuota: 30, poSold: 5, poNote: "Produksi dimulai setelah PO ditutup",
  };
  const samples = [
    { name: "Kaos Polos Basic", price: 89000, category: "Kaos", colors: [col("Hitam", "#111111", 10), col("Putih", "#f9fafb", 8)] },
    { name: "Kemeja Linen", price: 189000, category: "Kemeja", colors: [col("Krem", "#e7d9b8", 5), col("Biru Dongker", "#1e3a8a", 3)] },
    { name: "Hoodie Oversize", price: 249000, category: "Jaket", colors: [col("Abu-abu", "#9ca3af", 6, ["M", "L", "XL", "XXL"])] },
    { name: "Celana Chino", price: 199000, category: "Celana", colors: [col("Khaki", "#c2a878", 7, ["28", "30", "32", "34"])] },
    { name: "Jaket Varsity (PO)", price: 329000, category: "Jaket", ...po, colors: [col("Merah", "#b91c1c", 0), col("Navy", "#1e3a8a", 0)] },
    { name: "Kaos Edisi Terbatas (PO)", price: 139000, category: "Kaos", ...po, colors: [col("Hitam", "#111111", 0)] },
  ];
  try {
    for (const s of samples) await api.saveProduct(null, { ...base, ...s });
    toast("Data contoh dibuat", "ok");
    await loadProducts();
    render();
  } catch (e) {
    handleErr(e);
  }
}

async function saveCustomer(id) {
  const v = k => $("#ec-" + k).value.trim();
  const phone = v("phone").replace(/\D/g, "");
  if (!v("name")) return toast("Nama tidak boleh kosong", "warn");
  if (phone.length < 9) return toast("Nomor WhatsApp belum valid", "warn");
  if (!v("alamat")) return toast("Alamat tidak boleh kosong", "warn");
  if (!v("kota")) return toast("Kota tidak boleh kosong", "warn");

  const customer = {
    name: v("name"), phone, kota: v("kota"), alamat: v("alamat"),
    detail: v("detail"), catatan: v("catatan"),
  };
  try {
    await api.updateOrder(id, { customer, updatedAt: api.serverTimestamp() });
    toast("Data pelanggan diperbarui", "ok");
  } catch (e) {
    handleErr(e);
  }
}

async function saveOrder(id) {
  const status = $("#ds").value;
  const courier = $("#dk").value.trim();
  const trackingNumber = $("#dr").value.trim();
  if (status === "Dikirim" && !trackingNumber) return toast("Isi nomor resi untuk status Dikirim", "warn");
  try {
    await api.updateOrder(id, { status, courier, trackingNumber, updatedAt: api.serverTimestamp() });
    toast("Pesanan diperbarui", "ok");
  } catch (e) {
    handleErr(e);
  }
}

function readRekening() {
  const n = document.querySelectorAll("#rek-list .color-block").length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = k => $(`#rb-${k}-${i}`)?.value.trim() || "";
    const r = { name: v("name"), number: v("num").replace(/\s/g, ""), holder: v("holder") };
    if (r.name || r.number) out.push(r);
  }
  return out;
}

function readKategori() {
  const n = document.querySelectorAll("#kat-list input").length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = $("#kat-" + i)?.value.trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

async function saveSettings() {
  const v = id => $("#" + id).value.trim();
  const rekening = readRekening();
  const kategori = readKategori();
  const data = {
    storeName: v("s-name"),
    adminWa: v("s-wa"),
    rekening,
    bank: rekening[0] || { name: "", number: "", holder: "" },
    kategori,
    logo: S.imgTmp.logo ?? S.store.logo ?? "",
    qris: S.imgTmp.qris ?? S.store.qris ?? "",
  };
  if (!data.storeName) return toast("Dlpnm Merch", "warn");
  if (data.adminWa && normalizeLen(data.adminWa) < 10) return toast("Nomor WA tidak valid", "warn");
  if (!kategori.length) return toast("Minimal satu kategori", "warn");
  if (!checkDocSize(data)) return;
  try {
    await api.saveStore(data);
    S.store = data;
    S.imgTmp = {};
    toast("Pengaturan tersimpan", "ok");
    render();
  } catch (e) {
    handleErr(e);
  }
}
const normalizeLen = s => String(s).replace(/\D/g, "").length;

/* ---------- AKSI (data-act) ---------- */
const actions = {
  reload: async () => { await loadProducts(); render(); },
  cat: el => { S.cat = el.dataset.val; render(); },

  "pick-color": el => {
    const p = curProduct();
    S.pick = { pid: p.id, color: el.dataset.val, size: firstSize(p, el.dataset.val), qty: 1 };
    render();
  },
  "pick-size": el => { S.pick.size = el.dataset.val; S.pick.qty = 1; render(); },
  qty: el => {
    const p = curProduct();
    const max = p.isPO ? 99 : sizeStock(p, S.pick.color, S.pick.size);
    S.pick.qty = Math.min(Math.max(1, max), Math.max(1, S.pick.qty + Number(el.dataset.d)));
    render();
  },
  add: () => addToCart(),
  "buy-now": () => buyNow(),

  "cart-qty": el => {
    const item = getCart().find(i => i.key === el.dataset.key);
    if (!item) return;
    const p = S.products.find(x => x.id === item.id);
    const max = !p ? item.qty : p.isPO ? 99 : sizeStock(p, item.color, item.size);
    const delta = Number(el.dataset.d);
    if (delta > 0 && item.qty >= max) return toast(`Stok maksimal ${max}`, "warn");
    setQty(item.key, Math.max(1, Math.min(max, item.qty + delta)));
    render();
  },
  "cart-del": el => { removeItem(el.dataset.key); render(); },

  copy: el => copyText(el.dataset.val),
  track: () => trackOrder(),
  submit: () => submitOrder(),

  login: () => doLogin(),
  logout: () => api.logout(),
  tab: el => { S.tab = el.dataset.val; S.draft = null; S.orderSel = null; render(); },

  "new-product": () => { S.draft = blankProduct(); render(); },
  "edit-product": el => {
    const p = S.products.find(x => x.id === el.dataset.id);
    if (!p) return;
    S.draft = JSON.parse(JSON.stringify(p));
    render();
  },
  "cancel-product": () => { S.draft = null; render(); },
  "del-photo": el => {
    S.draft = A.readProductForm(S.draft);
    S.draft.images.splice(+el.dataset.i, 1);
    render();
  },
  "add-color": () => {
    S.draft = A.readProductForm(S.draft);
    S.draft.colors.push({ name: "", hex: "#111111", image: "", sizes: [] });
    render();
  },
  "del-color": el => {
    S.draft = A.readProductForm(S.draft);
    S.draft.colors.splice(+el.dataset.i, 1);
    render();
  },
  "add-size": el => {
    S.draft = A.readProductForm(S.draft);
    S.draft.colors[+el.dataset.i].sizes.push({ size: "", stock: 0 });
    render();
  },
  "preset-size": el => {
    S.draft = A.readProductForm(S.draft);
    const c = S.draft.colors[+el.dataset.i];
    if (!c.sizes.some(z => z.size === el.dataset.val)) c.sizes.push({ size: el.dataset.val, stock: 0 });
    render();
  },
  "del-size": el => {
    S.draft = A.readProductForm(S.draft);
    S.draft.colors[+el.dataset.i].sizes.splice(+el.dataset.j, 1);
    render();
  },
  "save-product": () => saveProduct(),
  "toggle-po": async el => {
    const p = S.products.find(x => x.id === el.dataset.id);
    if (!p) return;
    try {
      await api.saveProduct(p.id, { poClosed: !p.poClosed });
      toast(p.poClosed ? "PO dibuka" : "PO ditutup", "ok");
      await loadProducts();
      render();
    } catch (e) { handleErr(e); }
  },
  "del-product": async el => {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await api.removeProduct(el.dataset.id);
      toast("Produk dihapus", "ok");
      await loadProducts();
      render();
    } catch (e) { handleErr(e); }
  },
  seed: () => seedProducts(),

  "open-order": el => { S.tab = "orders"; S.orderSel = el.dataset.id; render(); },
  "close-order": () => { S.orderSel = null; render(); },
  "save-order": el => saveOrder(el.dataset.id),
  "save-customer": el => saveCustomer(el.dataset.id),
  "save-settings": () => saveSettings(),

  "del-banner": async el => {
    if (!confirm("Hapus foto banner ini?")) return;
    const next = S.banner.filter((_, n) => n !== +el.dataset.i);
    try {
      await api.saveBanner(next);
      S.banner = next;
      toast("Banner dihapus", "ok");
      render();
    } catch (e) { handleErr(e); }
  },

  "add-rek": () => {
    const cur = readRekening();
    S.store = { ...S.store, rekening: [...cur, { name: "", number: "", holder: "" }] };
    render();
  },
  "del-rek": el => {
    const cur = readRekening();
    cur.splice(+el.dataset.i, 1);
    S.store = { ...S.store, rekening: cur };
    render();
  },

  "add-kat": () => {
    S.store = { ...S.store, kategori: [...readKategori(), ""] };
    render();
  },
  "del-kat": el => {
    const cur = readKategori();
    cur.splice(+el.dataset.i, 1);
    S.store = { ...S.store, kategori: cur };
    render();
  },
};

/* ---------- EVENT DELEGATION ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  try { await fn(el); }
  catch (err) { handleErr(err); }
});

// Titik slide mengikuti posisi geser (scroll tidak naik ke atas, jadi pakai capture)
document.addEventListener("scroll", e => {
  const t = e.target;
  if (!t.classList?.contains("track")) return;
  const i = Math.round(t.scrollLeft / (t.clientWidth || 1));
  t.parentElement.querySelectorAll(".dots i").forEach((d, n) => d.classList.toggle("on", n === i));
}, true);

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") {
    S.search = t.value;
    const g = $("#grid");
    if (g) g.innerHTML = B.gridHTML(S);
    return;
  }
  if (t.id === "tcode") { S.trackCode = t.value; return; }
  if (t.dataset.filter === "q") { S.filter.q = t.value; refreshOrders(); return; }
  if (t.hasAttribute("data-form") && t.type !== "radio" && t.type !== "checkbox") {
    S.form[t.name] = t.value;
  }
});

document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset.toggle === "po") {
    S.draft = A.readProductForm(S.draft);
    S.draft.isPO = t.checked;
    return render();
  }
  if (t.dataset.img) return handleImage(t);
  if (t.dataset.filter === "range") {
    S.filter.range = t.value;
    restartWatch();
    return refreshOrders();
  }
  if (t.dataset.filter === "status") { S.filter.status = t.value; return refreshOrders(); }
  if (t.dataset.filter === "po") { S.filter.po = t.checked; return refreshOrders(); }
  if (t.name === "rekIdx") { S.form.rekIdx = +t.value; return render(); }
  if (t.hasAttribute("data-form")) {
    if (t.type === "radio") { S.form.pay = t.value; return render(); }
    if (t.type === "checkbox") S.form[t.name] = t.checked;
    else S.form[t.name] = t.value;
  }
});

addEventListener("hashchange", () => {
  // Beli langsung hanya berlaku selama di halaman checkout
  const n = route().name;
  if (n !== "checkout" && n !== "sukses") S.direct = null;
  window.scrollTo(0, 0);
  render();
});

/* ---------- START ---------- */
render();
Promise.all([loadProducts(), loadStore()]).then(render);

api.onUser(user => {
  S.user = user || null;
  if (user) {
    startWatch();
    runPurge();
  } else {
    stopWatch();
    purged = false;
  }
  render();
});
