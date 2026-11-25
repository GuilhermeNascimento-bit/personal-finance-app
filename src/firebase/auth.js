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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Cadastra um novo usuário com e-mail/senha e cria o documento dele
// em "usuarios/{uid}" para guardar dados de perfil.
export async function cadastrarUsuario(nome, email, senha, idioma = "pt") {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  const usuario = credencial.user;

  await updateProfile(usuario, { displayName: nome });
  await enviarVerificacao(idioma);

  await setDoc(doc(db, "usuarios", usuario.uid), {
    nome,
    email,
    criadoEm: serverTimestamp(),
  });

  return usuario;
}

// Contas criadas a partir desta data precisam confirmar o e-mail.
// Contas antigas (criadas antes da verificação existir) continuam liberadas.
export const INICIO_VERIFICACAO = Date.parse("2026-11-25T00:00:00-03:00");

export function precisaVerificarEmail(usuario) {
  if (!usuario || usuario.emailVerified) return false;
  const criado = Date.parse(usuario.metadata?.creationTime || "");
  return Number.isFinite(criado) && criado >= INICIO_VERIFICACAO;
}

// Envia (ou reenvia) o link de confirmação. O e-mail sai no idioma do app e,
// depois de confirmar, o botão "Continuar" do Firebase volta para o app.
export async function enviarVerificacao(idioma = "pt") {
  if (!auth.currentUser) return;
  auth.languageCode = idioma === "en" ? "en" : "pt-BR";
  const voltarPara = window.location.origin + window.location.pathname;
  await sendEmailVerification(auth.currentUser, { url: voltarPara });
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
