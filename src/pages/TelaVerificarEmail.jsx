import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../i18n/IdiomaContext";
import Logo from "../components/Logo";
import Digitando from "../components/Digitando";
import { recarregarUsuario } from "../firebase/auth";
import "./PaginaLogin.css";
import "./verificar-email.css";

const ESPERA_REENVIO = 60; // segundos entre reenvios
const INTERVALO_CHECAGEM = 4000;

// Atalho para a caixa de entrada conforme o provedor do e-mail
function linkCaixaDeEntrada(email = "") {
  const dominio = email.split("@")[1]?.toLowerCase() || "";
  if (dominio.includes("gmail")) return { nome: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" };
  if (/(hotmail|outlook|live|msn)\./.test(dominio)) return { nome: "Outlook", url: "https://outlook.live.com/mail/0/inbox" };
  if (dominio.includes("yahoo")) return { nome: "Yahoo", url: "https://mail.yahoo.com" };
  if (dominio.includes("icloud") || dominio.includes("me.com")) return { nome: "iCloud", url: "https://www.icloud.com/mail" };
  return null;
}

export default function TelaVerificarEmail({ aoUsarOutroEmail }) {
  const { usuario, sair, reenviarVerificacao, atualizarUsuario } = useAuth();
  const { t, idioma } = useIdioma();
  const [espera, setEspera] = useState(ESPERA_REENVIO);
  const [mensagem, setMensagem] = useState(null);
  const [checando, setChecando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const caixa = linkCaixaDeEntrada(usuario?.email);

  // contagem regressiva do "reenviar"
  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  // confere sozinho se o e-mail já foi confirmado (e quando a aba volta ao foco)
  useEffect(() => {
    let vivo = true;
    async function checar() {
      try {
        // só atualiza o app quando confirmar, para a tela não piscar
        const u = await recarregarUsuario();
        if (vivo && u?.emailVerified) setConfirmado(true);
      } catch { /* sem rede: tenta de novo no próximo ciclo */ }
    }
    const id = setInterval(checar, INTERVALO_CHECAGEM);
    window.addEventListener("focus", checar);
    return () => {
      vivo = false;
      clearInterval(id);
      window.removeEventListener("focus", checar);
    };
  }, []);

  // confirmou: mostra a animação e libera o app
  useEffect(() => {
    if (!confirmado) return;
    const id = setTimeout(() => atualizarUsuario(), 1600);
    return () => clearTimeout(id);
  }, [confirmado, atualizarUsuario]);

  async function reenviar() {
    setMensagem(null);
    try {
      await reenviarVerificacao(idioma);
      setEspera(ESPERA_REENVIO);
      setMensagem({ tipo: "ok", texto: t("verificar.reenviado") });
    } catch (e) {
      setMensagem({
        tipo: "erro",
        texto: e?.code === "auth/too-many-requests" ? t("auth.too-many-requests") : t("comum.erroGenerico"),
      });
    }
  }

  async function jaConfirmei() {
    setChecando(true);
    setMensagem(null);
    try {
      const u = await atualizarUsuario();
      if (u?.emailVerified) setConfirmado(true);
      else setMensagem({ tipo: "erro", texto: t("verificar.aindaNao") });
    } finally {
      setChecando(false);
    }
  }

  async function usarOutroEmail() {
    await sair();
    aoUsarOutroEmail?.();
  }

  return (
    <div className="tela-login">
      <div className="login-fundo" aria-hidden="true">
        <span className="orbe orbe-1" />
        <span className="orbe orbe-2" />
      </div>

      <div className="cartao-login luz verificar">
        {confirmado ? (
          <div className="verificar-ok">
            <svg className="verificar-check" viewBox="0 0 52 52" aria-hidden="true">
              <circle cx="26" cy="26" r="24" />
              <path d="m15 27 7.5 7.5L37.5 19" />
            </svg>
            <h1><Digitando texto={t("verificar.confirmado")} /></h1>
            <p className="subtitulo-login">{t("verificar.entrando")}</p>
          </div>
        ) : (
          <>
            <div className="marca-login">
              <Logo tamanho={36} />
              <span>{t("comum.marca")}</span>
            </div>

            <div className="verificar-envelope" aria-hidden="true">
              <span className="verificar-carta" />
              <span className="verificar-pulso" />
            </div>

            <h1 className="verificar-titulo"><Digitando texto={t("verificar.titulo")} atraso={300} /></h1>
            <p className="subtitulo-login">
              {t("verificar.texto")} <strong>{usuario?.email}</strong>
            </p>
            <p className="verificar-dica">{t("verificar.dica")}</p>

            {caixa && (
              <a className="botao-primario verificar-abrir" href={caixa.url} target="_blank" rel="noopener noreferrer">
                {t("verificar.abrir", { nome: caixa.nome })}
              </a>
            )}

            <button className="verificar-secundario" onClick={jaConfirmei} disabled={checando}>
              {checando ? t("verificar.checando") : t("verificar.jaConfirmei")}
            </button>

            <div className="verificar-aguardando">
              <span className="verificar-ponto" /> {t("verificar.aguardando")}
            </div>

            {mensagem && <p className={`verificar-msg ${mensagem.tipo}`}>{mensagem.texto}</p>}

            <div className="verificar-rodape">
              <button onClick={reenviar} disabled={espera > 0}>
                {espera > 0 ? t("verificar.reenviarEm", { s: espera }) : t("verificar.reenviar")}
              </button>
              <span>·</span>
              <button onClick={usarOutroEmail}>{t("verificar.outroEmail")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
