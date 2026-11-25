import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { jsPDF } from "jspdf";
import { calcularRelatorio } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";
import { useDemo } from "../../demo/DemoContext";
import "./relatorios.css";
import { useIdioma } from "../../i18n/IdiomaContext";

const PERIODOS = [
  { chave: "rel.periodo1", meses: 1 },
  { chave: "rel.periodo3", meses: 3 },
  { chave: "rel.periodo6", meses: 6 },
  { chave: "rel.periodo12", meses: 12 },
];

function filtrarPorPeriodo(transacoes, meses) {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  inicio.setMonth(inicio.getMonth() - meses + 1);
  return transacoes.filter((t) => new Date(t.data) >= inicio);
}

function gerarEvolucao(transacoes, meses, locale) {
  const agora = new Date();
  return Array.from({ length: meses }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1 - i), 1);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const label = d.toLocaleDateString(locale, {
      month: "short",
      ...(meses > 6 ? { year: "2-digit" } : {}),
    });
    const doMes = transacoes.filter((t) => {
      const td = new Date(t.data);
      return td.getMonth() === mes && td.getFullYear() === ano;
    });
    const receitas = doMes
      .filter((t) => t.tipo === "receita")
      .reduce((s, t) => s + t.valor, 0);
    const despesas = doMes
      .filter((t) => t.tipo === "despesa" && t.status === "pago")
      .reduce((s, t) => s + t.valor, 0);
    return { label, receitas, despesas, saldo: receitas - despesas };
  });
}

// ── Geração do PDF ────────────────────────────────────────────────────────────

const CORES_PDF = [
  [29, 158, 117], [216, 90, 48], [127, 119, 221],
  [186, 117, 23], [224, 92, 138], [91, 163, 201], [136, 135, 128],
];

