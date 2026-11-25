// metas.js — metas de economia do usuário (usuarios/{uid}/metas)
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, orderBy, query,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { emDemo, demo } from "../demo/demo";

const colecao = (uid) => collection(db, "usuarios", uid, "metas");

export function escutarMetas(uid, callback) {
  if (emDemo()) return demo.escutar("metas", callback);
  const q = query(colecao(uid), orderBy("criadoEm", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function adicionarMeta(uid, dados) {
  if (emDemo()) return demo.adicionar("metas", { ...dados, acumulado: 0, criadoEm: new Date() });
  return addDoc(colecao(uid), { ...dados, acumulado: 0, criadoEm: serverTimestamp() });
}

export function atualizarMeta(uid, id, dados) {
  if (emDemo()) return demo.editar("metas", id, dados);
  return updateDoc(doc(db, "usuarios", uid, "metas", id), dados);
}

export function removerMeta(uid, id) {
  if (emDemo()) return demo.remover("metas", id);
  return deleteDoc(doc(db, "usuarios", uid, "metas", id));
}
