import { useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";
import { adicionarTransacao, editarTransacao } from "../../firebase/transacoes";
import Icone from "../../components/Icone";
import useContagem from "../../hooks/useContagem";
import Digitando from "../../components/Digitando";
import "./diario.css";

// ── utilidades ──────────────────────────────────────────────────────────────

function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mesmoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const limparCategoria = (c = "") => c.replace(/\s*\(\d+\/\d+\)$/, "").trim();

// Categorias mais usadas para um tipo (para virar "chips" de um toque)
function categoriasFrequentes(transacoes, tipo, limite = 6) {
  const cont = {};
  for (const t of transacoes) {
    if (t.tipo !== tipo) continue;
    const c = limparCategoria(t.categoria);
    if (c) cont[c] = (cont[c] || 0) + 1;
  }
  return Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, limite).map(([c]) => c);
}

const CHAVE_NADA = "diario-nada";
const hojeStr = () => inicioDoDia().toDateString();

const FORMAS = [
  { id: "dinheiro", rotulo: "comum.dinheiro" },
  { id: "debito", rotulo: "comum.debito" },
  { id: "credito", rotulo: "comum.credito" },
];

// ── Número que "conta" ──────────────────────────────────────────────────────
function Valor({ v, fmt, className }) {
  const animado = useContagem(v, 700);
  return <span className={className}>{fmt(animado)}</span>;
}