async function gerarPDF({ periodoLabel, relatorio, evolucao, porCategoria, fmt, t, locale }) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const cw = W - margin * 2;
  let y = 0;

  // Header
  pdf.setFillColor(29, 158, 117);
  pdf.rect(0, 0, W, 34, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(t("rel.pdfTitulo"), margin, 15);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(
    t("rel.pdfSub", { periodo: periodoLabel, data: new Date().toLocaleDateString(locale) }),
    margin, 26
  );
  y = 46;

  // Resumo — 4 cards em grade 2x2
  const cardW = (cw - 8) / 2;
  const cardH = 23;
  const summaryItems = [
    { label: t("comum.receitas"), valor: relatorio.totalReceitas, cor: [15, 110, 86] },
    { label: t("rel.despesasPagas"), valor: relatorio.totalDespesasPagas, cor: [180, 60, 20] },
    {
      label: t("rel.saldoPeriodo"),
      valor: relatorio.saldoReal,
      cor: relatorio.saldoReal >= 0 ? [15, 110, 86] : [180, 60, 20],
    },
    { label: t("rel.pendente"), valor: relatorio.totalPendenteFuturo, cor: [90, 90, 90] },
  ];

  summaryItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * (cardW + 8);
    const cy = y + row * (cardH + 6);
    pdf.setFillColor(245, 247, 244);
    pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 110, 100);
    pdf.text(item.label.toUpperCase(), cx + 8, cy + 9);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...item.cor);
    pdf.text(fmt(item.valor), cx + 8, cy + 18);
  });

  y += 2 * (cardH + 6) + 12;

  // Evolução mensal — tabela
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30, 40, 30);
  pdf.text(t("rel.evolucao"), margin, y);
  y += 8;

  const colW = [30, (cw - 30) / 3, (cw - 30) / 3, (cw - 30) / 3];
  const headers = [t("rel.mes"), t("comum.receitas"), t("comum.despesas"), t("rel.saldo")];

  pdf.setFillColor(29, 158, 117);
  pdf.rect(margin, y, cw, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  let cx = margin;
  headers.forEach((h, i) => { pdf.text(h, cx + 3, y + 5.5); cx += colW[i]; });
  y += 8;

  evolucao.forEach((row, ri) => {
    if (y > H - 30) { pdf.addPage(); y = 20; }
    pdf.setFillColor(ri % 2 === 0 ? 250 : 244, ri % 2 === 0 ? 252 : 246, ri % 2 === 0 ? 250 : 244);
    pdf.rect(margin, y, cw, 7, "F");
    pdf.setFontSize(9);
    cx = margin;
    [
      { texto: row.label, cor: [40, 50, 40] },
      { texto: fmt(row.receitas), cor: [15, 110, 86] },
      { texto: fmt(row.despesas), cor: [180, 60, 20] },
      { texto: fmt(row.saldo), cor: row.saldo >= 0 ? [15, 110, 86] : [180, 60, 20] },
    ].forEach((cell, i) => {
      pdf.setFont("helvetica", i === 0 ? "normal" : "bold");
      pdf.setTextColor(...cell.cor);
      pdf.text(cell.texto, cx + 3, y + 5);
      cx += colW[i];
    });
    y += 7;
  });

  y += 12;

  // Gastos por categoria — barras desenhadas
  if (porCategoria.length > 0) {
    if (y > H - 60) { pdf.addPage(); y = 20; }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(30, 40, 30);
    pdf.text(t("rel.porCategoria"), margin, y);
    y += 8;

    const totalDespesas = porCategoria.reduce((s, c) => s + c.valor, 0) || 1;
    const barMaxW = cw - 70;

    porCategoria.forEach((cat, i) => {
      if (y > H - 20) { pdf.addPage(); y = 20; }
      const cor = CORES_PDF[i % CORES_PDF.length];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(40, 50, 40);
      // trunca nome longo
      const nome = cat.categoria.length > 20 ? cat.categoria.slice(0, 19) + "…" : cat.categoria;
      pdf.text(nome, margin, y + 4.5);

      // barra fundo
      pdf.setFillColor(220, 225, 218);
      pdf.roundedRect(margin + 52, y, barMaxW, 5, 1, 1, "F");

      // barra progresso
      const barW = Math.max(2, (cat.valor / porCategoria[0].valor) * barMaxW);
      pdf.setFillColor(...cor);
      pdf.roundedRect(margin + 52, y, barW, 5, 1, 1, "F");

      // valor
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...cor);
      pdf.text(
        `${fmt(cat.valor)} · ${((cat.valor / totalDespesas) * 100).toFixed(0)}%`,
        margin + 52 + barMaxW + 3,
        y + 4.5
      );

      y += 10;
    });
  }

  // Rodapé em todas as páginas
  const totalPages = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(160, 165, 158);
    pdf.text(t("rel.pdfRodape", { p, total: totalPages }), margin, H - 8);
  }

  const dataHoje = new Date().toISOString().slice(0, 10);
  pdf.save(`${t("rel.pdfArquivo")}-${periodoLabel.toLowerCase().replace(/\s/g, "-")}-${dataHoje}.pdf`);
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PaginaRelatorios({ transacoes }) {
  const { formatarValor, moeda } = useMoeda();
  const { t, locale } = useIdioma();
  const { emDemo, pedirConta } = useDemo();
  const fmt = formatarValor;
  const [periodoIdx, setPeriodoIdx] = useState(1);
  const [exportando, setExportando] = useState(false);
  const periodo = PERIODOS[periodoIdx];

  const filtradas = useMemo(
    () => filtrarPorPeriodo(transacoes, periodo.meses),
    [transacoes, periodo.meses]
  );
  const relatorio = useMemo(() => calcularRelatorio(filtradas), [filtradas]);
  const evolucao = useMemo(
    () => gerarEvolucao(transacoes, periodo.meses, locale),
    [transacoes, periodo.meses, locale]
  );
  const porCategoria = useMemo(() => {
    const map = {};
    filtradas
      .filter((t) => t.tipo === "despesa" && t.status === "pago")
      .forEach((t) => { map[t.categoria] = (map[t.categoria] || 0) + t.valor; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, valor]) => ({ categoria, valor }));
  }, [filtradas]);

  const maxCat = porCategoria[0]?.valor || 1;

  async function handleExportar() {
    setExportando(true);
    try {
      await gerarPDF({
        periodoLabel: t(periodo.chave),
        relatorio,
        evolucao,
        porCategoria,
        fmt,
        t,
        locale,
      });
    } finally {
      setExportando(false);
    }
  }

  const cards = [
    { label: t("comum.receitas"), valor: relatorio.totalReceitas, cls: "positivo" },
    { label: t("rel.despesasPagas"), valor: relatorio.totalDespesasPagas, cls: "negativo" },
    {
      label: t("rel.saldoPeriodo"),
      valor: relatorio.saldoReal,
      cls: relatorio.saldoReal >= 0 ? "positivo" : "negativo",
    },
    { label: t("rel.pendente"), valor: relatorio.totalPendenteFuturo, cls: "neutro" },
  ];

  return (
    <div className="pagina-relatorios">
      <div className="cabecalho-relatorios">
        <div className="filtro-periodo">
          {PERIODOS.map((p, i) => (
            <button
              key={i}
              className={`btn-periodo ${periodoIdx === i ? "ativo" : ""}`}
              onClick={() => setPeriodoIdx(i)}
            >
              {t(p.chave)}
            </button>
          ))}
        </div>
        <button
          className="btn-exportar-pdf"
          onClick={() => (emDemo ? pedirConta("pdf") : handleExportar())}
          disabled={exportando}
        >
          {exportando ? t("rel.gerando") : `↓ ${t("rel.exportar")}`}
        </button>
      </div>

      <div className="grade-resumo-relatorio">
        {cards.map((c, i) => (
          <div key={i} className="card-relatorio luz" style={{ animationDelay: `${i * 0.06}s` }}>
            <p className="card-rel-label">{c.label}</p>
            <p className={`card-rel-valor ${c.cls}`}>{fmt(c.valor)}</p>
          </div>
        ))}
      </div>

      <div className="cartao-relatorio luz">
        <h3 className="titulo-relatorio">{t("rel.evolucao")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={evolucao} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--cor-texto-secundario)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--cor-texto-secundario)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v === 0 ? `${moeda.simbolo}0` : `${moeda.simbolo}${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip
              formatter={(v, name) => [fmt(v), name]}
              contentStyle={{
                background: "var(--cor-fundo-cartao)",
                border: "1px solid var(--cor-borda-cartao)",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--cor-texto-principal)", fontWeight: 600 }}
            />
            <Line type="monotone" dataKey="receitas" name={t("comum.receitas")} stroke="var(--grafico-receita)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={1200} />
            <Line type="monotone" dataKey="despesas" name={t("comum.despesas")} stroke="var(--grafico-despesa)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={1200} animationBegin={150} />
            <Line type="monotone" dataKey="saldo" name={t("rel.saldo")} stroke="var(--grafico-3)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} strokeDasharray="4 3" animationDuration={1200} animationBegin={300} />
          </LineChart>
        </ResponsiveContainer>
        <div className="legenda-grafico">
          {[
            { cor: "var(--grafico-receita)", nome: t("comum.receitas") },
            { cor: "var(--grafico-despesa)", nome: t("comum.despesas") },
            { cor: "var(--grafico-3)", nome: t("rel.saldo") },
          ].map((l) => (
            <div key={l.nome} className="legenda-item">
              <div className="legenda-cor" style={{ background: l.cor }} />
              {l.nome}
            </div>
          ))}
        </div>
      </div>

      <div className="cartao-relatorio luz">
        <h3 className="titulo-relatorio">{t("rel.porCategoria")}</h3>
        {porCategoria.length === 0 ? (
          <p className="relatorio-vazio">{t("rel.vazio")}</p>
        ) : (
          <div className="lista-categorias">
            {porCategoria.map((item, i) => (
              <div key={i} className="item-categoria">
                <div className="cat-topo">
                  <span className="cat-nome">{item.categoria}</span>
                  <span className="cat-valor">{fmt(item.valor)}</span>
                </div>
                <div className="barra-cat-fundo">
                  <div
                    className="barra-cat-progresso"
                    style={{ width: `${(item.valor / maxCat) * 100}%`, animationDelay: `${i * 70}ms` }}
                  />
                </div>
                <span className="cat-pct">
                  {relatorio.totalDespesasPagas > 0
                    ? t("rel.pctDespesas", { pct: ((item.valor / relatorio.totalDespesasPagas) * 100).toFixed(0) })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
