// auth.js
// Funções de autenticação: cadastro, login, logout e observador de sessão.
// Espelha o conceito do script Python de ter "um usuário", mas agora
// cada usuário autenticado tem seu próprio espaço de dados no Firestore.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// Cadastra um novo usuário com e-mail/senha e envia o link de confirmação.
// Nada é gravado no banco aqui: as regras só liberam o Firestore depois que
// o e-mail é confirmado (ver firestore.rules).
export async function cadastrarUsuario(nome, email, senha, idioma = "pt") {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  const usuario = credencial.user;

  await updateProfile(usuario, { displayName: nome });
  await enviarVerificacao(idioma);

  return usuario;
}

// Conta demo pública (demo@demo.com): e-mail fictício, não tem como confirmar.
// É a única exceção — a mesma está nas regras do Firestore (firestore.rules).
export const UID_CONTA_DEMO = "3DrIMVVqmpVn6SKXz7poYbMpBmd2";

// Toda conta precisa confirmar o e-mail (as regras do Firestore exigem isso),
// exceto a conta demo.
export function precisaVerificarEmail(usuario) {
  return !!usuario && !usuario.emailVerified && usuario.uid !== UID_CONTA_DEMO;
}

// Marca que o link já foi enviado nesta sessão (evita reenvio automático)
const chaveEnvio = (uid) => `verificacao-enviada-${uid}`;
export const linkJaEnviado = (uid) => !!sessionStorage.getItem(chaveEnvio(uid));

// Envia (ou reenvia) o link de confirmação. O e-mail sai no idioma do app e,
// depois de confirmar, o botão "Continuar" do Firebase volta para o app.
export async function enviarVerificacao(idioma = "pt") {
  if (!auth.currentUser) return;
  auth.languageCode = idioma === "en" ? "en" : "pt-BR";
  const voltarPara = window.location.origin + window.location.pathname;
  const chave = chaveEnvio(auth.currentUser.uid);
  // marca antes de enviar: evita dois envios se a função for chamada em seguida
  sessionStorage.setItem(chave, "1");
  try {
    await sendEmailVerification(auth.currentUser, { url: voltarPara });
  } catch (e) {
    sessionStorage.removeItem(chave);
    throw e;
  }
}

// Busca no servidor o estado atual da conta (ex.: e-mail recém-confirmado)
// e renova o token, para as regras do banco já enxergarem a confirmação.
export async function recarregarUsuario() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  if (auth.currentUser.emailVerified) await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

// Faz login de um usuário já cadastrado.
export async function logarUsuario(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

// Faz logout do usuário atual.
export async function deslogarUsuario() {
  await signOut(auth);
}

// Observa mudanças no estado de login (usado para proteger rotas
// e saber quem é o usuário atual em qualquer componente).
// Uso: const unsubscribe = observarUsuario((usuario) => { ... });
export function observarUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}
