// PaginaLogin.jsx
// Tela única que alterna entre "Entrar" e "Criar conta".
// Usa o AuthContext para falar com o Firebase Auth.

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../i18n/IdiomaContext";
import { temaEfetivo, trocarTemaAnimado } from "../utils/tema";
import Icone from "../components/Icone";
import Logo from "../components/Logo";
import Digitando from "../components/Digitando";
import "./PaginaLogin.css";

export default function PaginaLogin() {
  const { entrar, cadastrar } = useAuth();
  const { t, idioma, setIdioma } = useIdioma();
  const [tema, setTema] = useState(temaEfetivo);

  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ehCadastro = modo === "cadastrar";

  function alternarModo() {
    setErro("");
    setModo(ehCadastro ? "entrar" : "cadastrar");
  }

  async function lidarComEnvio(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const resultado = ehCadastro
      ? await cadastrar(nome.trim(), email.trim(), senha)
      : await entrar(email.trim(), senha);

    setEnviando(false);

    if (!resultado.sucesso) {
      const chave = `auth.${(resultado.codigo || "").replace("auth/", "")}`;
      const traduzido = t(chave);
      setErro(traduzido === chave ? t("auth.generico") : traduzido);
    }
    // Se sucesso, o AuthContext atualiza o usuário automaticamente
    // e o componente pai (App) decide redirecionar para o dashboard.
  }

  return (
    <div className="tela-login">
      <div className="login-fundo" aria-hidden="true">
        <span className="orbe orbe-1" />
        <span className="orbe orbe-2" />
      </div>
      <div className="login-cantos">
        <button className="login-canto-botao" onClick={() => setIdioma(idioma === "pt" ? "en" : "pt")}>
          <Icone nome="globo" tamanho={16} /> {idioma === "pt" ? "English" : "Português"}
        </button>
        <button
          className="login-canto-botao"
          onClick={(e) => {
            const novo = tema === "escuro" ? "claro" : "escuro";
            setTema(novo);
            trocarTemaAnimado(novo, e);
          }}
          aria-label={tema === "escuro" ? t("topo.temaClaro") : t("topo.temaEscuro")}
        >
          <Icone nome={tema === "escuro" ? "sol" : "lua"} tamanho={16} />
        </button>
      </div>
      <div className="cartao-login luz" key={modo}>
        <div className="cabecalho-login">
          <div className="marca-login">
            <Logo tamanho={36} />
            <span>{t("comum.marca")}</span>
          </div>
          <h1><Digitando texto={ehCadastro ? t("login.tituloCadastro") : t("login.tituloEntrar")} atraso={450} /></h1>
          <p className="subtitulo-login">
            {ehCadastro ? t("login.subCadastro") : t("login.subEntrar")}
          </p>
        </div>

        <form onSubmit={lidarComEnvio} className="formulario-login">
          {ehCadastro && (
            <div className="campo">
              <label htmlFor="nome">{t("login.nome")}</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={t("config.seuNome")}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">{t("config.email")}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.placeholderEmail")}
              required
              autoComplete="email"
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">{t("login.senha")}</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={ehCadastro ? t("login.senhaMin") : t("login.suaSenha")}
              required
              minLength={6}
              autoComplete={ehCadastro ? "new-password" : "current-password"}
            />
          </div>

          {erro && <p className="mensagem-erro">{erro}</p>}

          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? t("login.aguarde") : ehCadastro ? t("login.criarConta") : t("login.entrar")}
          </button>
        </form>

        <p className="rodape-login">
          {ehCadastro ? t("login.jaTem") : t("login.naoTem")}{" "}
          <button type="button" className="link-alternar" onClick={alternarModo}>
            {ehCadastro ? t("login.entrar") : t("login.criarConta")}
          </button>
        </p>
      </div>
    </div>
  );
}
