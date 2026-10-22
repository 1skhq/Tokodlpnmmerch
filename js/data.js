import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ---------- PRODUK ---------- */

// Produk versi lama (field stock + sizes tunggal) otomatis diubah menjadi satu "warna Standar"
function normalize(p) {
  if (Array.isArray(p.colors)) return p;
  const sizes = (p.sizes || []).map(s => ({ size: s, stock: Number(p.stock) || 0 }));
  return { ...p, colors: [{ name: "Standar", hex: "#111111", image: "", sizes }] };
}

export async function fetchProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map(d => normalize({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export const saveProduct = (id, data) =>
  id
    ? updateDoc(doc(db, "products", id), data)
    : addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });

export const removeProduct = id => deleteDoc(doc(db, "products", id));

/* ---------- TOKO ---------- */
export async function fetchStore() {
  const d = await getDoc(doc(db, "settings", "store"));
  return d.exists() ? d.data() : {};
}
export const saveStore = data => setDoc(doc(db, "settings", "store"), data);

/* ---------- PESANAN ---------- */
export const fetchOrder = code => getDoc(doc(db, "orders", code));
export const createOrder = (code, data) => setDoc(doc(db, "orders", code), data);
export const updateOrder = (code, data) => updateDoc(doc(db, "orders", code), data);

export function watchOrders(onData, onError) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/* ---------- AUTH ---------- */
export const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const onUser = cb => onAuthStateChanged(auth, cb);

export { serverTimestamp };
