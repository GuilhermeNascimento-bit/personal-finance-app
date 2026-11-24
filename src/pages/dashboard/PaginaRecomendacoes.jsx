import { useState } from "react";
import { calcularRelatorio } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";
import "./recomendacoes.css";
import { useIdioma } from "../../i18n/IdiomaContext";

function gerarDicas(relatorio, transacoes, fmt, t) {
  const { totalReceitas, totalDespesasPagas, saldoReal, despesas } = relatorio;
  const dicas = [];

  const porCategoria = {};
  despesas.forEach((d) => {
    porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
  });

  const percentualGasto = totalReceitas > 0
    ? (totalDespesasPagas / totalReceitas) * 100 : 0;

  if (percentualGasto > 80) {
    dicas.push({
      tipo: "alerta",
      titulo: t("rec.altosTitulo"),
      texto: t("rec.altosTexto", { pct: percentualGasto.toFixed(0) }),
      reducao: null,
    });
  } else if (percentualGasto > 60) {
    dicas.push({
      tipo: "atencao",
      titulo: t("rec.elevadosTitulo"),
      texto: t("rec.elevadosTexto", { pct: percentualGasto.toFixed(0) }),
      reducao: null,
    });
  } else {
    dicas.push({
      tipo: "positivo",
      titulo: t("rec.controleTitulo"),
      texto: t("rec.controleTexto", { pct: percentualGasto.toFixed(0) }),
      reducao: null,
    });
  }

  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  if (categorias.length > 0 && totalReceitas > 0) {
    const [nomeCat, valorCat] = categorias[0];
    const pct = (valorCat / totalReceitas) * 100;
    const limites = {
      aluguel: 30, moradia: 30,
      comida: 15, alimentação: 15, alimentacao: 15,
      transporte: 15,
      lazer: 10, entretenimento: 10,
      streaming: 5, assinaturas: 5,
      rent: 30, housing: 30, food: 15, groceries: 15,
      transport: 15, leisure: 10, entertainment: 10, subscriptions: 5,
    };
    const limite = limites[nomeCat.toLowerCase()] || 20;
    if (pct > limite) {
      const reducaoIdeal = valorCat - (totalReceitas * limite / 100);
      dicas.push({
        tipo: "alerta",
        titulo: t("rec.categoriaTitulo", { cat: nomeCat }),
        texto: t("rec.categoriaTexto", { valor: fmt(valorCat), cat: nomeCat, pct: pct.toFixed(0), limite, reducao: fmt(reducaoIdeal) }),
        reducao: reducaoIdeal,
        categoria: nomeCat,
      });
    }
  }

  if (saldoReal < totalDespesasPagas * 3) {
    const meta3meses = totalDespesasPagas * 3;
    dicas.push({
      tipo: "atencao",
      titulo: t("rec.reservaTitulo"),
      texto: t("rec.reservaTexto", { meta: fmt(meta3meses), mensal: fmt(totalDespesasPagas * 0.1) }),
      reducao: null,
    });
  }

  if (saldoReal > totalReceitas * 0.2) {
    dicas.push({
      tipo: "positivo",
      titulo: t("rec.investirTitulo"),
      texto: t("rec.investirTexto", { saldo: fmt(saldoReal) }),
      reducao: null,
    });
  }

  const atrasadas = transacoes.filter((x) => {
    if (x.tipo !== "despesa" || x.status !== "pendente") return false;
    const d = new Date(x.data);
    d.setHours(0, 0, 0, 0);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return d < hoje;
  });
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((s, x) => s + x.valor, 0);
    dicas.push({
      tipo: "alerta",
      titulo: t("rec.atrasadasTitulo", { n: atrasadas.length }),
      texto: t("rec.atrasadasTexto", { valor: fmt(totalAtrasado) }),
      reducao: null,
    });
  }

  return dicas;
}

function CardDica({ dica, indice }) {
  const { formatarValor: fmt } = useMoeda();
  const { t } = useIdioma();
  const icones = { alerta: "⚠️", atencao: "💡", positivo: "✅" };
  return (
    <div className={`card-dica luz card-dica-${dica.tipo}`}
      style={{ animationDelay: `${indice * 0.08}s` }}>
      <div className="dica-topo">
        <span className="dica-icone">{icones[dica.tipo]}</span>
        <h4 className="dica-titulo">{dica.titulo}</h4>
      </div>
      <p className="dica-texto">{dica.texto}</p>
      {dica.reducao && (
        <div className="dica-reducao">
          <span>{t("rec.reducao")}</span>
          <strong>{t("metas.porMes", { valor: fmt(dica.reducao) })}</strong>
        </div>
      )}
    </div>
  );
}

function AnaliseIA() {
  const { t } = useIdioma();
  return (
    <div className="secao-ia">
      <div className="ia-cabecalho">
        <div>
          <h3 className="titulo-secao">{t("rec.iaTitulo")}</h3>
          <p className="subtitulo-secao">
            {t("rec.iaSub")}
          </p>
        </div>
      </div>
      <div className="ia-resultado">
        <p className="ia-erro" style={{ background: "var(--cor-acento-fundo-suave)", color: "var(--cor-acento)", borderRadius: 8, padding: "12px 14px" }}>
          ✦ {t("rec.iaEmBreve")}
        </p>
      </div>
    </div>
  );
}

export default function PaginaRecomendacoes({ transacoes }) {
  const { formatarValor: fmt } = useMoeda();
  const { t } = useIdioma();
  const relatorio = calcularRelatorio(transacoes);
  const dicas = gerarDicas(relatorio, transacoes, fmt, t);

  return (
    <div className="pagina-recomendacoes">
      <section className="secao-dicas">
        <h3 className="titulo-secao">{t("rec.diagnostico")}</h3>
        <p className="subtitulo-secao">
          {t("rec.diagnosticoSub")}
        </p>
        <div className="grade-dicas">
          {dicas.map((dica, i) => (
            <CardDica key={i} dica={dica} indice={i} />
          ))}
        </div>
      </section>

      <AnaliseIA relatorio={relatorio} transacoes={transacoes} />
    </div>
  );
}
