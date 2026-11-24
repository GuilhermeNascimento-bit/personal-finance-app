// Tema claro/escuro: aplica, descobre o tema efetivo e faz a transição animada.

export function temaEfetivo() {
  const attr = document.documentElement.getAttribute("data-tema");
  if (attr === "claro" || attr === "escuro") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function aplicarTema(tema) {
  if (tema === "auto") document.documentElement.removeAttribute("data-tema");
  else document.documentElement.setAttribute("data-tema", tema);
  localStorage.setItem("tema", tema);
  window.dispatchEvent(new CustomEvent("tema-mudou", { detail: tema }));
}

// Troca de tema com um "círculo de luz" que se expande a partir do clique
// (View Transitions API). Navegadores sem suporte trocam direto.
export function trocarTemaAnimado(tema, evento) {
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduzido) {
    aplicarTema(tema);
    return;
  }

  const x = evento?.clientX ?? window.innerWidth - 80;
  const y = evento?.clientY ?? 32;
  const raio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transicao = document.startViewTransition(() => aplicarTema(tema));
  transicao.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
}
