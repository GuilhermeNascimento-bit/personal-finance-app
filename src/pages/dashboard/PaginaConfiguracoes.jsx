import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { prepararFoto, salvarFoto, useFotoPerfil } from "../../firebase/perfil";
import { useMoeda, MOEDAS } from "../../context/MoedaContext";
import { IDIOMAS, useIdioma } from "../../i18n/IdiomaContext";
import { trocarTemaAnimado } from "../../utils/tema";
import Icone from "../../components/Icone";
import { useDemo } from "../../demo/DemoContext";
import "./configuracoes.css";

// ── Paleta de cores de destaque ───────────────────────────────────────────────

export const PALETA_CORES = [
  { id: "verde",   nome: "Verde",   acento: "#1d9e75", hover: "#0f6e56", suave: "rgba(29,158,117,0.12)" },
  { id: "azul",    nome: "Azul",    acento: "#2563eb", hover: "#1d4ed8", suave: "rgba(37,99,235,0.12)" },
  { id: "roxo",    nome: "Roxo",    acento: "#7c3aed", hover: "#6d28d9", suave: "rgba(124,58,237,0.12)" },
  { id: "rosa",    nome: "Rosa",    acento: "#db2777", hover: "#be185d", suave: "rgba(219,39,119,0.12)" },
  { id: "laranja", nome: "Laranja", acento: "#ea580c", hover: "#c2410c", suave: "rgba(234,88,12,0.12)" },
  { id: "dourado", nome: "Dourado", acento: "#b45309", hover: "#92400e", suave: "rgba(180,83,9,0.12)" },
];

export function aplicarCor(cor) {
  const r = document.documentElement;
  r.style.setProperty("--cor-acento", cor.acento);
  r.style.setProperty("--cor-acento-hover", cor.hover);
  r.style.setProperty("--cor-acento-fundo-suave", cor.suave);
  localStorage.setItem("cor-acento", JSON.stringify(cor));
}

// ── Temas ─────────────────────────────────────────────────────────────────────

const TEMAS = [
  { valor: "auto",   icone: "auto" },
  { valor: "claro",  icone: "sol" },
  { valor: "escuro", icone: "lua" },
];

// ── Componente ────────────────────────────────────────────────────────────────

