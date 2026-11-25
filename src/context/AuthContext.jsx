// AuthContext.jsx
// Contexto global de autenticação. Envolve toda a aplicação e expõe
// o usuário atual, um estado de "carregando" (enquanto verifica a
// sessão) e as funções de cadastro/login/logout já tratadas.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  cadastrarUsuario as cadastrarUsuarioFirebase,
  logarUsuario as logarUsuarioFirebase,
  deslogarUsuario as deslogarUsuarioFirebase,
  observarUsuario,
  enviarVerificacao,
  recarregarUsuario,
  precisaVerificarEmail,
} from "../firebase/auth";
import { iniciarDemo as ligarDemo, encerrarDemo as desligarDemo } from "../demo/demo";

// Usuário "de mentira" do modo demonstração (nada dele vai ao Firebase)
const USUARIO_DEMO = { uid: "demo-local", displayName: "", email: null, demo: true };

const AuthContext = createContext(null);

// Traduz os códigos de erro do Firebase para mensagens em português,
// compreensíveis para quem está usando o app.
function traduzirErroFirebase(codigo) {
  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Tente fazer login.",
    "auth/invalid-email": "O e-mail informado não é válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
    "auth/wrong-password": "Senha incorreta. Tente novamente.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente de novo.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  };
  return mensagens[codigo] || "Ocorreu um erro inesperado. Tente novamente.";
}

export function AuthProvider({ children }) {
  const [usuarioReal, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usuarioDemo, setUsuarioDemo] = useState(null);
  // muda quando recarregamos o usuário (o objeto do Firebase é o mesmo,
  // então isso força quem depende de emailVerified a re-renderizar)
  const [versao, setVersao] = useState(0);

  const usuario = usuarioReal ?? usuarioDemo;
  const emDemo = !usuarioReal && !!usuarioDemo;

  useEffect(() => {
    const unsubscribe = observarUsuario((usuarioFirebase) => {
      // conta real entrou: a demo precisa sair antes de qualquer leitura do banco
      if (usuarioFirebase) {
        desligarDemo();
        setUsuarioDemo(null);
      }
      setUsuario(usuarioFirebase);
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  async function cadastrar(nome, email, senha, idioma) {
    try {
      await cadastrarUsuarioFirebase(nome, email, senha, idioma);
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, codigo: erro.code, mensagem: traduzirErroFirebase(erro.code) };
    }
  }

  async function entrar(email, senha) {
    try {
      await logarUsuarioFirebase(email, senha);
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, codigo: erro.code, mensagem: traduzirErroFirebase(erro.code) };
    }
  }

  async function sair() {
    if (emDemo) {
      // sai da demo e volta para a apresentação
      encerrarDemo();
      history.pushState(null, "", window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }
    await deslogarUsuarioFirebase();
  }

  const iniciarDemo = useCallback((idioma, nomeVisitante) => {
    ligarDemo(idioma);
    setUsuarioDemo({ ...USUARIO_DEMO, displayName: nomeVisitante || "" });
  }, []);

  const encerrarDemo = useCallback(() => {
    desligarDemo();
    setUsuarioDemo(null);
  }, []);

  const atualizarUsuario = useCallback(async () => {
    const u = await recarregarUsuario();
    setVersao((v) => v + 1);
    return u;
  }, []);

  const valor = {
    usuario,
    carregando,
    cadastrar,
    entrar,
    sair,
    emDemo,
    iniciarDemo,
    encerrarDemo,
    precisaVerificar: precisaVerificarEmail(usuarioReal),
    reenviarVerificacao: enviarVerificacao,
    atualizarUsuario,
    versao,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acesso ao contexto. Uso: const { usuario, entrar } = useAuth();
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return contexto;
}
