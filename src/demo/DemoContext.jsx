import { createContext, useContext, useState, useCallback } from "react";
import Confirmacao from "../components/Confirmacao";
import { useIdioma } from "../i18n/IdiomaContext";

// Contexto da demonstração: saber se estamos na demo e "pedir conta"
// quando a pessoa tenta algo que só existe com conta (abre um convite).
const DemoContext = createContext({
  emDemo: false,
  pedirConta: () => {},
  criarConta: () => {},
  sairDemo: () => {},
});

export function DemoProvider({ children, aoCriarConta, aoSair }) {
  const { t } = useIdioma();
  const [motivo, setMotivo] = useState(null);

  const pedirConta = useCallback((m = "geral") => setMotivo(m), []);

  const valor = {
    emDemo: true,
    pedirConta,
    criarConta: aoCriarConta,
    sairDemo: aoSair,
  };

  return (
    <DemoContext.Provider value={valor}>
      {children}
      {motivo && (
        <Confirmacao
          icone="cadeado"
          titulo={t("demo.bloqueioTitulo")}
          texto={t(`demo.motivo.${motivo}`)}
          rotuloConfirmar={t("demo.criarConta")}
          aoConfirmar={() => { setMotivo(null); aoCriarConta(); }}
          aoCancelar={() => setMotivo(null)}
        />
      )}
    </DemoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo() {
  return useContext(DemoContext);
}
