import { useState } from "react";
import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";
import Icone from "../../components/Icone";
import useContagem from "../../hooks/useContagem";
import GraficoBarras from "./GraficoBarras";
import Digitando from "../../components/Digitando";

// Cor estável por categoria (para o "monograma" da atividade)
function tomDaCategoria(nome = "") {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 7) + 1;
}

function statusPendencia(tr) {
  if (tr.tipo === "receita" || tr.status === "pago") return null;
  const d = new Date(tr.data);
  d.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return d < hoje ? "atrasado" : "pendente";
}

// Valor monetário que "conta" até o número final
function Contador({ valor, oculto, fmt, mascara = "••••••" }) {
  const v = useContagem(valor);
  return oculto ? mascara : fmt(v);
}

export default function VisaoGeral({ transacoes, relatorio, nome, aoNovo, aoNavegar }) {
  const { formatarValor } = useMoeda();
  const { t, formatarData } = useIdioma();
  const [oculto, setOculto] = useState(() => localStorage.getItem("ocultar-saldo") === "1");

  const { saldoReal, saldoPrevisto, totalReceitas, totalDespesasPagas, despesas } = relatorio;

  function alternarOculto() {
    setOculto((o) => {
      localStorage.setItem("ocultar-saldo", o ? "0" : "1");
      return !o;
    });
  }

  function rotuloData(data) {
    const d = new Date(data);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) return t("comum.hoje");
    if (d.toDateString() === ontem.toDateString()) return t("comum.ontem");
    return formatarData(d, { day: "2-digit", month: "short" }).replace(".", "");
  }

  // Gastos por categoria
  const porCategoria = {};
  despesas.forEach((d) => {
    const cat = (d.categoria || t("comum.outros")).replace(/\s*\(\d+\/\d+\)$/, "");
    porCategoria[cat] = (porCategoria[cat] || 0) + d.valor;
  });
  const categorias = Object.entries(porCategoria)
    .map(([n, valor]) => ({ nome: n, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
  const maiorCategoria = categorias[0]?.valor || 1;
  const totalCategorias = categorias.reduce((s, c) => s + c.valor, 0);

  const recentes = transacoes.slice(0, 7);

  const acoes = [
    { id: "receita", label: t("comum.receita"), icone: "receita", onClick: () => aoNovo("receita") },
    { id: "despesa", label: t("comum.despesa"), icone: "despesa", onClick: () => aoNovo("despesa") },
    { id: "diario", label: t("nav.diario"), icone: "diario", onClick: () => aoNavegar("diario") },
    { id: "metas", label: t("nav.metas"), icone: "metas", onClick: () => aoNavegar("metas") },
    { id: "fluxo", label: t("nav.fluxo"), icone: "fluxo", onClick: () => aoNavegar("fluxo") },
  ];

  return (
    <div className="vg">
      {/* ── Cartão de saldo ── */}
      <div className="vg-hero-palco">
        <section className="vg-hero luz inclinar">
          <span className="vg-hero-luz" aria-hidden="true" />
          <div className="vg-hero-topo">
            <span className="vg-hero-saudacao"><Digitando texto={nome ? t("vg.ola", { nome }) : t("vg.seuSaldo")} atraso={400} /></span>
            <button
              className="vg-hero-olho"
              onClick={alternarOculto}
              aria-label={oculto ? t("vg.mostrar") : t("vg.ocultar")}
            >
              <span key={String(oculto)} className="vg-hero-olho-icone">
                <Icone nome={oculto ? "olho-fechado" : "olho"} tamanho={18} />
              </span>
            </button>
          </div>

          <p className="vg-hero-label">{t("vg.saldoDisponivel")}</p>
          <p key={String(oculto)} className={`vg-hero-valor ${saldoReal < 0 ? "negativo" : ""} ${oculto ? "oculto" : ""}`}>
            <Contador valor={saldoReal} oculto={oculto} fmt={formatarValor} />
          </p>

          <div className="vg-hero-rodape">
            <div>
              <span className="vg-hero-mini-label"><i className="ponto receita" />{t("vg.entradas")}</span>
              <span className="vg-hero-mini-valor"><Contador valor={totalReceitas} oculto={oculto} fmt={formatarValor} /></span>
            </div>
            <div>
              <span className="vg-hero-mini-label"><i className="ponto despesa" />{t("vg.saidas")}</span>
              <span className="vg-hero-mini-valor"><Contador valor={totalDespesasPagas} oculto={oculto} fmt={formatarValor} /></span>
            </div>
            <div>
              <span className="vg-hero-mini-label">{t("vg.previsto")}</span>
              <span className="vg-hero-mini-valor"><Contador valor={saldoPrevisto} oculto={oculto} fmt={formatarValor} /></span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Ações rápidas ── */}
      <nav className="vg-acoes" aria-label={t("vg.acoesRapidas")}>
        {acoes.map((a, i) => (
          <button
            key={a.id}
            className={`vg-acao vg-acao-${a.id}`}
            onClick={a.onClick}
            style={{ animationDelay: `${120 + i * 50}ms` }}
          >
            <span className="vg-acao-icone luz"><Icone nome={a.icone} tamanho={20} /></span>
            <span className="vg-acao-label">{a.label}</span>
          </button>
        ))}
      </nav>

      <div className="vg-grade">
        {/* ── Atividade recente ── */}
        <section className="vg-bloco vg-atividade luz">
          <header className="vg-bloco-cab">
            <h2>{t("vg.atividade")}</h2>
            <button className="vg-link" onClick={() => aoNavegar("transacoes")}>
              {t("vg.verTudo")} <Icone nome="chevron" tamanho={14} />
            </button>
          </header>

          {recentes.length === 0 ? (
            <p className="vg-vazio">{t("vg.semTransacoes")}</p>
          ) : (
            <ul className="vg-lista">
              {recentes.map((tr, i) => {
                const st = statusPendencia(tr);
                const receita = tr.tipo === "receita";
                return (
                  <li key={tr.id} className="vg-item" style={{ animationDelay: `${200 + i * 45}ms` }}>
                    <span className={`vg-item-avatar tom-${tomDaCategoria(tr.categoria)}`}>
                      {(tr.categoria || "?").trim()[0]?.toUpperCase()}
                    </span>
                    <span className="vg-item-info">
                      <span className="vg-item-nome">{tr.categoria}</span>
                      <span className="vg-item-meta">
                        {rotuloData(tr.data)}
                        {st && <span className={`vg-tag ${st}`}>{t(`comum.${st}`)}</span>}
                      </span>
                    </span>
                    <span className={`vg-item-valor ${receita ? "receita" : ""}`}>
                      {oculto ? "•••" : `${receita ? "+" : "−"} ${formatarValor(tr.valor)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="vg-coluna">
          {/* ── Gastos por categoria ── */}
          <section className="vg-bloco luz">
            <header className="vg-bloco-cab">
              <h2>{t("vg.paraOnde")}</h2>
            </header>
            {categorias.length === 0 ? (
              <p className="vg-vazio">{t("vg.semDespesas")}</p>
            ) : (
              <ul className="vg-cats">
                {categorias.map((c, i) => (
                  <li key={c.nome}>
                    <div className="vg-cat-linha">
                      <span className="vg-cat-nome">{c.nome}</span>
                      <span className="vg-cat-valor">
                        {oculto ? "•••" : formatarValor(c.valor)}
                        <em>{Math.round((c.valor / totalCategorias) * 100)}%</em>
                      </span>
                    </div>
                    <div className="vg-cat-trilho">
                      <div
                        className="vg-cat-barra"
                        style={{
                          width: `${(c.valor / maiorCategoria) * 100}%`,
                          background: `var(--grafico-${(i % 7) + 1})`,
                          animationDelay: `${250 + i * 80}ms`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Últimos 6 meses ── */}
          <section className="vg-bloco luz">
            <header className="vg-bloco-cab">
              <h2>{t("vg.ultimos6")}</h2>
            </header>
            <GraficoBarras transacoes={transacoes} />
          </section>
        </div>
      </div>
    </div>
  );
}
