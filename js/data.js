import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp, writeBatch, deleteField, Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, LIMITS } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ---------- PRODUK ---------- */

// Menyamakan format produk lama dan baru
function normalize(p) {
  let out = p;
  if (!Array.isArray(out.colors)) {
    const sizes = (out.sizes || []).map(s => ({ size: s, stock: Number(out.stock) || 0 }));
    out = { ...out, colors: [{ name: "Standar", hex: "#111111", image: "", sizes }] };
  }
  // Format baru: images (array). Format lama: image (satu foto)
  const images = Array.isArray(out.images) && out.images.length
    ? out.images
    : (out.image ? [out.image] : []);
  return { ...out, images };
}

export async function fetchProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map(d => normalize({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export function saveProduct(id, data) {
  if (!id) return addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
  // Jika data memakai images, hapus field image lama agar tidak dobel ukurannya
  const payload = "images" in data ? { ...data, image: deleteField() } : data;
  return updateDoc(doc(db, "products", id), payload);
}

export const removeProduct = id => deleteDoc(doc(db, "products", id));

/* ---------- TOKO & BANNER ---------- */
export async function fetchStore() {
  const d = await getDoc(doc(db, "settings", "store"));
  return d.exists() ? d.data() : {};
}
export const saveStore = data => setDoc(doc(db, "settings", "store"), data);

export async function fetchBanner() {
  const d = await getDoc(doc(db, "settings", "banner"));
  return d.exists() ? (d.data().images || []) : [];
}
export const saveBanner = images => setDoc(doc(db, "settings", "banner"), { images });

/* ---------- PESANAN ---------- */
export const fetchOrder = code => getDoc(doc(db, "orders", code));
export const createOrder = (code, data) => setDoc(doc(db, "orders", code), data);
export const updateOrder = (code, data) => updateDoc(doc(db, "orders", code), data);

// since = Date (opsional). Tanpa since: 100 pesanan terbaru.
export function watchOrders({ since = null } = {}, onData, onError) {
  const c = collection(db, "orders");
  const q = since
    ? query(c, where("createdAt", ">=", Timestamp.fromDate(since)), orderBy("createdAt", "desc"), limit(LIMITS.orders))
    : query(c, orderBy("createdAt", "desc"), limit(LIMITS.orders));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError
  );
}

// Menghapus pesanan yang lebih tua dari `days` hari. Dikerjakan per batch.
export async function purgeOldOrders(days) {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - days * 864e5));
  let removed = 0;
  while (true) {
    const snap = await getDocs(
      query(collection(db, "orders"), where("createdAt", "<", cutoff), limit(LIMITS.purgeBatch))
    );
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    if (snap.size < LIMITS.purgeBatch) break;
  }
  return removed;
}

/* ---------- AUTH ---------- */
export const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const onUser = cb => onAuthStateChanged(auth, cb);

export { serverTimestamp };
