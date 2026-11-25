import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MoedaProvider } from "./context/MoedaContext";
import { IdiomaProvider, useIdioma } from "./i18n/IdiomaContext";
import PaginaLogin from "./pages/PaginaLogin";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import Dashboard from "./pages/dashboard/Dashboard";
import { escutarTransacoes } from "./firebase/transacoes";
import useLuzReativa from "./hooks/useLuzReativa";

function ConteudoApp() {
  const { usuario, carregando } = useAuth();
  const { t } = useIdioma();
  useLuzReativa();
  // uid cujas transações já foram verificadas. Enquanto o usuário logado não
  // for esse, mostramos o carregador — evita o painel (e o tutorial) piscar
  // antes de sabermos se a conta precisa de onboarding.
  const [uidVerificado, setUidVerificado] = useState(null);
  const [precisaOnboarding, setPrecisaOnboarding] = useState(false);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const uid = usuario.uid;
    return escutarTransacoes(uid, (transacoes) => {
      setPrecisaOnboarding(transacoes.length === 0);
      setUidVerificado(uid);
    });
  }, [usuario]);

  const verificandoTransacoes = !!usuario && uidVerificado !== usuario.uid;

  if (carregando || verificandoTransacoes) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cor-fundo-pagina)" }}>
        <div className="carregador" aria-label={t("comum.carregando")} />
      </div>
    );
  }

  if (!usuario) return <PaginaLogin />;

  if (precisaOnboarding && !onboardingConcluido) {
    return (
      <OnboardingWizard
        aoConcluir={() => {
          localStorage.removeItem("tutorial-completo");
          setOnboardingConcluido(true);
        }}
      />
    );
  }

  return <Dashboard />;
}

function App() {
  return (
    <IdiomaProvider>
      <MoedaProvider>
        <AuthProvider>
          <ConteudoApp />
        </AuthProvider>
      </MoedaProvider>
    </IdiomaProvider>
  );
}

export default App;
