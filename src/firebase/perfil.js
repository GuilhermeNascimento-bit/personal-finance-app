// perfil.js — foto de perfil guardada no Firestore (plano gratuito).
// O Firebase Storage exige faturamento ativo; aqui a imagem é reduzida no
// navegador (256×256, ~20–40 KB) e salva como data URL em
// usuarios/{uid}/perfil/foto — coberto pelas regras do firestore.rules.

import { useEffect, useState } from "react";
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { emDemo } from "../demo/demo";

const LADO = 256;

function refFoto(uid) {
  return doc(db, "usuarios", uid, "perfil", "foto");
}

// Corta no centro (quadrado), reduz e comprime. Retorna uma data URL.
export async function prepararFoto(arquivo) {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - lado) / 2;
  const sy = (bitmap.height - lado) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, lado, lado, 0, 0, LADO, LADO);
  bitmap.close?.();

  // WebP quando o navegador suporta; senão JPEG
  const webp = canvas.toDataURL("image/webp", 0.85);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
}

export async function salvarFoto(uid, dataUrl) {
  await setDoc(refFoto(uid), { dataUrl, atualizadoEm: serverTimestamp() });
}

export async function removerFoto(uid) {
  await deleteDoc(refFoto(uid));
}

// Foto atual do usuário, em tempo real. Cai para o photoURL antigo (se houver).
export function useFotoPerfil(usuario) {
  const uid = usuario?.uid;
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (!uid || emDemo()) return;
    return onSnapshot(
      refFoto(uid),
      (snap) => setFoto(snap.exists() ? snap.data().dataUrl : null),
      () => setFoto(null)
    );
  }, [uid]);

  return foto || usuario?.photoURL || null;
}
