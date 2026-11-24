// EtapaRenda.jsx
import { useState } from "react";
import ListaCategoriaValor from "./ListaCategoriaValor";
import { useIdioma } from "../../i18n/IdiomaContext";


export default function EtapaRenda({ valoresIniciais, aoAvancar, aoVoltar }) {
  const { t } = useIdioma();
  const SUGESTOES = t("ob.rendaSugestoes");
  const [itens, setItens] = useState(
    valoresIniciais.length > 0 ? valoresIniciais : [{ categoria: SUGESTOES[0], valor: "" }]
  );

  function continuar() {
    const itensValidos = itens
      .filter((item) => item.categoria.trim() && Number(item.valor) > 0)
      .map((item) => ({ categoria: item.categoria.trim(), valor: Number(item.valor) }));
    aoAvancar(itensValidos);
  }

  const temAlgumValor = itens.some((item) => Number(item.valor) > 0);

  return (
    <div className="etapa">
      <h2>{t("ob.rendaTitulo")}</h2>
      <p className="texto-etapa">{t("ob.rendaTexto")}</p>

      <ListaCategoriaValor
        itens={itens}
        aoMudar={setItens}
        categoriasSugeridas={SUGESTOES}
        placeholderCategoria={t("ob.rendaPlaceholder")}
      />

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar}>
          {t("comum.voltar")}
        </button>
        <button
          type="button"
          className="botao-primario"
          onClick={continuar}
          disabled={!temAlgumValor}
        >
          {t("comum.continuar")}
        </button>
      </div>
    </div>
  );
}
