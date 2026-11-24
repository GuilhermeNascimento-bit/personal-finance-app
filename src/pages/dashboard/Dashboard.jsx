import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../context/AuthContext";
import { useIdioma } from "../../i18n/IdiomaContext";
import { escutarTransacoes, calcularRelatorio } from "../../firebase/transacoes";
import VisaoGeral from "./VisaoGeral";
import ListaTransacoes from "./ListaTransacoes";
import ModalTransacao from "./ModalTransacao";
import PaginaRecomendacoes from "./PaginaRecomendacoes";
import PaginaMetas from "./PaginaMetas";
import PaginaRelatorios from "./PaginaRelatorios";
import PaginaConfiguracoes from "./PaginaConfiguracoes";
import PaginaFluxo from "./PaginaFluxo";
import PaginaDiario from "./PaginaDiario";
import Tutorial from "./Tutorial";
import Icone from "../../components/Icone";
import Logo from "../../components/Logo";
import Digitando from "../../components/Digitando";
import Confirmacao from "../../components/Confirmacao";
import { useMoeda } from "../../context/MoedaContext";
import { useFotoPerfil } from "../../firebase/perfil";
import { temaEfetivo, trocarTemaAnimado } from "../../utils/tema";
import "./dashboard.css";

// ── Navegação ────────────────────────────────────────────────────────────────
// 5 abas principais; algumas têm sub-abas. "configuracoes" fica no ícone ⚙.

const ABAS_DEFAULT = [
  { id: "visao-geral" },
  { id: "diario" },
  { id: "transacoes", filhas: ["transacoes", "lembretes"] },
  { id: "metas" },
  { id: "relatorios", filhas: ["relatorios", "fluxo", "recomendacoes"] },
];

// Rótulo da sub-aba que tem o mesmo id da aba-mãe
const ROTULO_SUB = { transacoes: "nav.todas", relatorios: "nav.resumo" };

function abaMae(id) {
  return ABAS_DEFAULT.find((a) => a.id === id || a.filhas?.includes(id))?.id ?? id;
}

function carregarAbas() {
  try {
    const salvo = localStorage.getItem("nav-order");
    if (!salvo) return ABAS_DEFAULT;
    const ids = JSON.parse(salvo);
    const ordenadas = ids.map((id) => ABAS_DEFAULT.find((a) => a.id === id)).filter(Boolean);
    const novas = ABAS_DEFAULT.filter((a) => !ids.includes(a.id));
    return [...ordenadas, ...novas];
  } catch {
    return ABAS_DEFAULT;
  }
}

// Indicador que desliza até o item ativo (usado nas abas e sub-abas)
function useIndicador(containerRef, chaveAtiva, deps = []) {
  const [estilo, setEstilo] = useState({ opacity: 0 });
  useLayoutEffect(() => {
    const cont = containerRef.current;
    const ativo = cont?.querySelector(".ativo");
    if (!cont || !ativo) return setEstilo({ opacity: 0 });
    setEstilo({
      opacity: 1,
      width: ativo.offsetWidth,
      height: ativo.offsetHeight,
      transform: `translate(${ativo.offsetLeft}px, ${ativo.offsetTop}px)`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveAtiva, ...deps]);
  return estilo;
}

// ── Aba da barra superior (arrastável) ──────────────────────────────────────

function AbaSortable({ aba, rotulo, isAtivo, onClick, dica }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: aba.id });

  return (
    <button
      ref={setNodeRef}
      className={`tab-item ${isAtivo ? "ativo" : ""}`}
      onClick={onClick}
      data-aba={aba.id}
      title={dica}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      {rotulo}
    </button>
  );
}

