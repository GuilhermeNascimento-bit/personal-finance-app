import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { emDemo, demo } from "../demo/demo";

function colecao(uid) {
  return collection(db, "usuarios", uid, "recorrentes");
}

export function escutarRecorrentes(uid, callback) {
  if (emDemo()) return demo.escutar("recorrentes", callback);
  const q = query(colecao(uid), orderBy("dia", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function adicionarRecorrente(uid, dados) {
  if (emDemo()) return demo.adicionar("recorrentes", { ...dados, ativo: true });
  return addDoc(colecao(uid), { ...dados, ativo: true, criadoEm: serverTimestamp() });
}

export function editarRecorrente(uid, id, dados) {
  if (emDemo()) return demo.editar("recorrentes", id, dados);
  return updateDoc(doc(db, "usuarios", uid, "recorrentes", id), dados);
}

export function removerRecorrente(uid, id) {
  if (emDemo()) return demo.remover("recorrentes", id);
  return deleteDoc(doc(db, "usuarios", uid, "recorrentes", id));
}
