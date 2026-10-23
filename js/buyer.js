import { ic, shirt } from "./icons.js";
import { getCart, cartTotal } from "./cart.js";
import { STATUS, CONTACT } from "./config.js";
import { rekeningList } from "./admin.js";
import {
  esc, rp, normWA, productStock, sizeStock, isPOOpen, daysLeft, sisaKuota, hargaJual, persenDiskon,
} from "./utils.js";


/* Harga: harga asli dicoret bila ada diskon, plus badge persen */
export function priceHTML(p, size = "") {
  const jual = hargaJual(p);
  const pct = persenDiskon(p);
  if (!pct) return `<span class="price ${size}">${rp(p.price)}</span>`;
  return `
    <span class="price ${size}">${rp(jual)}</span>
    <s class="old-price">${rp(p.price)}</s>
    <span class="off">-${pct}%</span>`;
}


/* ---------- komponen dasar ---------- */
export const emptyState = (icon, title, text = "", action = "") =>
  `<div class="empty"><div class="ei">${icon}</div><h3>${title}</h3>${text ? `<p>${text}</p>` : ""}${action}</div>`;

export const skeleton = () =>
  `<div class="skel" style="height:150px;margin-bottom:14px"></div>
   <div class="grid">${'<div class="skel" style="height:230px"></div>'.repeat(4)}</div>`;

export function media(src, hex = "#e5e7eb", size = 64) {
  return src
    ? `<img src="${src}" alt="" loading="lazy">`
    : `<div class="ph" style="--tint:${esc(hex)}">${shirt(hex, size)}</div>`;
}

