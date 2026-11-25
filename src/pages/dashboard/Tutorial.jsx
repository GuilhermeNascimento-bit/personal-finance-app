import { useState, useEffect, useCallback } from "react";
import { useIdioma } from "../../i18n/IdiomaContext";
import "./tutorial.css";

// Ordem do tour; cada id é um [data-aba] na tela (aba, sub-aba ou ícone ⚙)
const PASSOS = [
  "visao-geral", "diario", "transacoes", "lembretes", "metas",
  "relatorios", "fluxo", "recomendacoes", "configuracoes",
];

const LARGURA_CARD = 320;

const visivel = (el) =>
  el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

// Prioridade: item numa barra de navegação visível → qualquer item visível
// (ex.: sub-aba) → botão "Mais" do celular (onde ficam Metas, Relatórios, Config.)
function acharAlvo(alvo) {
  const candidatos = [...document.querySelectorAll(`[data-aba="${alvo}"]`)].filter(visivel);
  return (
    candidatos.find((el) => el.closest(".topbar, .navbar-mobile")) ||
    candidatos[0] ||
    [...document.querySelectorAll('[data-aba="mais"]')].find(visivel) ||
    null
  );
}

export default function Tutorial({ aoFechar, onNavegar, demo = false, aoCriarConta }) {
  const { t } = useIdioma();
  const [passo, setPasso] = useState(0);
  const [rect, setRect] = useState(null);

  // Na demo: 1º passo explica os dados de exemplo e um passo final convida a criar conta
  const passos = demo ? [...PASSOS, "fim-demo"] : PASSOS;
  const alvo = passos[passo];
  const fimDemo = alvo === "fim-demo";
  let [titulo, descricao] = fimDemo ? [t("demo.tourFimTitulo"), t("demo.tourFimTexto")] : t(`tutorial.passos.${alvo}`);
  if (demo && passo === 0) [titulo, descricao] = [t("demo.tourIntroTitulo"), t("demo.tourIntroTexto")];

  const medir = useCallback(() => {
    const el = alvo === "fim-demo" ? null : acharAlvo(alvo);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [alvo]);

  // Navega primeiro (sub-abas só existem depois), depois mede o alvo
  useEffect(() => {
    if (alvo !== "fim-demo") onNavegar?.(alvo);
    const t1 = setTimeout(medir, 80);
    const t2 = setTimeout(medir, 420); // de novo após animações de layout
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", medir);
    };
  }, [alvo, medir, onNavegar]);

  const avancar = useCallback(() => {
    if (passo < passos.length - 1) setPasso((p) => p + 1);
    else aoFechar();
  }, [passo, passos.length, aoFechar]);

  const voltar = useCallback(() => {
    if (passo > 0) setPasso((p) => p - 1);
  }, [passo]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight") avancar();
      if (e.key === "ArrowLeft") voltar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aoFechar, avancar, voltar]);

  // Card abaixo do alvo, centralizado nele e preso dentro da tela
  let cardStyle;
  if (rect) {
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - LARGURA_CARD / 2, window.innerWidth - LARGURA_CARD - 16));
    const abaixo = rect.bottom + 18;
    const top = abaixo + 240 < window.innerHeight ? abaixo : Math.max(16, rect.top - 258);
    cardStyle = { top, left };
  } else {
    cardStyle = { top: "50%", marginTop: -120, left: Math.max(16, (window.innerWidth - LARGURA_CARD) / 2) };
  }

  const ultimo = passo === passos.length - 1;

  return (
    <div className="tutorial-overlay">
      {!rect && <div className="tutorial-fundo" />}
      {rect && (
        <div
          className="tutorial-spotlight"
          style={(() => {
            // folga ao redor do alvo, sem passar das bordas da tela
            const top = Math.max(4, rect.top - 6);
            const left = Math.max(4, rect.left - 8);
            const right = Math.min(window.innerWidth - 4, rect.right + 8);
            const bottom = Math.min(window.innerHeight - 4, rect.bottom + 6);
            return { top, left, width: right - left, height: bottom - top };
          })()}
        />
      )}

      <div className="tutorial-card" style={cardStyle} key={passo}>
        <div className="tutorial-barra-prog">
          {passos.map((_, i) => (
            <div
              key={i}
              className={`tutorial-seg ${i < passo ? "feito" : i === passo ? "ativo" : ""}`}
              onClick={() => setPasso(i)}
            />
          ))}
        </div>

        <p className="tutorial-contador">{t("tutorial.de", { atual: passo + 1, total: passos.length })}</p>
        <h3 className="tutorial-titulo">{titulo}</h3>
        <p className="tutorial-descricao">{descricao}</p>

        {fimDemo ? (
          <div className="tutorial-rodape tutorial-fim-demo">
            <button className="tutorial-pular" onClick={aoFechar}>{t("demo.tourFimExplorar")}</button>
            <button className="tutorial-btn-avancar" onClick={aoCriarConta}>{t("demo.criarConta")}</button>
          </div>
        ) : (
        <div className="tutorial-rodape">
          <button className="tutorial-pular" onClick={aoFechar}>{t("tutorial.pular")}</button>
          <div className="tutorial-nav">
            {passo > 0 && (
              <button className="tutorial-btn-voltar" onClick={voltar}>{t("tutorial.anterior")}</button>
            )}
            <button className="tutorial-btn-avancar" onClick={avancar}>
              {ultimo ? t("tutorial.concluir") : t("tutorial.proximo")}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