function Avatar({ usuario, size = 30 }) {
  const foto = useFotoPerfil(usuario);
  if (foto) {
    return (
      <img
        src={foto}
        alt=""
        className="usuario-foto"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className="usuario-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { usuario, sair } = useAuth();
  const { t, idioma, setIdioma, formatarData } = useIdioma();
  const { formatarValor } = useMoeda();

  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [aba, setAba] = useState("visao-geral"); // id "folha" (pode ser sub-aba)
  const [ultimaSub, setUltimaSub] = useState({}); // lembra a última sub-aba de cada mãe
  const [abas, setAbas] = useState(carregarAbas);
  const [tutorialAberto, setTutorialAberto] = useState(() => !localStorage.getItem("tutorial-completo"));
  const [maisAberto, setMaisAberto] = useState(false);
  const [tipoModalInicial, setTipoModalInicial] = useState("despesa");
  const [tema, setTema] = useState(temaEfetivo);
  const [confirmarEdicao, setConfirmarEdicao] = useState(null); // transação aguardando confirmação

  const relatorio = calcularRelatorio(transacoes);
  const mae = abaMae(aba);
  const abaMaeObj = ABAS_DEFAULT.find((a) => a.id === mae);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const tabsRef = useRef(null);
  const subRef = useRef(null);
  const indicadorTabs = useIndicador(tabsRef, mae, [abas, idioma]);
  const indicadorSub = useIndicador(subRef, aba, [idioma]);

  useEffect(() => {
    if (!usuario) return;
    return escutarTransacoes(usuario.uid, (dados) => {
      setTransacoes(dados);
      setCarregando(false);
    });
  }, [usuario]);

  // Mantém o ícone sol/lua em sincronia (inclusive quando muda em Configurações)
  useEffect(() => {
    const atualizar = () => setTema(temaEfetivo());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("tema-mudou", atualizar);
    mq.addEventListener("change", atualizar);
    return () => {
      window.removeEventListener("tema-mudou", atualizar);
      mq.removeEventListener("change", atualizar);
    };
  }, []);

  const navegar = useCallback((id) => {
    const m = abaMae(id);
    const obj = ABAS_DEFAULT.find((a) => a.id === m);
    // clicar na aba-mãe volta para a última sub-aba usada
    const destino = id === m && obj?.filhas ? (ultimaSub[m] ?? id) : id;
    if (obj?.filhas) setUltimaSub((u) => ({ ...u, [m]: destino }));
    setAba(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ultimaSub]);

  // Navegação direta para uma sub-aba (tutorial, ações rápidas)
  const irPara = useCallback((id) => {
    const m = abaMae(id);
    if (ABAS_DEFAULT.find((a) => a.id === m)?.filhas) setUltimaSub((u) => ({ ...u, [m]: id }));
    setAba(id);
  }, []);

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setAbas((prev) => {
      const nova = arrayMove(prev, prev.findIndex((a) => a.id === active.id), prev.findIndex((a) => a.id === over.id));
      localStorage.setItem("nav-order", JSON.stringify(nova.map((a) => a.id)));
      return nova;
    });
  }

  function fecharTutorial() {
    localStorage.setItem("tutorial-completo", "1");
    setTutorialAberto(false);
  }

  function abrirModalNovo(tipo = "despesa") { setTipoModalInicial(tipo); setTransacaoEditando(null); setModalAberto(true); }
  function abrirModalEditar(tr) { setConfirmarEdicao(tr); }
  function confirmarEditar() {
    setTransacaoEditando(confirmarEdicao);
    setConfirmarEdicao(null);
    setModalAberto(true);
  }
  function fecharModal() { setModalAberto(false); setTransacaoEditando(null); }

  const primeiroNome = usuario?.displayName?.split(" ")[0];
  const abasMobileFixas = ["visao-geral", "diario", "transacoes"];
  const abasMobileExtras = [...abas.filter((a) => !abasMobileFixas.includes(a.id)).map((a) => a.id), "configuracoes"];

  return (
    <div className="layout-dashboard">
      {/* Luz ambiente que acompanha o cursor */}
      <div className="fundo-ambiente" aria-hidden="true">
        <span className="orbe orbe-1" />
        <span className="orbe orbe-2" />
        <span className="orbe orbe-cursor" />
      </div>

      {/* ── Barra superior ── */}
      <header className="topbar">
        <button className="topbar-marca" onClick={() => navegar("visao-geral")}>
          <Logo tamanho={32} />
          <span className="marca-nome">{t("comum.marca")}</span>
        </button>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={abas.map((a) => a.id)} strategy={horizontalListSortingStrategy}>
            <nav className="topbar-tabs" ref={tabsRef}>
              <span className="tab-indicador" style={indicadorTabs} aria-hidden="true" />
              {abas.map((a) => (
                <AbaSortable
                  key={a.id}
                  aba={a}
                  rotulo={t(`nav.${a.id}`)}
                  dica={t("nav.arrastar")}
                  isAtivo={mae === a.id}
                  onClick={() => navegar(a.id)}
                />
              ))}
            </nav>
          </SortableContext>
        </DndContext>

        <div className="topbar-acoes">
          <button
            className="topbar-botao topbar-idioma"
            onClick={() => setIdioma(idioma === "pt" ? "en" : "pt")}
            title={t("topo.idioma")}
          >
            <span key={idioma} className="topbar-idioma-texto">{idioma.toUpperCase()}</span>
          </button>
          <button
            className="topbar-botao"
            onClick={(e) => trocarTemaAnimado(tema === "escuro" ? "claro" : "escuro", e)}
            title={tema === "escuro" ? t("topo.temaClaro") : t("topo.temaEscuro")}
          >
            <span key={tema} className="topbar-tema-icone">
              <Icone nome={tema === "escuro" ? "sol" : "lua"} tamanho={18} />
            </span>
          </button>
          <button
            className={`topbar-botao ${aba === "configuracoes" ? "ativo" : ""}`}
            onClick={() => navegar("configuracoes")}
            title={t("nav.configuracoes")}
            data-aba="configuracoes"
          >
            <Icone nome="configuracoes" tamanho={18} />
          </button>
          <span className="topbar-divisor" />
          <Avatar usuario={usuario} size={32} />
          <button className="topbar-botao botao-sair" onClick={sair} title={t("comum.sair")}>
            <Icone nome="sair" tamanho={17} />
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="conteudo-dashboard">
        {mae !== "visao-geral" && mae !== "diario" && (
          <header className="cabecalho-dashboard">
            <div>
              <p className="subtitulo-pagina">
                {formatarData(new Date(), { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <h1 className="titulo-pagina" key={mae}><Digitando texto={t(`nav.${mae}`)} velocidade={34} /></h1>
            </div>
            {mae === "transacoes" && (
              <button className="botao-nova-transacao" onClick={() => abrirModalNovo("despesa")}>
                <Icone nome="mais_sinal" tamanho={16} />
                {t("comum.novaTransacao")}
              </button>
            )}
          </header>
        )}

        {abaMaeObj?.filhas && (
          <div className="sub-abas" ref={subRef} role="tablist">
            <span className="sub-indicador" style={indicadorSub} aria-hidden="true" />
            {abaMaeObj.filhas.map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={aba === id}
                className={`sub-aba ${aba === id ? "ativo" : ""}`}
                onClick={() => irPara(id)}
                data-aba={id}
              >
                {t(ROTULO_SUB[id] ?? `nav.${id}`)}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <div className="estado-carregando"><div className="carregador" /></div>
        ) : (
          <div className="transicao-aba" key={aba}>
            {aba === "visao-geral" && (
              <VisaoGeral
                transacoes={transacoes}
                relatorio={relatorio}
                nome={primeiroNome}
                aoNovo={abrirModalNovo}
                aoNavegar={irPara}
              />
            )}
            {aba === "diario" && <PaginaDiario transacoes={transacoes} />}
            {aba === "transacoes" && (
              <div className="cartao-dashboard luz">
                <ListaTransacoes transacoes={transacoes} uid={usuario.uid} aoEditar={abrirModalEditar} />
              </div>
            )}
            {aba === "lembretes" && (
              <div className="cartao-dashboard luz">
                <ListaTransacoes
                  transacoes={transacoes.filter((tr) => tr.status === "pendente")}
                  uid={usuario.uid}
                  aoEditar={abrirModalEditar}
                  modoLembrete
                />
              </div>
            )}
            {aba === "fluxo" && <PaginaFluxo transacoes={transacoes} />}
            {aba === "recomendacoes" && <PaginaRecomendacoes transacoes={transacoes} />}
            {aba === "metas" && <PaginaMetas />}
            {aba === "relatorios" && <PaginaRelatorios transacoes={transacoes} />}
            {aba === "configuracoes" && <PaginaConfiguracoes />}
          </div>
        )}
      </main>

      {/* ── Navbar mobile ── */}
      <nav className="navbar-mobile">
        {abasMobileFixas.slice(0, 2).map((id) => (
          <button key={id} className={`nav-mobile-item ${mae === id ? "ativo" : ""}`} onClick={() => navegar(id)}>
            <Icone nome={id} tamanho={20} />
            <span>{t(`nav.${id}`)}</span>
          </button>
        ))}
        <button className="nav-mobile-fab" onClick={() => abrirModalNovo("despesa")} aria-label={t("comum.novaTransacao")}>
          <Icone nome="mais_sinal" tamanho={22} />
        </button>
        {abasMobileFixas.slice(2).map((id) => (
          <button key={id} className={`nav-mobile-item ${mae === id ? "ativo" : ""}`} onClick={() => navegar(id)}>
            <Icone nome={id} tamanho={20} />
            <span>{t(`nav.${id}`)}</span>
          </button>
        ))}
        <button
          className={`nav-mobile-item ${abasMobileExtras.includes(mae) ? "ativo" : ""}`}
          onClick={() => setMaisAberto(true)}
        >
          <Icone nome="mais" tamanho={20} />
          <span>{t("nav.mais")}</span>
        </button>
      </nav>

      {/* ── Bottom sheet "Mais" ── */}
      {maisAberto && (
        <div className="overlay-mais" onClick={() => setMaisAberto(false)}>
          <div className="sheet-mais" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p className="sheet-titulo">{t("nav.todasAbas")}</p>
            {abasMobileExtras.map((id) => (
              <button
                key={id}
                className={`sheet-item ${mae === id ? "ativo" : ""}`}
                onClick={() => { navegar(id); setMaisAberto(false); }}
              >
                <span className="sheet-item-icone"><Icone nome={id} /></span>
                <span>{t(`nav.${id}`)}</span>
              </button>
            ))}
            <div className="sheet-linha">
              <button className="sheet-chip" onClick={() => setIdioma(idioma === "pt" ? "en" : "pt")}>
                <Icone nome="globo" tamanho={16} /> {idioma === "pt" ? "English" : "Português"}
              </button>
              <button className="sheet-chip" onClick={(e) => trocarTemaAnimado(tema === "escuro" ? "claro" : "escuro", e)}>
                <Icone nome={tema === "escuro" ? "sol" : "lua"} tamanho={16} />
                {tema === "escuro" ? t("topo.temaClaro") : t("topo.temaEscuro")}
              </button>
            </div>
          </div>
        </div>
      )}

      {tutorialAberto && <Tutorial aoFechar={fecharTutorial} onNavegar={irPara} />}

      {confirmarEdicao && (
        <Confirmacao
          icone="lapis"
          titulo={t("seguranca.editarTitulo")}
          texto={t("seguranca.editarTexto")}
          resumo={
            <>
              <span>
                {confirmarEdicao.categoria}
                <br />
                <small style={{ color: "var(--cor-texto-secundario)" }}>
                  {formatarData(confirmarEdicao.data, { day: "numeric", month: "long", year: "numeric" })}
                </small>
              </span>
              <strong>
                {confirmarEdicao.tipo === "receita" ? "+" : "−"} {formatarValor(confirmarEdicao.valor)}
              </strong>
            </>
          }
          rotuloConfirmar={t("seguranca.simEditar")}
          aoConfirmar={confirmarEditar}
          aoCancelar={() => setConfirmarEdicao(null)}
        />
      )}

      {modalAberto && (
        <ModalTransacao
          uid={usuario.uid}
          transacao={transacaoEditando}
          aoFechar={fecharModal}
          tipoInicial={tipoModalInicial}
        />
      )}
    </div>
  );
}
