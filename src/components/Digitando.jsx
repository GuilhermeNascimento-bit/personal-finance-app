import { useEffect, useState } from "react";

// Texto que se "escreve" letra por letra, com cursor piscando.
// - O resto do texto fica reservado (invisível) → o layout não pula.
// - Leitores de tela recebem o texto inteiro de uma vez (aria-label).
// - Quem prefere menos movimento vê o texto pronto.
const reduzido = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Digitando({ texto = "", velocidade = 27, atraso = 120, className = "" }) {
  const [n, setN] = useState(() => (reduzido() ? texto.length : 0));
  const [anterior, setAnterior] = useState(texto);

  // Texto mudou (ex.: troca de idioma ou de pergunta) → recomeça
  if (anterior !== texto) {
    setAnterior(texto);
    setN(reduzido() ? texto.length : 0);
  }

  useEffect(() => {
    if (n >= texto.length) return;
    // pausa um pouco mais depois de pontuação, como alguém digitando
    const ch = texto[n - 1];
    const pausa = n === 0 ? atraso : /[,.!?]/.test(ch) ? velocidade * 4 : velocidade;
    const id = setTimeout(() => setN((x) => x + 1), pausa);
    return () => clearTimeout(id);
  }, [n, texto, velocidade, atraso]);

  const terminou = n >= texto.length;

  return (
    <span className={`digitando ${terminou ? "terminou" : ""} ${className}`} aria-label={texto} role="text">
      <span aria-hidden="true">
        {texto.slice(0, Math.max(0, n - 1))}
        {n > 0 && <span className="digitando-letra" key={n}>{texto[n - 1]}</span>}
        <span className="digitando-cursor" />
        <span className="digitando-resto">{texto.slice(n)}</span>
      </span>
    </span>
  );
}