// Slide yang bisa digeser. list = array URL/base64 gambar.
export function slider(list, kind = "") {
  if (!list.length) return "";
  return `
    <div class="slider ${kind}">
      <div class="track">
        ${list.map((s, i) => `<div class="slide"><img src="${s}" alt="" ${i ? 'loading="lazy"' : ""}></div>`).join("")}
      </div>
      ${list.length > 1
        ? `<div class="dots">${list.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>`
        : ""}
    </div>`;
}

export function badge(p) {
  if (p.isPO) {
    return isPOOpen(p)
      ? `<span class="badge po">${ic("calendar", 12)} PO</span>`
      : `<span class="badge closed">PO Ditutup</span>`;
  }
  return productStock(p) > 0 ? "" : `<span class="badge closed">Habis</span>`;
}

export function swatches(colors = [], max = 5) {
  const dots = colors
    .slice(0, max)
    .map(c => `<span class="dot" style="background:${esc(c.hex)}" title="${esc(c.name)}"></span>`)
    .join("");
  return dots + (colors.length > max ? `<small class="muted">+${colors.length - max}</small>` : "");
}

/* ---------- BERANDA ---------- */
function pcard(p) {
  const stok = productStock(p);
  const info = p.isPO
    ? (isPOOpen(p) ? `Estimasi ${esc(p.poEstimate || "-")}` : "Pre-order ditutup")
    : (stok > 0 ? `Stok ${stok}` : "Stok habis");
  return `
    <a class="pcard" href="#/produk/${esc(p.id)}">
      <div class="thumb">${media(p.images?.[0], p.colors?.[0]?.hex)}${badge(p)}${persenDiskon(p) ? `<span class="off thumb-off">-${persenDiskon(p)}%</span>` : ""}</div>
      <div class="pbody">
        <h3>${esc(p.name)}</h3>
        <div class="price-row">${priceHTML(p)}</div>
        <div class="swatches">${swatches(p.colors)}</div>
        <small class="muted">${info}</small>
      </div>
    </a>`;
}

export function gridHTML(S) {
  const q = S.search.trim().toLowerCase();
  const list = S.products.filter(p =>
    (S.cat === "Semua" || (S.cat === "Pre-Order" ? p.isPO : p.category === S.cat)) &&
    (p.name || "").toLowerCase().includes(q)
  );
  if (!list.length) return emptyState(ic("search", 40), "Produk tidak ditemukan", "Coba kata kunci atau kategori lain.");
  return list.map(pcard).join("");
}

export function contactBlock() {
  return `
    <section class="contact panel">
      <h3>Hubungi kami</h3>
      <a class="crow" href="https://wa.me/${CONTACT.wa}" target="_blank" rel="noopener">
        <span class="cic wa">${ic("chat", 18)}</span>
        <span class="grow"><b>WhatsApp</b><small class="muted">${esc(CONTACT.waDisplay)}</small></span>
        ${ic("send", 16)}
      </a>
      <a class="crow" href="https://www.tiktok.com/@${esc(CONTACT.tiktok)}" target="_blank" rel="noopener">
        <span class="cic tt">${ic("spark", 18)}</span>
        <span class="grow"><b>TikTok</b><small class="muted">@${esc(CONTACT.tiktok)}</small></span>
        ${ic("send", 16)}
      </a>
      <a class="crow" href="https://www.instagram.com/${esc(CONTACT.instagram)}" target="_blank" rel="noopener">
        <span class="cic ig">${ic("image", 18)}</span>
        <span class="grow"><b>Instagram</b><small class="muted">@${esc(CONTACT.instagram)}</small></span>
        ${ic("send", 16)}
      </a>
    </section>`;
}


export function viewHome(S) {
  if (S.loading) return skeleton();
  if (S.error && !S.products.length) {
    return emptyState(ic("alert", 44), "Produk gagal dimuat", "Periksa koneksi internet Anda.",
      `<button class="btn" data-act="reload">${ic("spark", 18)} Muat ulang</button>`);
  }
  const name = "Selamat Datang";
  const head = S.banner?.length
    ? `<div class="banner">${slider(S.banner, "banner-s")}</div>
       <div class="page-head"><h1>${name}</h1>
       <p class="muted small">Di Dlpnm Merch, merchandise kebanggaan keluarga besar Pagar Nusa. Kami hadir untuk menyediakan berbagai produk pilihan khusus bagi anggota Pagar Nusa. temukan produk favoritmu, dan selamat berbelanja!.</p></div>`
    : `<section class="hero">
         <div>
           <span class="eyebrow">${ic("spark", 14)} Koleksi terbaru</span>
           <h1>${name}</h1>
           <p class="muted">tes.</p>
         </div>
         <div class="hero-art">${shirt("#2748d6", 54)}${shirt("#f59e0b", 68)}${shirt("#10b981", 50)}</div>
       </section>`;

  const kats = S.store.kategori?.length
    ? S.store.kategori
    : [...new Set(S.products.map(p => p.category).filter(Boolean))];
  const cats = ["Semua", "Pre-Order", ...new Set([...kats, ...S.products.map(p => p.category).filter(Boolean)])];

  return `
    ${head}
    <div class="searchbar">${ic("search", 18)}<input id="q" type="search" placeholder="Cari produk…" value="${esc(S.search)}" autocomplete="off"></div>
    <div class="chips">
      ${cats.map(c => `<button class="chip ${c === S.cat ? "on" : ""}" data-act="cat" data-val="${esc(c)}">${c === "Pre-Order" ? ic("calendar", 14) : ""}${esc(c)}</button>`).join("")}
    </div>
        <div class="grid" id="grid">${gridHTML(S)}</div>
    ${contactBlock()}`;
}

/* ---------- DETAIL PRODUK ---------- */
function poBox(p) {
  const d = p.poDeadline ? daysLeft(p.poDeadline) : null;
  const kuota = sisaKuota(p);
  const rows = [
    ["truck", `Estimasi kirim: <b>${esc(p.poEstimate || "-")}</b>`],
    p.poDeadline && ["clock", d > 0 ? `Tutup PO ${esc(p.poDeadline)} · sisa <b>${d} hari</b>` : "PO sudah ditutup"],
    kuota !== null && ["box", `Sisa kuota: <b>${kuota}</b>`],
    p.poNote && ["alert", esc(p.poNote)],
  ].filter(Boolean);
  return `<div class="po-box">${rows.map(([i, t]) => `<div class="row">${ic(i, 18)}<span>${t}</span></div>`).join("")}</div>`;
}

export function viewProduct(p, S) {
  if (!p) {
    return S.loading
      ? skeleton()
      : emptyState(ic("alert", 44), "Produk tidak ditemukan", "", `<a class="btn" href="#/">Kembali ke beranda</a>`);
  }
  const pk = S.pick;
  const color = p.colors.find(c => c.name === pk.color) || p.colors[0];
  const open = p.isPO ? isPOOpen(p) : productStock(p) > 0;

  // Foto warna yang dipilih didahulukan, lalu galeri produk
  const photos = [...new Set([color?.image, ...(p.images || [])].filter(Boolean))];

  const colorHTML = p.colors.map(c => {
    const total = (c.sizes || []).reduce((t, z) => t + (Number(z.stock) || 0), 0);
    const off = !p.isPO && total === 0;
    return `<button class="colorchip ${c.name === color?.name ? "on" : ""}" data-act="pick-color" data-val="${esc(c.name)}" ${off ? "disabled" : ""}>
      <span class="dot lg" style="background:${esc(c.hex)}"></span>${esc(c.name)}${off ? " · habis" : ""}
    </button>`;
  }).join("");

  const sizeHTML = (color?.sizes || []).map(z => {
    const st = Number(z.stock) || 0;
    const off = !p.isPO && st <= 0;
    return `<button class="size ${z.size === pk.size ? "on" : ""}" data-act="pick-size" data-val="${esc(z.size)}" ${off ? "disabled" : ""}>
      <b>${esc(z.size)}</b><small>${p.isPO ? "PO" : off ? "habis" : "sisa " + st}</small>
    </button>`;
  }).join("") || `<p class="muted">Ukuran belum diatur.</p>`;

  const canBuy = open && pk.size;

  return `
    <div class="product">
      <div class="thumb xl">
        ${photos.length ? slider(photos, "pslider") : media("", color?.hex, 120)}
        ${badge(p)}
      </div>
      <div class="pinfo">
        <h1>${esc(p.name)}</h1>
        <div class="price-big">${priceHTML(p, "big")}</div>
        ${p.isPO ? poBox(p) : ""}
        <div class="label">Warna${color ? `: <span class="muted">${esc(color.name)}</span>` : ""}</div>
        <div class="colorchips">${colorHTML}</div>
        <div class="label">Ukuran</div>
        <div class="sizes">${sizeHTML}</div>
        <div class="label">Jumlah</div>
        <div class="stepper">
          <button data-act="qty" data-d="-1" aria-label="Kurangi">${ic("minus", 18)}</button>
          <span>${pk.qty}</span>
          <button data-act="qty" data-d="1" aria-label="Tambah">${ic("plus", 18)}</button>
        </div>
        <div class="btn-stack">
          <button class="btn block big" data-act="buy-now" ${canBuy ? "" : "disabled"}>
            ${ic("truck", 20)} ${open ? "Beli Langsung" : p.isPO ? "PO Ditutup" : "Stok Habis"}
          </button>
          <button class="btn ghost block" data-act="add" ${canBuy ? "" : "disabled"}>
            ${ic("cart", 20)} Tambah ke Keranjang
          </button>
        </div>
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
        <a class="link" href="#/keranjang">${ic("cart", 16)} Lihat keranjang</a>
      </div>
    </div>`;
}

/* ---------- KERANJANG ---------- */
function cartRow(i, S) {
  const p = S.products.find(x => x.id === i.id);
  const color = p?.colors?.find(c => c.name === i.color);
  return `
    <div class="cart-row">
      <div class="thumb sm">${media(p?.images?.[0], color?.hex || "#e5e7eb", 40)}</div>
      <div class="grow">
        <div class="cname">${esc(i.name)} ${i.isPO ? `<span class="badge po">PO</span>` : ""}</div>
        <div class="meta"><span class="dot" style="background:${esc(color?.hex || "#e5e7eb")}"></span>${esc(i.color)} <span class="tag">${esc(i.size)}</span></div>
        ${i.isPO ? `<small class="muted">Estimasi: ${esc(i.poEstimate || "-")}</small>` : ""}
        <div class="row between mt">
          <b>${rp(i.price * i.qty)}</b>
          <div class="stepper sm">
            <button data-act="cart-qty" data-key="${esc(i.key)}" data-d="-1" aria-label="Kurangi">${ic("minus", 16)}</button>
            <span>${i.qty}</span>
            <button data-act="cart-qty" data-key="${esc(i.key)}" data-d="1" aria-label="Tambah">${ic("plus", 16)}</button>
          </div>
        </div>
      </div>
      <button class="icon-btn danger" data-act="cart-del" data-key="${esc(i.key)}" aria-label="Hapus">${ic("trash", 18)}</button>
    </div>`;
}

export function viewCart(S) {
  const items = getCart();
  if (!items.length) {
    return emptyState(ic("cart", 56), "Keranjang masih kosong", "Yuk pilih produk favoritmu dulu.",
      `<a class="btn" href="#/">${ic("bag", 18)} Mulai belanja</a>`);
  }
  const qty = items.reduce((s, i) => s + i.qty, 0);
  const mixed = items.some(i => i.isPO) && items.some(i => !i.isPO);
  return `
    <h2 class="page-title">${ic("cart", 22)} Keranjang <span class="muted small">(${qty} barang)</span></h2>
    <div class="stack">${items.map(i => cartRow(i, S)).join("")}</div>
    ${mixed ? `<div class="notice">${ic("alert", 18)} Pesanan akan dikirim setelah barang PO tiba.</div>` : ""}
    <div class="summary"><div class="row between total"><span>Total</span><b>${rp(cartTotal(items))}</b></div></div>
    <a class="btn block big" href="#/checkout">${ic("truck", 20)} Lanjut ke Checkout</a>`;
}

/* ---------- CHECKOUT ---------- */
function payBox(pay, st, idx = 0) {
  if (pay === "QRIS") {
    return st.qris
      ? `<div class="pay-detail"><img class="qris" src="${st.qris}" alt="QRIS">
           <a class="btn ghost block" href="${st.qris}" download="qris.jpg">${ic("copy", 16)} Unduh QRIS</a></div>`
      : `<div class="pay-detail muted">QRIS belum tersedia.</div>`;
  }
  const list = rekeningList(st);
  if (!list.length) return `<div class="pay-detail muted">Data rekening belum tersedia.</div>`;
  const r = list[Math.min(idx, list.length - 1)];
  return `
    <div class="pay-detail">
      ${list.length > 1 ? `
        <label class="small muted">Pilih rekening tujuan</label>
        <select name="rekIdx" data-form>
          ${list.map((x, n) => `<option value="${n}" ${n === idx ? "selected" : ""}>${esc(x.name)} · ${esc(x.number)}</option>`).join("")}
        </select>` : ""}
      <div class="bank-name">${ic("bank", 18)} ${esc(r.name)}</div>
      <div class="acc">${esc(r.number)}</div>
      <div class="muted">a.n. ${esc(r.holder)}</div>
      <button class="btn ghost block" data-act="copy" data-val="${esc(r.number)}">${ic("copy", 16)} Salin nomor rekening</button>
    </div>`;
}

// items = daftar barang yang dipesan (dari keranjang, atau satu barang jika "Beli Langsung")
export function viewCheckout(S, items) {
  if (!items.length) return viewCart(S);
  const f = S.form, pay = f.pay || "Transfer Bank";
  const hasPO = items.some(i => i.isPO);
  const qty = items.reduce((s, i) => s + i.qty, 0);
  return `
    <h2 class="page-title">${ic("truck", 22)} Checkout</h2>
    <div class="steps">
      <span class="step done">${ic("cart", 14)} ${S.direct ? "Produk" : "Keranjang"}</span>
      <span class="step on">${ic("user", 14)} Data</span>
      <span class="step">${ic("check", 14)} Selesai</span>
    </div>
    ${S.direct ? `<div class="notice info">${ic("truck", 18)} Mode beli langsung: hanya barang ini yang dipesan. Keranjang Anda tidak berubah.</div>` : ""}

    <div class="panel">
      <h3>Data penerima</h3>
      <label>Nama lengkap *<input name="nama" data-form value="${esc(f.nama)}" autocomplete="name"></label>
      <label>Nomor WhatsApp *<input name="phone" data-form type="tel" inputmode="tel" value="${esc(f.phone)}" placeholder="0812xxxxxxx"></label>
      <div class="ac-wrap">
        <label>Kota / Kabupaten *<input id="kota" name="kota" data-form autocomplete="off" value="${esc(f.kota)}" placeholder="Ketik minimal 2 huruf"></label>
        <ul class="ac-list" id="kota-list" hidden></ul>
      </div>
      <label>Alamat lengkap *<textarea name="alamat" data-form rows="2" placeholder="Nama jalan, kelurahan, kecamatan">${esc(f.alamat)}</textarea></label>
      <label>Detail tambahan <small>(opsional)</small>
        <input name="detail" data-form value="${esc(f.detail)}" placeholder="Blok, nomor rumah, RT/RW, patokan">
      </label>
      <label>Catatan untuk penjual <small>(opsional)</small>
        <input name="catatan" data-form value="${esc(f.catatan)}">
      </label>
    </div>

    <div class="panel">
      <h3>Metode pembayaran</h3>
      <div class="pay-opts">
        <label class="pay ${pay === "Transfer Bank" ? "on" : ""}">
          <input type="radio" name="pay" value="Transfer Bank" data-form ${pay === "Transfer Bank" ? "checked" : ""}>${ic("bank", 24)}<span>Transfer Bank</span>
        </label>
        <label class="pay ${pay === "QRIS" ? "on" : ""}">
          <input type="radio" name="pay" value="QRIS" data-form ${pay === "QRIS" ? "checked" : ""}>${ic("qr", 24)}<span>QRIS</span>
        </label>
      </div>
      ${payBox(pay, S.store, +(f.rekIdx || 0))}
      ${hasPO ? `<label class="ck"><input type="checkbox" name="poOk" data-form ${f.poOk ? "checked" : ""}> Saya mengerti ini produk Pre-Order dan barang dikirim sesuai estimasi</label>` : ""}
    </div>

    <div class="summary">
      <div class="row between"><span>${qty} barang</span><span></span></div>
      <div class="row between total"><span>Total bayar</span><b>${rp(cartTotal(items))}</b></div>
    </div>
    <button class="btn block big" id="btn-submit" data-act="submit">${ic("send", 18)} Buat Pesanan</button>`;
}

/* ---------- SUKSES ---------- */
export function waLink(o, st) {
  const num = normWA(st.adminWa);
  const alamat = [o.customer.alamat, o.customer.detail, o.customer.kota].filter(Boolean).join(", ");
  const lines = [
    `*Pesanan ${o.code}*`, "",
    ...o.items.map(i => `${i.isPO ? "[PRE-ORDER] " : ""}${i.name} | ${i.color} | ${i.size} x${i.qty}${i.isPO ? ` (estimasi: ${i.poEstimate})` : ""}`),
    "",
    `Total: ${rp(o.total)}`,
    `Pembayaran: ${o.payment}`, "",
    `Nama: ${o.customer.name}`,
    `WA: ${o.customer.phone}`,
    `Alamat: ${alamat}`,
    ...(o.customer.catatan ? [`Catatan: ${o.customer.catatan}`] : []),
    "", "Saya kirim bukti pembayaran di chat ini.",
  ];
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function viewSuccess(o, st) {
  return `
    <div class="success">
      <div class="ok-badge">${ic("check", 52)}</div>
      <h2>Pesanan berhasil dibuat!</h2>
      <p class="muted">Simpan kode ini untuk mengecek status pesanan Anda.</p>
      <div class="code-box"><span class="muted small">Kode pesanan</span><b>${esc(o.code)}</b></div>
      <button class="btn ghost block" data-act="copy" data-val="${esc(o.code)}">${ic("copy", 18)} Salin kode</button>
      ${st.adminWa
        ? `<a class="btn wa block big" href="${waLink(o, st)}" target="_blank" rel="noopener">${ic("chat", 20)} Lanjut ke WhatsApp</a>`
        : `<div class="notice">${ic("alert", 18)} Nomor WA admin belum diatur. Hubungi penjual langsung.</div>`}
      <div class="notice info">${ic("alert", 18)} Kirim bukti transfer lewat WhatsApp agar pesanan segera diproses.</div>
      <a class="link" href="#/cek">${ic("box", 16)} Cek status pesanan</a>
    </div>`;
}

/* ---------- CEK PESANAN ---------- */
const STEP_ICON = {
  "Menunggu Pembayaran": "wallet", "Pembayaran Diterima": "check", "Menunggu Barang PO": "clock",
  "Diproses": "box", "Dikirim": "truck", "Selesai": "check",
};
const maskPhone = v => (v || "").length > 7 ? v.slice(0, 4) + "****" + v.slice(-3) : "****";

function orderStatus(o) {
  const steps = STATUS.filter(s => s !== "Menunggu Barang PO" || o.hasPO);
  const idx = Math.max(0, steps.indexOf(o.status));
  const alamat = (o.customer.alamat || "").slice(0, 10) + "***, " + (o.customer.kota || "");
  return `
    <div class="panel">
      <div class="row between"><b>${esc(o.code)}</b><span class="st-chip st-${STATUS.indexOf(o.status)}">${esc(o.status)}</span></div>
    </div>
    <div class="panel">
      <ol class="timeline">
        ${steps.map((s, n) => `
          <li class="${n < idx ? "done" : n === idx ? "current" : ""}">
            <span class="ti">${ic(STEP_ICON[s], 16)}</span>
            <div>${s}${n === idx ? `<br><small>Status saat ini</small>` : ""}</div>
          </li>`).join("")}
      </ol>
    </div>
    ${o.status === "Dikirim" && o.trackingNumber ? `
      <div class="panel row between">
        <div><small class="muted">${esc(o.courier || "Kurir")}</small><div><b>${esc(o.trackingNumber)}</b></div></div>
        <button class="btn ghost sm" data-act="copy" data-val="${esc(o.trackingNumber)}">${ic("copy", 16)} Salin resi</button>
      </div>` : ""}
    ${o.hasPO && o.poEstimate ? `<div class="notice info">${ic("calendar", 18)} Estimasi pengiriman PO: ${esc(o.poEstimate)}</div>` : ""}
    <div class="panel">
      <h3>Ringkasan barang</h3>
      ${o.items.map(i => `
        <div class="row between line">
          <div>${i.isPO ? `<span class="badge po">PO</span> ` : ""}${esc(i.name)}<br><small class="muted">${esc(i.color)} · ${esc(i.size)} × ${i.qty}</small></div>
          <b>${rp(i.price * i.qty)}</b>
        </div>`).join("")}
      <div class="row between total-line"><span>Total</span><b>${rp(o.total)}</b></div>
    </div>
    <div class="panel small muted">
      <div class="row">${ic("user", 16)} ${esc(o.customer.name)} · ${esc(maskPhone(o.customer.phone))}</div>
      <div class="row">${ic("pin", 16)} ${esc(alamat)}</div>
    </div>`;
}

export function viewTrack(S) {
  const t = S.track;
  let result = "";
  if (t?.status === "loading") result = skeleton();
  else if (t?.status === "notfound") result = emptyState(ic("alert", 44), "Kode tidak ditemukan", "Periksa kembali kode pesanan Anda.");
  else if (t?.status === "error") result = emptyState(ic("alert", 44), "Gagal mengecek pesanan", "Periksa koneksi internet lalu coba lagi.");
  else if (t?.status === "ok") result = orderStatus(t.order);

  return `
    <h2 class="page-title">${ic("box", 22)} Cek Pesanan</h2>
    <div class="panel">
      <label>Kode pesanan
        <input id="tcode" placeholder="TK-XXXXXXXX" autocapitalize="characters" value="${esc(S.trackCode)}">
      </label>
      <button class="btn block" data-act="track">${ic("search", 18)} Cek Pesanan</button>
    </div>
    ${result}`;
}
