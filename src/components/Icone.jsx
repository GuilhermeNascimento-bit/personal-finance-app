// Ícones de linha (SVG inline, 24x24, traço 1.75) — herdam a cor do texto.
const PATHS = {
  diario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.6" />
    </>
  ),
  "visao-geral": (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.8" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.8" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.8" />
    </>
  ),
  transacoes: <path d="M7 4v16M7 4 3.5 7.5M7 4l3.5 3.5M17 20V4m0 16-3.5-3.5M17 20l3.5-3.5" />,
  lembretes: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  fluxo: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  recomendacoes: (
    <path d="M12 3.5 13.8 9a1.5 1.5 0 0 0 1 1l5.7 1.9-5.7 1.9a1.5 1.5 0 0 0-1 1L12 20.5l-1.8-5.7a1.5 1.5 0 0 0-1-1L3.5 12l5.7-1.9a1.5 1.5 0 0 0 1-1L12 3.5Z" />
  ),
  metas: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  relatorios: <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />,
  // Engrenagem de verdade (dentes sólidos), para não confundir com o sol
  configuracoes: (
    <>
      <path d="M10.3 3.2a1 1 0 0 1 1-.8h1.4a1 1 0 0 1 1 .8l.3 1.7a7.4 7.4 0 0 1 1.7 1l1.6-.6a1 1 0 0 1 1.2.4l.7 1.2a1 1 0 0 1-.2 1.3l-1.3 1.1a7.4 7.4 0 0 1 0 2l1.3 1.1a1 1 0 0 1 .2 1.3l-.7 1.2a1 1 0 0 1-1.2.4l-1.6-.6a7.4 7.4 0 0 1-1.7 1l-.3 1.7a1 1 0 0 1-1 .8h-1.4a1 1 0 0 1-1-.8l-.3-1.7a7.4 7.4 0 0 1-1.7-1l-1.6.6a1 1 0 0 1-1.2-.4l-.7-1.2a1 1 0 0 1 .2-1.3l1.3-1.1a7.4 7.4 0 0 1 0-2L4.6 8.9a1 1 0 0 1-.2-1.3l.7-1.2a1 1 0 0 1 1.2-.4l1.6.6a7.4 7.4 0 0 1 1.7-1l.3-1.4Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  auto: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </>
  ),
  pincel: (
    <>
      <path d="M14.5 4.5 19.5 9.5 11 18l-5-5 8.5-8.5Z" />
      <path d="M6 13c-2 0-3 1.5-3 3.5 0 1.3-.5 2.5-1 3 3.5.5 7-.5 7-3.5" />
    </>
  ),
  cadeado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </>
  ),
  sair: <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />,
  mais: (
    <>
      <circle cx="5.5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18.5" cy="12" r="1.2" />
    </>
  ),
  mais_sinal: <path d="M12 5v14M5 12h14" />,
  arrastar: (
    <>
      <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
    </>
  ),
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "olho-fechado": (
    <>
      <path d="M4 4l16 16M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.7 3.4M6.6 7.6C4 9.3 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.3-1" />
      <path d="M9.9 10a3 3 0 0 0 4.2 4.1" />
    </>
  ),
  receita: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  despesa: <path d="M12 5v14m0 0-6-6m6 6 6-6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  "chevron-esq": <path d="m15 6-6 6 6 6" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  lua: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  globo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  lapis: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />,
  lixeira: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  cofre: (
    <>
      <path d="M5 11a7 6 0 0 1 14 0v3a3 3 0 0 1-1.5 2.6L17 19h-3l-.4-1.2a8 8 0 0 1-3.2 0L10 19H7l-.5-2.4A3 3 0 0 1 5 14v-3Z" />
      <path d="M10 8h4M15.5 12h.01" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4M12 16.8v.2" />
    </>
  ),
  "seta-cima": <path d="M7 17 17 7M9 7h8v8" />,
  "seta-baixo": <path d="M7 7l10 10M17 9v8H9" />,
};

export default function Icone({ nome, tamanho = 18, className = "" }) {
  return (
    <svg
      className={`icone ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[nome] ?? null}
    </svg>
  );
}