export default function PaginaConfiguracoes() {
  const { usuario, sair } = useAuth();
  const { t, idioma, setIdioma } = useIdioma();
  const { emDemo, criarConta } = useDemo();
  const fotoInputRef = useRef(null);

  const [nome, setNome] = useState(usuario?.displayName || "");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [msgNome, setMsgNome] = useState(null);

  const [msgSenha, setMsgSenha] = useState(null);

  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [msgFoto, setMsgFoto] = useState(null);
  const fotoUrl = useFotoPerfil(usuario);

  const { moeda, setMoeda } = useMoeda();
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "auto");
  const [corId, setCorId] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cor-acento"))?.id || "verde"; }
    catch { return "verde"; }
  });

  // Perfil — salvar nome
  async function salvarNome() {
    if (!nome.trim()) return;
    setSalvandoNome(true);
    setMsgNome(null);
    try {
      await updateProfile(auth.currentUser, { displayName: nome.trim() });
      setMsgNome({ tipo: "sucesso", texto: t("config.nomeOk") });
    } catch {
      setMsgNome({ tipo: "erro", texto: t("config.nomeErro") });
    } finally {
      setSalvandoNome(false);
    }
  }

  // Foto de perfil — reduzida no navegador e salva no Firestore (ver firebase/perfil.js)
  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsgFoto({ tipo: "erro", texto: t("config.fotoTipo") });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMsgFoto({ tipo: "erro", texto: t("config.fotoTamanho") });
      return;
    }

    setUploadandoFoto(true);
    setMsgFoto(null);
    try {
      const dataUrl = await prepararFoto(file);
      await salvarFoto(usuario.uid, dataUrl);
      setMsgFoto({ tipo: "sucesso", texto: t("config.fotoOk") });
    } catch (err) {
      console.error("Erro no upload:", err);
      setMsgFoto({ tipo: "erro", texto: t("config.fotoErro") });
    } finally {
      setUploadandoFoto(false);
    }
  }

  // Segurança — reset de senha
  async function enviarResetSenha() {
    setMsgSenha(null);
    try {
      await sendPasswordResetEmail(auth, usuario.email);
      setMsgSenha({ tipo: "sucesso", texto: t("config.linkEnviado", { email: usuario.email }) });
    } catch {
      setMsgSenha({ tipo: "erro", texto: t("config.linkErro") });
    }
  }

  // Aparência — cor
  function mudarCor(cor) {
    setCorId(cor.id);
    aplicarCor(cor);
  }

  // Aparência — tema
  function mudarTema(novo, evento) {
    setTema(novo);
    trocarTemaAnimado(novo, evento);
  }

  const inicial = (usuario?.displayName || usuario?.email || "U")[0].toUpperCase();

  return (
    <div className="cfg">
      {/* ═══════ Cartão de perfil ═══════ */}
      {emDemo ? (
      <aside className="cfg-perfil-palco">
        <div className="cfg-perfil luz inclinar cfg-perfil-demo">
          <span className="cfg-perfil-brilho" aria-hidden="true" />
          <div className="cfg-avatar"><span><Icone nome="usuario" tamanho={40} /></span></div>
          <p className="cfg-perfil-nome">{t("demo.perfilTitulo")}</p>
          <p className="cfg-perfil-email">{t("demo.perfilTexto")}</p>
          <div className="cfg-perfil-acoes">
            <button className="cfg-perfil-botao destaque" onClick={criarConta}>
              {t("demo.criarConta")} <Icone nome="chevron" tamanho={16} />
            </button>
          </div>
        </div>
      </aside>
      ) : (
      <aside className="cfg-perfil-palco">
        <div className="cfg-perfil luz inclinar">
          <span className="cfg-perfil-brilho" aria-hidden="true" />
          <div className="cfg-avatar">
            {fotoUrl ? <img src={fotoUrl} alt="" /> : <span>{inicial}</span>}
            <button
              className="cfg-avatar-botao"
              onClick={() => fotoInputRef.current?.click()}
              disabled={uploadandoFoto}
              title={t("config.alterarFoto")}
              aria-label={t("config.alterarFoto")}
            >
              {uploadandoFoto ? <span className="cfg-girando" /> : <Icone nome="camera" tamanho={16} />}
            </button>
            <input ref={fotoInputRef} type="file" accept="image/*" hidden onChange={handleFotoChange} />
          </div>
          <p className="cfg-perfil-nome">{usuario?.displayName || t("config.seuNome")}</p>
          <p className="cfg-perfil-email">{usuario?.email}</p>
          {msgFoto && <p className={`cfg-msg ${msgFoto.tipo}`}>{msgFoto.texto}</p>}
          <p className="cfg-perfil-dica">{t("config.fotoDesc")}</p>

          <div className="cfg-perfil-acoes">
            <button
              className="cfg-perfil-botao"
              onClick={() => {
                localStorage.removeItem("tutorial-completo");
                window.location.reload();
              }}
            >
              <Icone nome="recomendacoes" tamanho={16} /> {t("config.reverTour")}
            </button>
            <button className="cfg-perfil-botao sair" onClick={sair}>
              <Icone nome="sair" tamanho={16} /> {t("comum.sair")}
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* ═══════ Seções ═══════ */}
      <div className="cfg-secoes">
        {!emDemo && (<>
{/* Perfil */}
        <section className="cfg-secao luz">
          <header className="cfg-secao-cab">
            <span className="cfg-secao-icone"><Icone nome="usuario" tamanho={18} /></span>
            <div>
              <h3>{t("config.perfil")}</h3>
              <p>{t("config.perfilDesc")}</p>
            </div>
          </header>
          <div className="cfg-campos">
            <label className="cfg-campo">
              <span>{t("config.nomeExibicao")}</span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && salvarNome()}
                placeholder={t("config.seuNome")}
              />
            </label>
            <label className="cfg-campo">
              <span>{t("config.email")}</span>
              <input type="email" value={usuario?.email || ""} disabled />
            </label>
          </div>
          <div className="cfg-linha-fim">
            {msgNome ? <p className={`cfg-msg ${msgNome.tipo}`}>{msgNome.texto}</p> : <span />}
            <button
              className="cfg-botao"
              onClick={salvarNome}
              disabled={salvandoNome || !nome.trim() || nome.trim() === usuario?.displayName}
            >
              {salvandoNome ? t("comum.salvando") : t("config.salvarNome")}
            </button>
          </div>
        </section>

        </>)}

        {/* Aparência */}
        <section className="cfg-secao luz">
          <header className="cfg-secao-cab">
            <span className="cfg-secao-icone"><Icone nome="pincel" tamanho={18} /></span>
            <div>
              <h3>{t("config.aparencia")}</h3>
              <p>{t("config.aparenciaDesc")}</p>
            </div>
          </header>

          <p className="cfg-rotulo">{t("config.tema")}</p>
          <div className="cfg-temas">
            {TEMAS.map((op) => (
              <button
                key={op.valor}
                className={`cfg-tema ${tema === op.valor ? "ativo" : ""}`}
                onClick={(e) => mudarTema(op.valor, e)}
              >
                <span className={`cfg-tema-previa previa-${op.valor}`} aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="cfg-tema-rotulo">
                  <Icone nome={op.icone} tamanho={15} />
                  {t(`config.tema_${op.valor}`)}
                </span>
              </button>
            ))}
          </div>

          <p className="cfg-rotulo">{t("config.corDestaque")}</p>
          <div className="cfg-cores">
            {PALETA_CORES.map((cor, i) => (
              <button
                key={cor.id}
                className={`cfg-cor ${corId === cor.id ? "ativo" : ""}`}
                style={{ "--cor-botao": cor.acento, animationDelay: `${i * 40}ms` }}
                onClick={() => mudarCor(cor)}
                title={cor.nome}
                aria-label={cor.nome}
              >
                {corId === cor.id && <Icone nome="check" tamanho={16} />}
              </button>
            ))}
          </div>
        </section>

        {/* Idioma e moeda */}
        <section className="cfg-secao luz">
          <header className="cfg-secao-cab">
            <span className="cfg-secao-icone"><Icone nome="globo" tamanho={18} /></span>
            <div>
              <h3>{t("config.regiao")}</h3>
              <p>{t("config.regiaoDesc")}</p>
            </div>
          </header>

          <p className="cfg-rotulo">{t("config.idioma")}</p>
          <div className="cfg-opcoes">
            {IDIOMAS.map((i) => (
              <button
                key={i.codigo}
                className={`cfg-opcao ${idioma === i.codigo ? "ativo" : ""}`}
                onClick={() => setIdioma(i.codigo)}
              >
                <span className="cfg-opcao-emoji">{i.bandeira}</span>
                <span className="cfg-opcao-texto">
                  <strong>{i.nome}</strong>
                  <small>{i.codigo.toUpperCase()}</small>
                </span>
              </button>
            ))}
          </div>

          <p className="cfg-rotulo">{t("config.moeda")}</p>
          <div className="cfg-opcoes tres">
            {MOEDAS.map((m) => (
              <button
                key={m.codigo}
                className={`cfg-opcao ${moeda.codigo === m.codigo ? "ativo" : ""}`}
                onClick={() => setMoeda(m.codigo)}
              >
                <span className="cfg-opcao-emoji">{m.bandeira}</span>
                <span className="cfg-opcao-texto">
                  <strong>{t(`config.moeda_${m.codigo}`)}</strong>
                  <small>{m.simbolo} · {m.codigo}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="cfg-dica">⠿ {t("config.ordemAbas")}</p>
        </section>

        {!emDemo && (<>
{/* Segurança */}
        <section className="cfg-secao luz">
          <header className="cfg-secao-cab">
            <span className="cfg-secao-icone"><Icone nome="cadeado" tamanho={18} /></span>
            <div>
              <h3>{t("config.seguranca")}</h3>
              <p>{t("config.alterarSenhaDesc")}</p>
            </div>
          </header>
          <div className="cfg-linha-fim">
            {msgSenha ? <p className={`cfg-msg ${msgSenha.tipo}`}>{msgSenha.texto}</p> : <span className="cfg-dica">{t("config.alterarSenha")}</span>}
            <button className="cfg-botao secundario" onClick={enviarResetSenha}>
              {t("config.enviarLink")}
            </button>
          </div>
        </section></>)}

        
      </div>
    </div>
  );
}
