import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { escutarMetas, adicionarMeta, atualizarMeta, removerMeta as removerMetaDb } from "../../firebase/metas";
import { adicionarTransacao } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";
import Confirmacao from "../../components/Confirmacao";
import { useDemo } from "../../demo/DemoContext";
import "./recomendacoes.css";
import { useIdioma } from "../../i18n/IdiomaContext";

function mesesAteData(dataAlvo) {
  const hoje = new Date();
  const alvo = new Date(dataAlvo);
  return Math.max(1,
    (alvo.getFullYear() - hoje.getFullYear()) * 12 +
    (alvo.getMonth() - hoje.getMonth())
  );
}

const EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "📱", "🎓", "💍", "🏖️", "🎸", "🐾", "💰"];

function ModalNovaMeta({ uid, aoFechar }) {
  const { formatarValor: fmt, moeda } = useMoeda();
  const { t } = useIdioma();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const meses = dataAlvo ? mesesAteData(dataAlvo) : null;
  const porMes = meses && valor ? (Number(valor) / meses) : null;

  async function salvar() {
    if (!nome.trim()) return setErro(t("metas.erroNome"));
    if (!valor || Number(valor) <= 0) return setErro(t("metas.erroValor"));
    if (!dataAlvo) return setErro(t("metas.erroData"));

    setSalvando(true);
    try {
      await adicionarMeta(uid, {
        nome: nome.trim(),
        valor: Number(valor),
        dataAlvo,
        emoji,
      });
      aoFechar();
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
      setErro(t("modal.erroSalvar"));
      setSalvando(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal modal-meta">
        <div className="modal-cabecalho">
          <h2>{t("metas.nova")}</h2>
          <button className="botao-fechar-modal" onClick={aoFechar} aria-label={t("comum.fechar")}>✕</button>
        </div>

        <div className="modal-corpo">
          <div className="campo-modal">
            <label>{t("metas.icone")}</label>
            <div className="grade-emojis">
              {EMOJIS.map((e) => (
                <button key={e} type="button"
                  className={`botao-emoji ${emoji === e ? "ativo" : ""}`}
                  onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-nome">{t("metas.nome")}</label>
            <input id="meta-nome" type="text" value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t("metas.placeholderNome")} />
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-valor">{t("metas.valor")}</label>
            <div className="input-com-prefixo">
              <span>{moeda.simbolo}</span>
              <input id="meta-valor" type="number" inputMode="decimal"
                value={valor} onChange={(e) => setValor(e.target.value)}
                placeholder="0,00" />
            </div>
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-data">{t("metas.dataAlvo")}</label>
            <input id="meta-data" type="date" value={dataAlvo}
              onChange={(e) => setDataAlvo(e.target.value)}
              min={new Date().toISOString().split("T")[0]} />
          </div>

          {porMes && meses && (
            <div className="preview-meta">
              <span>📅 {t("metas.mesesAte", { n: meses })}</span>
              <strong>{t("metas.guardarMes", { valor: fmt(porMes) })}</strong>
            </div>
          )}

          {erro && <p className="erro-modal">{erro}</p>}
        </div>

        <div className="modal-rodape">
          <button className="botao-cancelar" onClick={aoFechar}>{t("comum.cancelar")}</button>
          <button className="botao-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? t("comum.salvando") : t("metas.criar")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaginaMetas() {
  const { usuario } = useAuth();
  const { formatarValor: fmt, moeda } = useMoeda();
  const { t, formatarData } = useIdioma();
  const { emDemo, pedirConta } = useDemo();
  const uid = usuario?.uid;
  const [metas, setMetas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [guardandoEm, setGuardandoEm] = useState(null);   // meta recebendo economia
  const [valorGuardar, setValorGuardar] = useState("");
  const [salvandoEconomia, setSalvandoEconomia] = useState(false);
  const [paraRemover, setParaRemover] = useState(null);

  useEffect(() => {
    if (!uid) return;
    return escutarMetas(uid, setMetas);
  }, [uid]);

  async function removerMeta() {
    await removerMetaDb(uid, paraRemover.id);
    setParaRemover(null);
  }

  function abrirEconomia(meta) {
    setValorGuardar("");
    setGuardandoEm(meta);
  }

  async function adicionarEconomia() {
    const meta = guardandoEm;
    const valor = parseFloat(String(valorGuardar).replace(",", "."));
    if (!valor || valor <= 0) return;
    setSalvandoEconomia(true);
    try {
      await Promise.all([
      atualizarMeta(uid, meta.id, {
        acumulado: (meta.acumulado || 0) + valor,
      }),
      adicionarTransacao(uid, "despesa", {
        categoria: `${t("metas.prefixoCategoria")}: ${meta.nome}`,
        data: new Date(),
        valor,
        status: "pago",
      }),
    ]);
      setGuardandoEm(null);
    } finally {
      setSalvandoEconomia(false);
    }
  }

  return (
    <div className="pagina-recomendacoes">
      <div className="secao-metas">
        <div className="metas-cabecalho">
          <div>
            <h3 className="titulo-secao">{t("metas.planejamento")}</h3>
            <p className="subtitulo-secao">
              {t("metas.planejamentoSub")}
            </p>
          </div>
          <button className="botao-nova-meta" onClick={() => (emDemo ? pedirConta("metas") : setModalAberto(true))}>
            + {t("metas.nova")}
          </button>
        </div>

        {metas.length === 0 ? (
          <div className="metas-vazio">
            <p>🎯</p>
            <p>{t("metas.vazio")}</p>
            <p>{t("metas.vazioSub")}</p>
          </div>
        ) : (
          <div className="lista-metas">
            {metas.map((meta, i) => {
              const meses = mesesAteData(meta.dataAlvo);
              const guardadoPorMes = (meta.valor - (meta.acumulado || 0)) / meses;
              const progresso = Math.min(100, ((meta.acumulado || 0) / meta.valor) * 100);
              const concluida = progresso >= 100;

              return (
                <div key={meta.id} className={`card-meta luz ${concluida ? "meta-concluida" : ""}`}
                  style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="meta-topo">
                    <div className="meta-info">
                      <span className="meta-emoji">{meta.emoji || "🎯"}</span>
                      <div>
                        <p className="meta-nome">{meta.nome}</p>
                        <p className="meta-prazo">
                          {formatarData(meta.dataAlvo, { month: "long", year: "numeric" })} · {t("metas.meses", { n: meses })}
                        </p>
                      </div>
                    </div>
                    <div className="meta-acoes">
                      {!concluida && (
                        <button className="botao-acao-meta" onClick={() => abrirEconomia(meta)} title={t("metas.registrar")}>
                          +
                        </button>
                      )}
                      <button className="botao-acao-meta botao-remover-meta"
                        onClick={() => setParaRemover(meta)} title={t("comum.remover")}>
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="meta-valores">
                    <span className="meta-acumulado">{fmt(meta.acumulado || 0)}</span>
                    <span className="meta-separador">{t("metas.de")}</span>
                    <span className="meta-total">{fmt(meta.valor)}</span>
                  </div>

                  <div className="barra-meta-fundo">
                    <div className="barra-meta-progresso" style={{ width: `${progresso}%` }} />
                  </div>

                  <div className="meta-rodape">
                    {concluida ? (
                      <span className="meta-badge-concluida">✓ {t("metas.atingida")}</span>
                    ) : (
                      <>
                        <span className="meta-por-mes">
                          {t("metas.guardar")} <strong>{t("metas.porMes", { valor: fmt(Math.max(0, guardadoPorMes)) })}</strong>
                        </span>
                        <span className="meta-percentual">{progresso.toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalNovaMeta uid={uid} aoFechar={() => setModalAberto(false)} />
      )}

      {guardandoEm && (() => {
        const restante = Math.max(0, guardandoEm.valor - (guardandoEm.acumulado || 0));
        const sugestaoMes = restante / mesesAteData(guardandoEm.dataAlvo);
        const atalhos = [
          { rotulo: t("metas.atalhoMes"), valor: sugestaoMes },
          { rotulo: t("metas.atalhoTudo"), valor: restante },
        ].filter((a) => a.valor > 0);
        return (
          <Confirmacao
            icone="cofre"
            titulo={t("metas.quantoGuardou", { nome: guardandoEm.nome })}
            texto={t("metas.faltam", { valor: fmt(restante) })}
            rotuloConfirmar={t("metas.guardarBotao")}
            desabilitado={!(parseFloat(String(valorGuardar).replace(",", ".")) > 0)}
            ocupado={salvandoEconomia}
            aoConfirmar={adicionarEconomia}
            aoCancelar={() => setGuardandoEm(null)}
          >
            <div className="input-com-prefixo">
              <span>{moeda.simbolo}</span>
              <input
                autoFocus
                inputMode="decimal"
                placeholder={moeda.codigo === "USD" ? "0.00" : "0,00"}
                value={valorGuardar}
                onChange={(e) => setValorGuardar(e.target.value.replace(/[^\d.,]/g, ""))}
                aria-label={t("modal.valor")}
              />
            </div>
            {atalhos.length > 0 && (
              <div className="confirmacao-atalhos">
                {atalhos.map((a) => (
                  <button
                    key={a.rotulo}
                    type="button"
                    className="confirmacao-atalho"
                    onClick={() => setValorGuardar(a.valor.toFixed(2))}
                  >
                    {a.rotulo} · {fmt(a.valor)}
                  </button>
                ))}
              </div>
            )}
          </Confirmacao>
        );
      })()}

      {paraRemover && (
        <Confirmacao
          perigo
          icone="lixeira"
          titulo={t("metas.confirmarRemover")}
          texto={t("seguranca.removerTexto")}
          resumo={<><span>{paraRemover.emoji} {paraRemover.nome}</span><strong>{fmt(paraRemover.valor)}</strong></>}
          rotuloConfirmar={t("comum.remover")}
          aoConfirmar={removerMeta}
          aoCancelar={() => setParaRemover(null)}
        />
      )}
    </div>
  );
}
