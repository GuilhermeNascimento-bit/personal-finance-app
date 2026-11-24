import { useEffect, useRef } from "react";
import Icone from "./Icone";
import { useIdioma } from "../i18n/IdiomaContext";

// Diálogo do próprio app (substitui window.confirm / window.prompt).
// Enter confirma, Esc cancela; clicar fora também cancela.
export default function Confirmacao({
  titulo,
  texto,
  resumo,          // nó opcional (ex.: "Mercado · R$ 50,00")
  children,        // campo opcional (ex.: input de valor)
  icone = "alerta",
  perigo = false,
  rotuloConfirmar,
  desabilitado = false,
  ocupado = false,
  aoConfirmar,
  aoCancelar,
}) {
  const { t } = useIdioma();
  const confirmarRef = useRef(null);

  useEffect(() => {
    // sem campo: foca o botão principal para Enter funcionar direto
    if (!children) confirmarRef.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") aoCancelar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aoCancelar, children]);

  return (
    <div className="overlay-modal" onClick={(e) => e.target === e.currentTarget && aoCancelar()}>
      <form
        className={`modal modal-confirmacao ${perigo ? "perigo" : ""}`}
        role="alertdialog"
        aria-labelledby="confirmacao-titulo"
        onSubmit={(e) => {
          e.preventDefault();
          if (!desabilitado && !ocupado) aoConfirmar();
        }}
      >
        <div className="confirmacao-icone"><Icone nome={icone} tamanho={26} /></div>
        <h2 className="confirmacao-titulo" id="confirmacao-titulo">{titulo}</h2>
        {texto && <p className="confirmacao-texto">{texto}</p>}
        {resumo && <div className="confirmacao-resumo">{resumo}</div>}
        {children && <div className="confirmacao-campo">{children}</div>}
        <div className="confirmacao-botoes">
          <button type="button" className="botao-cancelar" onClick={aoCancelar}>
            {t("comum.cancelar")}
          </button>
          <button
            ref={confirmarRef}
            type="submit"
            className={`botao-salvar ${perigo ? "perigo" : ""}`}
            disabled={desabilitado || ocupado}
          >
            {ocupado ? t("comum.salvando") : rotuloConfirmar ?? t("comum.continuar")}
          </button>
        </div>
      </form>
    </div>
  );
}
