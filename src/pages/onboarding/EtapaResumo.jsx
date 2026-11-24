// EtapaResumo.jsx
// Mostra um resumo de tudo que foi informado, com totais e uma
// prévia visual simples (barra de proporção receita x despesa),
// antes de confirmar e salvar no Firestore.

import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";

export default function EtapaResumo({ dados, salvando, erro, aoConfirmar, aoVoltar }) {
  const { formatarValor } = useMoeda();
  const { t } = useIdioma();
  const totalRenda = somar(dados.renda);
  const totalFixas = somar(dados.despesasFixas);
  const totalVariaveis = somar(dados.despesasVariaveis);
  const totalDespesas = totalFixas + totalVariaveis;
  const saldo = totalRenda - totalDespesas;

  const percentualDespesa = totalRenda > 0
    ? Math.min(100, Math.round((totalDespesas / totalRenda) * 100))
    : 0;

  return (
    <div className="etapa">
      <h2>{t("ob.resumoTitulo")}</h2>
      <p className="texto-etapa">
        {t("ob.resumoTexto")}
      </p>

      <div className="resumo-cards">
        <div className="resumo-card">
          <span className="resumo-label">{t("ob.renda")}</span>
          <span className="resumo-valor resumo-positivo">{formatarValor(totalRenda)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">{t("comum.despesas")}</span>
          <span className="resumo-valor resumo-negativo">{formatarValor(totalDespesas)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">{t("ob.saldoPrevisto")}</span>
          <span className={`resumo-valor ${saldo >= 0 ? "resumo-positivo" : "resumo-negativo"}`}>
            {formatarValor(saldo)}
          </span>
        </div>
      </div>

      <div className="barra-proporcao">
        <div className="barra-proporcao-preenchida" style={{ width: `${percentualDespesa}%` }} />
      </div>
      <p className="texto-etapa texto-secundario">
        {t("ob.pctRenda", { pct: percentualDespesa })}
      </p>

      {dados.renda.length === 0 && dados.despesasFixas.length === 0 && dados.despesasVariaveis.length === 0 && (
        <p className="texto-etapa texto-secundario">
          {t("ob.semValores")}
        </p>
      )}

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar} disabled={salvando}>
          {t("comum.voltar")}
        </button>
        <button type="button" className="botao-primario" onClick={aoConfirmar} disabled={salvando}>
          {salvando ? t("comum.salvando") : t("ob.confirmar")}
        </button>
      </div>
    </div>
  );
}

function somar(itens) {
  return itens.reduce((total, item) => total + Number(item.valor || 0), 0);
}

