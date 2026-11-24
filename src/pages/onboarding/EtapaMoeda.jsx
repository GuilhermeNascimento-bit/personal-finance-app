import { useState } from "react";
import { MOEDAS } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";

export default function EtapaMoeda({ moedaInicial, aoAvancar, aoVoltar }) {
  const [selecionada, setSelecionada] = useState(moedaInicial || "BRL");
  const { t } = useIdioma();

  function confirmar() {
    aoAvancar(selecionada);
  }

  return (
    <div className="etapa">
      <h2>{t("ob.moedaTitulo")}</h2>
      <p className="texto-etapa">
        {t("ob.moedaTexto")}
      </p>

      <div className="grade-moeda-onboarding">
        {MOEDAS.map((m) => (
          <button
            key={m.codigo}
            type="button"
            className={`card-moeda-onboarding ${selecionada === m.codigo ? "ativo" : ""}`}
            onClick={() => setSelecionada(m.codigo)}
          >
            <span className="moeda-ob-bandeira">{m.bandeira}</span>
            <span className="moeda-ob-simbolo">{m.simbolo}</span>
            <span className="moeda-ob-nome">{t(`config.moeda_${m.codigo}`)}</span>
          </button>
        ))}
      </div>

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar}>
          {t("comum.voltar")}
        </button>
        <button type="button" className="botao-primario" onClick={confirmar}>
          {t("comum.continuar")}
        </button>
      </div>
    </div>
  );
}
