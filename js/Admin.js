import { ic } from "./icons.js";
import { esc, rp, normWA, productStock, isPOOpen } from "./utils.js";
import { STATUS, SIZE_PRESET, KATEGORI } from "./config.js";
import { media, swatches } from "./buyer.js";

const TABS = [
  ["dashboard", "Ringkasan", "dashboard"],
  ["products", "Produk", "tag"],
  ["orders", "Pesanan", "list"],
  ["settings", "Toko", "store"],
];

const tsMs = ts => (ts?.toMillis ? ts.toMillis() : Date.now());

/* ---------- LOGIN ---------- */
export function viewLogin() {
  return `
    <div class="panel login">
      <div class="login-ic">${ic("lock", 28)}</div>
      <h2>Login Admin</h2>
      <p class="muted">Halaman ini khusus pemilik toko.</p>
      <label>Email<input id="l-email" type="email" autocomplete="username"></label>
      <label>Password<input id="l-pass" type="password" autocomplete="current-password"></label>
      <button class="btn block" data-act="login">Masuk</button>
    </div>`;
}

/* ---------- SHELL ---------- */
export function viewAdmin(S) {
  const body = { dashboard, products, orders, settings }[S.tab] || dashboard;
  return `
    <div class="admin-head">
      <div class="small muted">${ic("user", 16)} ${esc(S.user.email)}</div>
      <button class="btn ghost sm" data-act="logout">${ic("logout", 16)} Keluar</button>
    </div>
    <nav class="admin-tabs">
      ${TABS.map(([k, l, i]) => `<button class="tab ${S.tab === k ? "on" : ""}" data-act="tab" data-val="${k}">${ic(i, 20)}<span>${l}</span></button>`).join("")}
    </nav>
    <div>${body(S)}</div>`;
}

/* ---------- RINGKASAN ---------- */
function dashboard(S) {
  const now = Date.now(), o = S.orders;
  const cards = [
    ["cart", "Pesanan baru (24 jam)", o.filter(x => now - tsMs(x.createdAt) < 864e5).length, "blue"],
    ["wallet", "Belum dibayar", o.filter(x => x.status === "Menunggu Pembayaran").length, "amber"],
    ["truck", "Perlu dikirim", o.filter(x => ["Pembayaran Diterima", "Diproses"].includes(x.status)).length, "green"],
    ["calendar", "PO aktif", o.filter(x => x.hasPO && x.status !== "Selesai").length, "purple"],
  ];
  return `
    <div class="stat-grid">
      ${cards.map(([i, l, n, c]) => `<div class="stat ${c}"><div class="stat-ic">${ic(i, 20)}</div><b>${n}</b><span>${l}</span></div>`).join("")}
    </div>
    <h3 class="section">Pesanan terbaru</h3>
    ${o.length ? o.slice(0, 5).map(orow).join("") : `<p class="muted">Belum ada pesanan.</p>`}`;
}

export function orow(o) {
  return `
    <button class="orow" data-act="open-order" data-id="${esc(o.id)}">
      <div class="grow">
        <div class="row"><b>${esc(o.code)}</b>${o.hasPO ? `<span class="badge po">PO</span>` : ""}</div>
        <small class="muted">${esc(o.customer?.name || "-")} · ${rp(o.total)}</small>
      </div>
      <span class="st-chip st-${STATUS.indexOf(o.status)}">${esc(o.status)}</span>
    </button>`;
}

/* ---------- PRODUK ---------- */
function products(S) {
  if (S.draft) return productForm(S.draft);
  return `
    <div class="btn-row">
      <button class="btn" data-act="new-product">${ic("plus", 18)} Tambah produk</button>
      <button class="btn ghost" data-act="seed">${ic("spark", 18)} Isi data contoh</button>
    </div>
    <h3 class="section">${S.products.length} produk</h3>
    <div class="stack">${S.products.map(prow).join("") || `<p class="muted">Belum ada produk.</p>`}</div>`;
}

function prow(p) {
  const status = p.isPO ? (isPOOpen(p) ? "PO buka" : "PO tutup") : `stok ${productStock(p)}`;
  return `
    <div class="prow">
      <div class="thumb sm">${media(p.image, p.colors?.[0]?.hex, 40)}</div>
      <div class="grow">
        <div class="row"><b>${esc(p.name)}</b>${p.isPO ? `<span class="badge po">PO</span>` : ""}</div>
        <small class="muted">${rp(p.price)} · ${(p.colors || []).length} warna · ${status}</small>
        <div class="swatches">${swatches(p.colors)}</div>
      </div>
      <div class="prow-act">
        <button class="icon-btn" data-act="edit-product" data-id="${p.id}" aria-label="Edit">${ic("edit", 18)}</button>
        ${p.isPO ? `<button class="icon-btn" data-act="toggle-po" data-id="${p.id}" aria-label="${p.poClosed ? "Buka PO" : "Tutup PO"}">${ic(p.poClosed ? "check" : "lock", 18)}</button>` : ""}
        <button class="icon-btn danger" data-act="del-product" data-id="${p.id}" aria-label="Hapus">${ic("trash", 18)}</button>
      </div>
    </div>`;
}

