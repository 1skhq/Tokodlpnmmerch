import { ic } from "./icons.js";
import { $, esc, rp, normWA, productStock, isPOOpen } from "./utils.js";
import { STATUS, SIZE_PRESET, KATEGORI_AWAL, LIMITS } from "./config.js";
import { media, swatches } from "./buyer.js";

const TABS = [
  ["dashboard", "Ringkasan", "dashboard"],
  ["products", "Produk", "tag"],
  ["orders", "Pesanan", "list"],
  ["settings", "Toko", "store"],
];

const RANGE = [
  ["", "100 terbaru"],
  ["bulan", "Bulan ini"],
  ["30", "30 hari terakhir"],
  ["365", "1 tahun terakhir"],
];

const tsMs = ts => (ts?.toMillis ? ts.toMillis() : Date.now());

/* ---------- daftar kategori ---------- */
export function kategoriList(S) {
  const saved = Array.isArray(S.store.kategori) && S.store.kategori.length
    ? S.store.kategori
    : KATEGORI_AWAL;
  const dipakai = S.products.map(p => p.category).filter(Boolean);
  return [...new Set([...saved, ...dipakai])];
}

/* ---------- rekening (format lama & baru) ---------- */
export function rekeningList(s) {
  if (Array.isArray(s.rekening)) return s.rekening;
  if (s.bank?.number) return [{ ...s.bank }];
  return [];
}

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
    <p class="muted small">Dihitung dari pesanan yang termuat (maks ${LIMITS.orders}).</p>
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
  if (S.draft) return productForm(S.draft, S);
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
      <div class="thumb sm">${media(p.images?.[0], p.colors?.[0]?.hex, 40)}</div>
      <div class="grow">
        <div class="row"><b>${esc(p.name)}</b>${p.isPO ? `<span class="badge po">PO</span>` : ""}</div>
        <small class="muted">${rp(p.price)} · ${esc(p.category || "-")} · ${(p.colors || []).length} warna · ${(p.images || []).length} foto · ${status}</small>
        <div class="swatches">${swatches(p.colors)}</div>
      </div>
      <div class="prow-act">
        <button class="icon-btn" data-act="edit-product" data-id="${esc(p.id)}" aria-label="Edit">${ic("edit", 18)}</button>
        ${p.isPO ? `<button class="icon-btn" data-act="toggle-po" data-id="${esc(p.id)}" aria-label="${p.poClosed ? "Buka PO" : "Tutup PO"}">${ic(p.poClosed ? "check" : "lock", 18)}</button>` : ""}
        <button class="icon-btn danger" data-act="del-product" data-id="${esc(p.id)}" aria-label="Hapus">${ic("trash", 18)}</button>
      </div>
    </div>`;
}

function galleryField(d) {
  const imgs = d.images || [];
  return `
    <div class="section">Foto produk <small class="muted">(${imgs.length}/${LIMITS.gallery}, foto pertama jadi sampul)</small></div>
    <div class="gal-edit">
      ${imgs.map((s, i) => `
        <div class="gthumb"><img src="${s}" alt="">
          <button class="gdel" data-act="del-photo" data-i="${i}" aria-label="Hapus foto">${ic("x", 14)}</button>
        </div>`).join("")}
      ${imgs.length < LIMITS.gallery ? `
        <label class="gadd">${ic("image", 22)}<span>Tambah</span>
          <input class="sr-only" type="file" accept="image/*" multiple data-img="gallery">
        </label>` : ""}
    </div>`;
}

export function productForm(d, S) {
  const kats = kategoriList(S);
  return `
    <div class="panel" id="pform">
      <h3>${d.id ? "Edit produk" : "Produk baru"}</h3>
      <label>Nama produk<input id="pf-name" value="${esc(d.name)}" placeholder="Contoh: Kaos Polos Basic"></label>
      <div class="two">
        <label>Harga (Rp)<input id="pf-price" type="number" inputmode="numeric" min="0" value="${d.price || ""}"></label>
        <label>Kategori<select id="pf-cat">${kats.map(k => `<option ${d.category === k ? "selected" : ""}>${esc(k)}</option>`).join("")}</select></label>
      </div>
      <label>Deskripsi<textarea id="pf-desc" rows="3">${esc(d.description)}</textarea></label>

      ${galleryField(d)}

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

