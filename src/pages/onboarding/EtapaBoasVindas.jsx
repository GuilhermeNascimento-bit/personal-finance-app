// EtapaBoasVindas.jsx
import { useIdioma } from "../../i18n/IdiomaContext";
import Logo from "../../components/Logo";
import Digitando from "../../components/Digitando";

export default function EtapaBoasVindas({ nome, aoAvancar }) {
  const { t } = useIdioma();
  return (
    <div className="etapa">
      <div className="logo-boas-vindas"><Logo tamanho={72} /></div>
      <h2><Digitando texto={nome ? t("ob.bemVindoNome", { nome: nome.split(" ")[0] }) : t("ob.bemVindo")} atraso={600} /></h2>
      <p className="texto-etapa">
        {t("ob.intro")}
      </p>
      <p className="texto-etapa texto-secundario">
        {t("ob.intro2")}
      </p>
      <button type="button" className="botao-primario" onClick={aoAvancar}>
        {t("ob.comecar")}
      </button>
    </div>
  );
}