export function productForm(d) {
  return `
    <div class="panel" id="pform">
      <h3>${d.id ? "Edit produk" : "Produk baru"}</h3>
      <label>Nama produk<input id="pf-name" value="${esc(d.name)}" placeholder="Contoh: Kaos Polos Basic"></label>
      <div class="two">
        <label>Harga (Rp)<input id="pf-price" type="number" inputmode="numeric" min="0" value="${d.price || ""}"></label>
        <label>Kategori<select id="pf-cat">${KATEGORI.map(k => `<option ${d.category === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
      </div>
      <label>Deskripsi<textarea id="pf-desc" rows="3">${esc(d.description)}</textarea></label>

      <div class="upload-block">
        ${d.image ? `<img class="preview" src="${d.image}" alt="">` : ""}
        <label class="upload">${ic("image", 18)}<span>${d.image ? "Ganti foto utama" : "Foto utama (opsional)"}</span>
          <input class="sr-only" type="file" accept="image/*" data-img="main">
        </label>
      </div>

      <label class="ck"><input id="pf-po" type="checkbox" data-toggle="po" ${d.isPO ? "checked" : ""}> Produk Pre-Order (PO)</label>
      ${d.isPO ? poFields(d) : ""}

      <div class="section">Warna & stok per ukuran</div>
      ${d.colors.map(colorBlock).join("")}
      <button class="btn ghost block" data-act="add-color">${ic("plus", 18)} Tambah warna</button>

      <div class="btn-row">
        <button class="btn grow" data-act="save-product">${ic("check", 18)} Simpan produk</button>
        <button class="btn ghost" data-act="cancel-product">Batal</button>
      </div>
    </div>`;
}

function poFields(d) {
  return `
    <div class="panel" style="background:#fafaff">
      <label>Estimasi pengiriman<input id="pf-estimasi" value="${esc(d.poEstimate)}" placeholder="14 hari kerja setelah PO ditutup"></label>
      <div class="two">
        <label>Tanggal tutup PO<input id="pf-tutup" type="date" value="${esc(d.poDeadline)}"></label>
        <label>Kuota PO<input id="pf-kuota" type="number" inputmode="numeric" min="0" value="${d.poQuota || ""}" placeholder="kosong = tanpa batas"></label>
      </div>
      <div class="two">
        <label>Terjual (isi manual)<input id="pf-terjual" type="number" min="0" value="${d.poSold || 0}"></label>
        <label>Catatan PO<input id="pf-catatan" value="${esc(d.poNote)}"></label>
      </div>
    </div>`;
}

function colorBlock(c, i) {
  return `
    <div class="color-block">
      <div class="row">
        <input id="c-hex-${i}" class="colorpick" type="color" value="${esc(c.hex || "#111111")}" aria-label="Warna">
        <input id="c-name-${i}" class="grow" placeholder="Nama warna, contoh: Hitam" value="${esc(c.name)}">
        <button class="icon-btn danger" data-act="del-color" data-i="${i}" aria-label="Hapus warna">${ic("trash", 18)}</button>
      </div>
      <label class="upload">${c.image ? `<img src="${c.image}" alt="">` : ic("image", 18)}
        <span>${c.image ? "Ganti foto warna ini" : "Foto khusus warna ini (opsional)"}</span>
        <input class="sr-only" type="file" accept="image/*" data-img="color" data-i="${i}">
      </label>
      <div class="size-head"><span>Ukuran</span><span>Stok</span><span></span></div>
      ${c.sizes.map((z, j) => `
        <div class="size-row">
          <input id="z-size-${i}-${j}" value="${esc(z.size)}" placeholder="S / XL / 32">
          <input id="z-stock-${i}-${j}" type="number" inputmode="numeric" min="0" value="${Number(z.stock) || 0}">
          <button class="icon-btn danger" data-act="del-size" data-i="${i}" data-j="${j}" aria-label="Hapus ukuran">${ic("x", 16)}</button>
        </div>`).join("")}
      <div class="presets">
        ${SIZE_PRESET.map(s => `<button class="chip sm" data-act="preset-size" data-i="${i}" data-val="${s}">+${s}</button>`).join("")}
        <button class="chip sm" data-act="add-size" data-i="${i}">${ic("plus", 14)} Ukuran custom</button>
      </div>
    </div>`;
}

/* ---------- PESANAN ---------- */
export function orderListHTML(S) {
  const f = S.filter, q = f.q.trim().toLowerCase();
  const list = S.orders.filter(o =>
    (!f.status || o.status === f.status) &&
    (!f.po || o.hasPO) &&
    `${o.code} ${o.customer?.name || ""}`.toLowerCase().includes(q)
  );
  return list.length ? list.map(orow).join("") : `<p class="muted">Tidak ada pesanan yang cocok.</p>`;
}

function orders(S) {
  const f = S.filter;
  const sel = S.orderSel ? S.orders.find(o => o.id === S.orderSel) : null;
  return `
    ${sel ? orderDetail(sel, S) : ""}
    <div class="searchbar">${ic("search", 18)}<input data-filter="q" placeholder="Cari kode atau nama" value="${esc(f.q)}" autocomplete="off"></div>
    <div class="filters">
      <select data-filter="status">
        <option value="">Semua status</option>
        ${STATUS.map(s => `<option ${f.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <label class="chip ${f.po ? "on" : ""}" style="margin:0">
        <input class="sr-only" type="checkbox" data-filter="po" ${f.po ? "checked" : ""}>${ic("calendar", 14)} H