/* Membaca nilai form dari DOM ke objek draft (images ikut terbawa lewat spread) */
export function readProductForm(d) {
  const v = id => $("#" + id)?.value ?? "";
  const num = id => Math.max(0, Math.round(Number(v(id)) || 0));
  return {
    ...d,
    images: d.images || [],
    name: v("pf-name").trim(),
    price: num("pf-price"),
    category: v("pf-cat") || d.category,
    description: v("pf-desc").trim(),
    isPO: $("#pf-po") ? $("#pf-po").checked : !!d.isPO,
    poEstimate: v("pf-estimasi").trim(),
    poDeadline: v("pf-tutup"),
    poQuota: num("pf-kuota"),
    poSold: num("pf-terjual"),
    poNote: v("pf-catatan").trim(),
    colors: d.colors.map((c, i) => ({
      ...c,
      name: v(`c-name-${i}`).trim(),
      hex: v(`c-hex-${i}`) || c.hex || "#111111",
      sizes: c.sizes.map((z, j) => ({
        size: v(`z-size-${i}-${j}`).trim(),
        stock: num(`z-stock-${i}-${j}`),
      })),
    })),
  };
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
    ${sel ? orderDetail(sel) : ""}
    <div class="searchbar">${ic("search", 18)}<input data-filter="q" type="search" placeholder="Cari kode atau nama" value="${esc(f.q)}" autocomplete="off"></div>
    <div class="filters">
      <select data-filter="range">
        ${RANGE.map(([v, l]) => `<option value="${v}" ${f.range === v ? "selected" : ""}>${l}</option>`).join("")}
      </select>
      <select data-filter="status">
        <option value="">Semua status</option>
        ${STATUS.map(s => `<option ${f.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <label class="chip ${f.po ? "on" : ""}" style="margin:0">
        <input class="sr-only" type="checkbox" data-filter="po" ${f.po ? "checked" : ""}>${ic("calendar", 14)} Hanya PO
      </label>
    </div>
    <p class="muted small">Menampilkan maks ${LIMITS.orders} pesanan sesuai filter. Cari kode lama di kolom pencarian bila perlu.</p>
    <div id="olist">${orderListHTML(S)}</div>`;
}

export function orderDetail(o) {
  const c = o.customer || {};
  const alamat = [c.alamat, c.detail, c.kota].filter(Boolean).join(", ");
  return `
    <div class="panel detail">
      <div class="row between">
        <h3 style="margin:0">${esc(o.code)}</h3>
        <button class="icon-btn" data-act="close-order" aria-label="Tutup">${ic("x", 18)}</button>
      </div>

      <div class="info">${ic("user", 16)} <span>${esc(c.name)}</span>
        <a href="https://wa.me/${normWA(c.phone)}" target="_blank" rel="noopener">${ic("chat", 16)} Chat Pembeli</a>
      </div>
      <div class="info">${ic("pin", 16)} <span>${esc(alamat)}</span></div>
      ${c.catatan ? `<div class="info">${ic("alert", 16)} <span>${esc(c.catatan)}</span></div>` : ""}
      <div class="info">${ic("wallet", 16)} <span>${esc(o.payment)} · <b>${rp(o.total)}</b></span></div>
      ${o.hasPO ? `<div class="notice info">${ic("calendar", 18)} PO · estimasi ${esc(o.poEstimate)}</div>` : ""}

      <div class="items">
        ${(o.items || []).map(i => `
          <div class="item-line">
            ${i.isPO ? `<span class="badge po">PO</span>` : ""}
            <span class="grow">${esc(i.name)} · ${esc(i.color)} · ${esc(i.size)}</span>
            <b>× ${i.qty}</b>
          </div>`).join("")}
      </div>

      <details class="edit-cust">
        <summary>${ic("edit", 16)} Ubah data pelanggan</summary>
        <label>Nama<input id="ec-name" value="${esc(c.name)}"></label>
        <label>Nomor WhatsApp<input id="ec-phone" type="tel" inputmode="tel" value="${esc(c.phone)}"></label>
        <label>Kota / Kabupaten<input id="ec-kota" value="${esc(c.kota)}"></label>
        <label>Alamat lengkap<textarea id="ec-alamat" rows="2">${esc(c.alamat)}</textarea></label>
        <label>Detail tambahan<input id="ec-detail" value="${esc(c.detail)}"></label>
        <label>Catatan<input id="ec-catatan" value="${esc(c.catatan)}"></label>
        <button class="btn ghost block" data-act="save-customer" data-id="${esc(o.id)}">${ic("check", 18)} Simpan data pelanggan</button>
      </details>

      <label>Status
        <select id="ds">${STATUS.map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      </label>
      <div class="two">
        <label>Kurir<input id="dk" value="${esc(o.courier)}" placeholder="JNE, J&T, SiCepat…"></label>
        <label>Nomor resi<input id="dr" value="${esc(o.trackingNumber)}"></label>
      </div>
      <button class="btn block" data-act="save-order" data-id="${esc(o.id)}">${ic("check", 18)} Simpan status & resi</button>
    </div>`;
}

/* ---------- TOKO ---------- */
function bannerPanel(S) {
  const list = S.banner || [];
  return `
    <div class="panel">
      <h3>Banner beranda</h3>
      <p class="muted small">Foto banner tampil sebagai slide di beranda, maksimal ${LIMITS.banner} foto. Foto langsung tersimpan saat ditambah atau dihapus.</p>
      <div class="gal-edit">
        ${list.map((s, i) => `
          <div class="gthumb wide"><img src="${s}" alt="">
            <button class="gdel" data-act="del-banner" data-i="${i}" aria-label="Hapus banner">${ic("x", 14)}</button>
          </div>`).join("")}
        ${list.length < LIMITS.banner ? `
          <label class="gadd wide">${ic("image", 22)}<span>Tambah banner</span>
            <input class="sr-only" type="file" accept="image/*" multiple data-img="banner">
          </label>` : ""}
      </div>
    </div>`;
}

function settings(S) {
  const s = S.store || {};
  const rek = rekeningList(s);
  const kats = kategoriList(S);
  const logo = S.imgTmp.logo ?? s.logo ?? "";
  const qris = S.imgTmp.qris ?? s.qris ?? "";
  return `
    ${bannerPanel(S)}

    <div class="panel">
      <h3>Identitas toko</h3>
      <label>Nama toko<input id="s-name" value="${esc(s.storeName)}"></label>
      <div class="upload-block">
        <img id="prev-logo" class="logo-lg" src="${logo}" alt="" ${logo ? "" : "hidden"}>
        <label class="upload">${ic("image", 18)}<span>${logo ? "Ganti logo" : "Unggah logo (opsional)"}</span>
          <input class="sr-only" type="file" accept="image/*" data-img="logo">
        </label>
      </div>
      <label>Nomor WhatsApp admin<input id="s-wa" type="tel" inputmode="tel" value="${esc(s.adminWa)}" placeholder="628123456789"></label>
    </div>

    <div class="panel">
      <h3>Rekening bank</h3>
      <div id="rek-list">
        ${rek.map((r, i) => `
          <div class="color-block">
            <div class="row between"><b class="small">Rekening ${i + 1}</b>
              <button class="icon-btn danger" data-act="del-rek" data-i="${i}" aria-label="Hapus rekening">${ic("trash", 18)}</button>
            </div>
            <label>Nama bank<input id="rb-name-${i}" value="${esc(r.name)}" placeholder="BCA / BRI / Mandiri"></label>
            <label>Nomor rekening<input id="rb-num-${i}" inputmode="numeric" value="${esc(r.number)}"></label>
            <label>Atas nama<input id="rb-holder-${i}" value="${esc(r.holder)}"></label>
          </div>`).join("")}
      </div>
      <button class="btn ghost block" data-act="add-rek">${ic("plus", 18)} Tambah rekening</button>
    </div>

    <div class="panel">
      <h3>QRIS</h3>
      <div class="upload-block">
        <img id="prev-qris" class="qris" src="${qris}" alt="" ${qris ? "" : "hidden"}>
        <label class="upload">${ic("qr", 18)}<span>${qris ? "Ganti gambar QRIS" : "Unggah gambar QRIS"}</span>
          <input class="sr-only" type="file" accept="image/*" data-img="qris">
        </label>
      </div>
    </div>

    <div class="panel">
      <h3>Kategori produk</h3>
      <div id="kat-list">
        ${kats.map((k, i) => `
          <div class="row" style="margin-bottom:8px">
            <input class="grow" id="kat-${i}" value="${esc(k)}">
            <button class="icon-btn danger" data-act="del-kat" data-i="${i}" aria-label="Hapus kategori">${ic("trash", 18)}</button>
          </div>`).join("")}
      </div>
      <button class="btn ghost block" data-act="add-kat">${ic("plus", 18)} Tambah kategori</button>
      <p class="muted small">Kategori yang dihapus tidak mengubah produk yang sudah memakainya.</p>
    </div>

    <button class="btn block big" data-act="save-settings">${ic("check", 18)} Simpan pengaturan</button>`;
}