export default function PaginaDiario({ transacoes }) {
  const { usuario } = useAuth();
  const { formatarValor: fmt, moeda } = useMoeda();
  const { t, formatarData } = useIdioma();

  const [etapa, setEtapa] = useState(() =>
    localStorage.getItem(CHAVE_NADA) === hojeStr() ? "nada" : "pergunta"
  );
  const [tipo, setTipo] = useState("despesa");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ultimo, setUltimo] = useState(null);
  const [pulados, setPulados] = useState(() => new Set());
  const [confirmando, setConfirmando] = useState(null);
  const inputRef = useRef(null);

  const hoje = useMemo(() => inicioDoDia(), []);

  useEffect(() => {
    if (etapa === "valor" || etapa === "categoria") {
      const id = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(id);
    }
  }, [etapa]);

  const transacoesHoje = useMemo(
    () => transacoes.filter((tr) => mesmoDia(new Date(tr.data), hoje)),
    [transacoes, hoje]
  );

  // Pendências vencidas ou vencendo hoje → viram perguntas "Você já pagou…?"
  const perguntasPendentes = useMemo(() => {
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);
    return transacoes
      .filter((tr) => tr.status === "pendente" && new Date(tr.data) <= fimHoje && !pulados.has(tr.id))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [transacoes, hoje, pulados]);

  const proximas = useMemo(() => {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const em7 = new Date(hoje);
    em7.setDate(em7.getDate() + 8);
    return transacoes
      .filter((tr) => tr.status === "pendente" && new Date(tr.data) >= amanha && new Date(tr.data) < em7)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 5);
  }, [transacoes, hoje]);

  const entrou = transacoesHoje.filter((x) => x.tipo === "receita" && x.status === "pago").reduce((s, x) => s + x.valor, 0);
  const saiu = transacoesHoje.filter((x) => x.tipo === "despesa" && x.status === "pago").reduce((s, x) => s + x.valor, 0);

  const sugestoes = useMemo(() => categoriasFrequentes(transacoes, tipo), [transacoes, tipo]);

  const h = new Date().getHours();
  const saudacao = h < 12 ? t("diario.bomDia") : h < 18 ? t("diario.boaTarde") : t("diario.boaNoite");
  const nome = usuario?.displayName?.split(" ")[0];

  // ── ações do fluxo ──
  function comecar(novoTipo) {
    localStorage.removeItem(CHAVE_NADA);
    setTipo(novoTipo);
    setValor("");
    setCategoria("");
    setErro("");
    setEtapa("valor");
  }

  function nadaHoje() {
    localStorage.setItem(CHAVE_NADA, hojeStr());
    setEtapa("nada");
  }

  function confirmarValor(e) {
    e?.preventDefault();
    const n = Number(String(valor).replace(",", "."));
    if (!n || n <= 0) return setErro(t("diario.erroValor"));
    setErro("");
    setEtapa("categoria");
  }

  function escolherCategoria(c) {
    const cat = (c ?? categoria).trim();
    if (!cat) return;
    setCategoria(cat);
    if (tipo === "despesa") setEtapa("pagamento");
    else salvar(cat, "dinheiro");
  }

  async function salvar(cat, formaPagamento) {
    setSalvando(true);
    const n = Number(String(valor).replace(",", "."));
    try {
      await adicionarTransacao(usuario.uid, tipo, {
        categoria: cat,
        data: new Date(),
        valor: n,
        status: "pago",
        ...(tipo === "despesa" ? { formaPagamento } : {}),
      });
      setUltimo({ valor: n, categoria: cat, tipo });
      setEtapa("sucesso");
    } catch {
      setErro(t("comum.erroGenerico"));
    } finally {
      setSalvando(false);
    }
  }

  async function marcarPago(tr) {
    setConfirmando(tr.id);
    try {
      await editarTransacao(usuario.uid, tr.id, { status: "pago" });
    } catch {
      setPulados((p) => new Set(p).add(tr.id));
    } finally {
      setConfirmando(null);
    }
  }

  function voltar() {
    setErro("");
    setEtapa((e) => (e === "pagamento" ? "categoria" : e === "categoria" ? "valor" : "pergunta"));
  }

  const passos = tipo === "despesa" ? ["valor", "categoria", "pagamento"] : ["valor", "categoria"];
  const indicePasso = passos.indexOf(etapa);
  const pendente = perguntasPendentes[0];
  const jaRegistrouHoje = transacoesHoje.length > 0;

  return (
    <div className="pagina-diario">
      {/* ═══════════ Conversa ═══════════ */}
      <section className={`di-conversa luz di-tom-${etapa === "pergunta" || etapa === "nada" ? "neutro" : tipo}`}>
        {indicePasso >= 0 && (
          <div className="di-topo-passos">
            <button className="di-voltar" onClick={voltar} aria-label={t("comum.voltar")}>
              <Icone nome="chevron-esq" tamanho={18} />
            </button>
            <div className="di-progresso">
              {passos.map((p, i) => (
                <span key={p} className={`di-progresso-seg ${i <= indicePasso ? "on" : ""}`} />
              ))}
            </div>
          </div>
        )}

        <div className="di-etapa" key={etapa}>
          {etapa === "pergunta" && (
            <>
              <p className="di-saudacao">{saudacao}{nome ? `, ${nome}` : ""} 👋</p>
              <h2 className="di-pergunta">
                <Digitando texto={jaRegistrouHoje ? t("diario.maisAlgo") : t("diario.pergunta")} atraso={350} />
              </h2>
              <div className="di-escolhas">
                <button className="di-escolha di-escolha-despesa" onClick={() => comecar("despesa")}>
                  <span className="di-escolha-icone"><Icone nome="despesa" tamanho={26} /></span>
                  {t("diario.gastei")}
                </button>
                <button className="di-escolha di-escolha-receita" onClick={() => comecar("receita")}>
                  <span className="di-escolha-icone"><Icone nome="receita" tamanho={26} /></span>
                  {t("diario.ganhei")}
                </button>
              </div>
              {!jaRegistrouHoje && (
                <button className="di-link" onClick={nadaHoje}>{t("diario.nadaHoje")}</button>
              )}
            </>
          )}

          {etapa === "nada" && (
            <div className="di-final">
              <span className="di-final-emoji">🌿</span>
              <h2 className="di-pergunta"><Digitando texto={t("diario.diaTranquilo")} /></h2>
              <p className="di-detalhe">{t("diario.diaTranquiloDetalhe")}</p>
              <button className="di-link" onClick={() => setEtapa("pergunta")}>{t("diario.mudeiIdeia")}</button>
            </div>
          )}

          {etapa === "valor" && (
            <form onSubmit={confirmarValor}>
              <h2 className="di-pergunta"><Digitando texto={tipo === "despesa" ? t("diario.quantoGastou") : t("diario.quantoGanhou")} /></h2>
              <label className="di-valor-campo">
                <span className="di-valor-moeda">{moeda.simbolo}</span>
                <input
                  ref={inputRef}
                  className="di-valor-input"
                  inputMode="decimal"
                  placeholder={moeda.codigo === "USD" ? "0.00" : "0,00"}
                  value={valor}
                  onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
                  style={{ width: `${Math.max(4, valor.length + 1)}ch` }}
                />
              </label>
              {erro && <p className="di-erro">{erro}</p>}
              <div className="di-rodape-acao">
                <span className="di-dica">{t("diario.enterContinua")}</span>
                <button type="submit" className="di-botao">{t("comum.continuar")}<Icone nome="chevron" tamanho={16} /></button>
              </div>
            </form>
          )}

          {etapa === "categoria" && (
            <form onSubmit={(e) => { e.preventDefault(); escolherCategoria(); }}>
              <h2 className="di-pergunta"><Digitando texto={tipo === "despesa" ? t("diario.comOQue") : t("diario.deOnde")} /></h2>
              {sugestoes.length > 0 && (
                <div className="di-chips">
                  {sugestoes.map((c, i) => (
                    <button
                      type="button"
                      key={c}
                      className="di-chip"
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => escolherCategoria(c)}
                      disabled={salvando}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <input
                ref={inputRef}
                className="di-texto-input"
                placeholder={tipo === "despesa" ? t("diario.placeholderGasto") : t("diario.placeholderGanho")}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
              {erro && <p className="di-erro">{erro}</p>}
              <div className="di-rodape-acao">
                <span className="di-dica">{t("diario.enterContinua")}</span>
                <button type="submit" className="di-botao" disabled={!categoria.trim() || salvando}>
                  {salvando ? t("comum.salvando") : t("comum.continuar")}<Icone nome="chevron" tamanho={16} />
                </button>
              </div>
            </form>
          )}

          {etapa === "pagamento" && (
            <>
              <h2 className="di-pergunta"><Digitando texto={t("diario.comoPagou")} /></h2>
              <div className="di-formas">
                {FORMAS.map((f, i) => (
                  <button
                    key={f.id}
                    className="di-forma"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => salvar(categoria, f.id)}
                    disabled={salvando}
                  >
                    {t(f.rotulo)}
                  </button>
                ))}
              </div>
              {erro && <p className="di-erro">{erro}</p>}
            </>
          )}

          {etapa === "sucesso" && ultimo && (
            <div className="di-final">
              <svg className="di-check" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" />
                <path d="m15 27 7.5 7.5L37.5 19" />
              </svg>
              <h2 className="di-pergunta"><Digitando texto={t("diario.pronto")} atraso={550} velocidade={45} /></h2>
              <p className="di-detalhe">
                {ultimo.tipo === "receita" ? "+" : "−"}{" "}
                {t("diario.prontoDetalhe", { valor: fmt(ultimo.valor), categoria: ultimo.categoria })}
              </p>
              <div className="di-escolhas di-escolhas-final">
                <button className="di-botao di-botao-secundario" onClick={() => setEtapa("pergunta")}>{t("diario.feito")}</button>
                <button className="di-botao" onClick={() => comecar(ultimo.tipo)}>{t("diario.registrarOutro")}</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ Lateral ═══════════ */}
      <aside className="di-lateral">
        {/* Pergunta sobre contas vencidas/vencendo */}
        {pendente && (
          <div className="di-pendencia luz" key={pendente.id}>
            <span className="di-pendencia-icone"><Icone nome="alerta" tamanho={18} /></span>
            <div className="di-pendencia-texto">
              <p className="di-pendencia-pergunta">
                {pendente.tipo === "receita"
                  ? t("diario.jaRecebeu", { nome: limparCategoria(pendente.categoria) })
                  : t("diario.jaPagou", { nome: limparCategoria(pendente.categoria) })}
              </p>
              <p className="di-pendencia-meta">
                {mesmoDia(new Date(pendente.data), hoje)
                  ? t("diario.venceHoje", { valor: fmt(pendente.valor) })
                  : t("diario.venceuEm", {
                      valor: fmt(pendente.valor),
                      data: formatarData(pendente.data, { day: "numeric", month: "short" }),
                    })}
              </p>
              <div className="di-pendencia-botoes">
                <button className="di-mini di-mini-sim" onClick={() => marcarPago(pendente)} disabled={confirmando === pendente.id}>
                  <Icone nome="check" tamanho={14} />
                  {pendente.tipo === "receita" ? t("diario.jaRecebi") : t("diario.jaPaguei")}
                </button>
                <button className="di-mini" onClick={() => setPulados((p) => new Set(p).add(pendente.id))}>
                  {t("diario.aindaNao")}
                </button>
              </div>
            </div>
            {perguntasPendentes.length > 1 && <span className="di-pendencia-contador">+{perguntasPendentes.length - 1}</span>}
          </div>
        )}

        <div className="di-bloco luz">
          <h3 className="di-bloco-titulo">{t("diario.seuDia")}</h3>
          <div className="di-resumo">
            <div>
              <span className="di-resumo-label"><i className="ponto receita" />{t("diario.entrou")}</span>
              <Valor v={entrou} fmt={fmt} className="di-resumo-valor" />
            </div>
            <div>
              <span className="di-resumo-label"><i className="ponto despesa" />{t("diario.saiu")}</span>
              <Valor v={saiu} fmt={fmt} className="di-resumo-valor" />
            </div>
            <div>
              <span className="di-resumo-label">{t("diario.saldoDia")}</span>
              <Valor v={entrou - saiu} fmt={fmt} className={`di-resumo-valor ${entrou - saiu < 0 ? "neg" : ""}`} />
            </div>
          </div>

          <h4 className="di-subtitulo">{t("diario.registrosHoje")}</h4>
          {transacoesHoje.length === 0 ? (
            <p className="di-vazio">{t("diario.nenhumHoje")}</p>
          ) : (
            <ul className="di-lista">
              {transacoesHoje.map((tr, i) => (
                <li key={tr.id} className="di-item" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={`di-item-icone ${tr.tipo}`}>
                    <Icone nome={tr.tipo} tamanho={14} />
                  </span>
                  <span className="di-item-nome">{tr.categoria}</span>
                  <span className={`di-item-valor ${tr.tipo}`}>
                    {tr.tipo === "receita" ? "+" : "−"} {fmt(tr.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {proximas.length > 0 && (
          <div className="di-bloco luz">
            <h3 className="di-bloco-titulo">{t("diario.proximos")}</h3>
            <ul className="di-lista">
              {proximas.map((tr, i) => (
                <li key={tr.id} className="di-item" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="di-item-data">
                    {formatarData(tr.data, { day: "2-digit" })}
                    <small>{formatarData(tr.data, { month: "short" }).replace(".", "")}</small>
                  </span>
                  <span className="di-item-nome">{tr.categoria}</span>
                  <span className={`di-item-valor ${tr.tipo}`}>
                    {tr.tipo === "receita" ? "+" : "−"} {fmt(tr.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
