import { useState, useEffect, useCallback } from "react";
import { useIdioma } from "../../i18n/IdiomaContext";
import "./tutorial.css";

// Ordem do tour; cada id é um [data-aba] na tela (aba, sub-aba ou ícone ⚙)
const PASSOS = [
  "visao-geral", "diario", "transacoes", "lembretes", "metas",
  "relatorios", "fluxo", "recomendacoes", "configuracoes",
];

const LARGURA_CARD = 320;

export default function Tutorial({ aoFechar, onNavegar }) {
  const { t } = useIdioma();
  const [passo, setPasso] = useState(0);
  const [rect, setRect] = useState(null);

  const alvo = PASSOS[passo];
  const [titulo, descricao] = t(`tutorial.passos.${alvo}`);

  const medir = useCallback(() => {
    const el = document.querySelector(`[data-aba="${alvo}"]`);
    setRect(el && el.offsetParent !== null ? el.getBoundingClientRect() : null);
  }, [alvo]);

  // Navega primeiro (sub-abas só existem depois), depois mede o alvo
  useEffect(() => {
    onNavegar?.(alvo);
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
    if (passo < PASSOS.length - 1) setPasso((p) => p + 1);
    else aoFechar();
  }, [passo, aoFechar]);

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
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  const ultimo = passo === PASSOS.length - 1;

  return (
    <div className="tutorial-overlay">
      {rect && (
        <div
          className="tutorial-spotlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 12,
          }}
        />
      )}

      <div className="tutorial-card" style={cardStyle} key={passo}>
        <div className="tutorial-barra-prog">
          {PASSOS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-seg ${i < passo ? "feito" : i === passo ? "ativo" : ""}`}
              onClick={() => setPasso(i)}
            />
          ))}
        </div>

        <p className="tutorial-contador">{t("tutorial.de", { atual: passo + 1, total: PASSOS.length })}</p>
        <h3 className="tutorial-titulo">{titulo}</h3>
        <p className="tutorial-descricao">{descricao}</p>

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
      </div>
    </div>
  );
}
