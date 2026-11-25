import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MoedaProvider } from "./context/MoedaContext";
import { IdiomaProvider, useIdioma } from "./i18n/IdiomaContext";
import PaginaInicio from "./pages/inicio/PaginaInicio";
import PaginaLogin from "./pages/PaginaLogin";
import TelaVerificarEmail from "./pages/TelaVerificarEmail";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import Dashboard from "./pages/dashboard/Dashboard";
import { DemoProvider } from "./demo/DemoContext";
import { escutarTransacoes } from "./firebase/transacoes";
import useLuzReativa from "./hooks/useLuzReativa";

// Rotas simples por hash: "" (apresentação) · #entrar · #criar-conta · #demo
// (o botão Voltar do navegador funciona e dá para compartilhar o link da demo)
const ROTAS_PUBLICAS = ["#entrar", "#criar-conta", "#demo"];

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const aoMudar = () => setHash(window.location.hash);
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  const ir = useCallback((novo) => {
    if (novo) window.location.hash = novo;
    else history.pushState(null, "", window.location.pathname + window.location.search);
    setHash(novo || "");
    window.scrollTo({ top: 0 });
  }, []);
  return [hash, ir];
}

function Carregando() {
  const { t } = useIdioma();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cor-fundo-pagina)" }}>
      <div className="carregador" aria-label={t("comum.carregando")} />
    </div>
  );
}

function ConteudoApp() {
  const { usuario, carregando, emDemo, iniciarDemo, encerrarDemo, precisaVerificar } = useAuth();
  const { idioma } = useIdioma();
  useLuzReativa();
  const [hash, irPara] = useHash();

  const contaReal = usuario && !usuario.demo ? usuario : null;

  // uid cujas transações já foram verificadas. Enquanto o usuário logado não
  // for esse, mostramos o carregador — evita o painel (e o tutorial) piscar
  // antes de sabermos se a conta precisa de onboarding.
  const [uidVerificado, setUidVerificado] = useState(null);
  const [precisaOnboarding, setPrecisaOnboarding] = useState(false);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);

  useEffect(() => {
    if (!contaReal || precisaVerificar) return;
    const uid = contaReal.uid;
    return escutarTransacoes(uid, (transacoes) => {
      setPrecisaOnboarding(transacoes.length === 0);
      setUidVerificado(uid);
    });
  }, [contaReal, precisaVerificar]);

  // Demo liga/desliga conforme o endereço
  useEffect(() => {
    if (contaReal) return;
    if (hash === "#demo" && !emDemo) iniciarDemo(idioma);
    if (hash !== "#demo" && emDemo) encerrarDemo();
  }, [hash, contaReal, emDemo, iniciarDemo, encerrarDemo, idioma]);

  // Logado: some com #entrar/#criar-conta/#demo do endereço
  useEffect(() => {
    if (contaReal && ROTAS_PUBLICAS.includes(hash)) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [contaReal, hash]);

  if (carregando) return <Carregando />;

  // ── Conta real ──
  if (contaReal) {
    if (precisaVerificar) return <TelaVerificarEmail aoUsarOutroEmail={() => irPara("#criar-conta")} />;
    if (uidVerificado !== contaReal.uid) return <Carregando />;
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

  // ── Visitante ──
  if (hash === "#demo") {
    if (!emDemo) return <Carregando />;
    return (
      <DemoProvider aoCriarConta={() => irPara("#criar-conta")} aoSair={() => irPara("")}>
        <Dashboard />
      </DemoProvider>
    );
  }

  if (hash === "#entrar" || hash === "#criar-conta") {
    return (
      <PaginaLogin
        modo={hash === "#criar-conta" ? "cadastrar" : "entrar"}
        aoTrocarModo={(m) => irPara(m === "cadastrar" ? "#criar-conta" : "#entrar")}
        aoVoltar={() => irPara("")}
        aoVerDemo={() => irPara("#demo")}
      />
    );
  }

  return (
    <PaginaInicio
      aoVerDemo={() => irPara("#demo")}
      aoCriarConta={() => irPara("#criar-conta")}
      aoEntrar={() => irPara("#entrar")}
    />
  );
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
