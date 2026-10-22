// Keranjang disimpan di localStorage. Satu item = produk + warna + ukuran.
const KEY = "tk_cart_v2";

export function getCart() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

const write = list => localStorage.setItem(KEY, JSON.stringify(list));

// Mengembalikan jumlah akhir item di keranjang (sudah dibatasi stok)
export function addItem({ product, color, size, qty, stock }) {
  const list = getCart();
  const key = [product.id, color, size].join("|");
  const max = product.isPO ? 99 : stock;
  let item = list.find(i => i.key === key);
  const next = Math.min(max, (item?.qty || 0) + qty);

  if (item) {
    item.qty = next;
  } else {
    list.push({
      key, id: product.id, name: product.name, price: product.price,
      color, size, qty: Math.min(max, qty),
      isPO: !!product.isPO, poEstimate: product.poEstimate || "",
    });
  }
  write(list);
  return next;
}

export function setQty(key, qty) {
  const list = getCart();
  const item = list.find(i => i.key === key);
  if (item) item.qty = qty;
  write(list);
}

export const removeItem = key => write(getCart().filter(i => i.key !== key));
export const clearCart = () => write([]);
export const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);
export const cartTotal = (list = getCart()) => list.reduce((s, i) => s + i.price * i.qty, 0);
