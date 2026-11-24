import { useEffect, useRef, useState } from "react";

// Anima um número do valor anterior até o novo (ease-out), para saldos "contarem".
export default function useContagem(alvo, duracao = 900) {
  const [valor, setValor] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const de = anterior.current;
    anterior.current = alvo;
    if (reduzido || de === alvo) {
      setValor(alvo);
      return;
    }

    let raf;
    const inicio = performance.now();
    function passo(agora) {
      const p = Math.min(1, (agora - inicio) / duracao);
      const e = 1 - Math.pow(1 - p, 4);
      setValor(de + (alvo - de) * e);
      if (p < 1) raf = requestAnimationFrame(passo);
    }
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracao]);

  return valor;
}
