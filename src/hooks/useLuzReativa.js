import { useEffect } from "react";

// Iluminação reativa — otimizada:
//   • orbe que segue o cursor: movido direto via transform (sem variável em <html>,
//     que recalcularia o estilo da página inteira), com suavização rápida (lerp)
//   • elementos .luz: spotlight (--mx/--my) só nos que estão perto do cursor
//   • elementos .inclinar: leve inclinação 3D (--rx/--ry)
// Todas as leituras (getBoundingClientRect) acontecem antes de qualquer escrita,
// evitando "layout thrashing". As variáveis são registradas com inherits:false
// (efeitos.css), então mudar uma não recalcula os filhos.

const SUAVIZACAO = 0.32;   // 0–1: quanto o orbe anda em direção ao cursor por frame
const ALCANCE = 140;       // px fora do elemento em que a luz já começa a acender

export default function useLuzReativa() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let px = -9999, py = -9999;          // cursor
    let ox = null, oy = null;            // orbe (posição suavizada)
    let raf = 0;
    const ligados = new Set();           // .luz atualmente acesos

    function quadro() {
      raf = 0;

      // ── orbe do cursor ──
      const orbes = document.querySelectorAll(".orbe-cursor");
      if (orbes.length && px > -9000) {
        if (ox === null) { ox = px; oy = py; }
        ox += (px - ox) * SUAVIZACAO;
        oy += (py - oy) * SUAVIZACAO;
        const tr = `translate3d(${ox - 210}px, ${oy - 210}px, 0)`;
        orbes.forEach((o) => { o.style.transform = tr; o.style.opacity = "var(--orbe-opacidade)"; });
      }

      // ── leituras ──
      const luzes = document.querySelectorAll(".luz");
      const inclinaveis = document.querySelectorAll(".inclinar");
      const medidasLuz = [];
      for (const el of luzes) {
        const r = el.getBoundingClientRect();
        const perto = px > r.left - ALCANCE && px < r.right + ALCANCE &&
                      py > r.top - ALCANCE && py < r.bottom + ALCANCE;
        if (perto || ligados.has(el)) medidasLuz.push([el, r, perto]);
      }
      const medidasIncl = [];
      for (const el of inclinaveis) medidasIncl.push([el, el.getBoundingClientRect()]);

      // ── escritas ──
      for (const [el, r, perto] of medidasLuz) {
        if (perto) {
          el.style.setProperty("--mx", `${px - r.left}px`);
          el.style.setProperty("--my", `${py - r.top}px`);
          if (!ligados.has(el)) { el.style.setProperty("--luz-on", "1"); ligados.add(el); }
        } else {
          el.style.setProperty("--luz-on", "0");
          ligados.delete(el);
        }
      }
      for (const [el, r] of medidasIncl) {
        const x = px - r.left, y = py - r.top;
        const dentro = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
        el.style.setProperty("--rx", `${dentro ? ((y / r.height) - 0.5) * -4 : 0}deg`);
        el.style.setProperty("--ry", `${dentro ? ((x / r.width) - 0.5) * 5 : 0}deg`);
      }

      // continua animando só enquanto o orbe ainda não alcançou o cursor
      if (ox !== null && (Math.abs(px - ox) > 0.5 || Math.abs(py - oy) > 0.5)) agendar();
    }

    function agendar() {
      if (!raf) raf = requestAnimationFrame(quadro);
    }

    function aoMover(e) {
      px = e.clientX;
      py = e.clientY;
      agendar();
    }

    function aoSair() {
      px = -9999;
      py = -9999;
      document.querySelectorAll(".orbe-cursor").forEach((o) => { o.style.opacity = "0"; });
      agendar();
    }

    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("scroll", agendar, { passive: true });
    document.documentElement.addEventListener("pointerleave", aoSair);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("scroll", agendar);
      document.documentElement.removeEventListener("pointerleave", aoSair);
    };
  }, []);
}
