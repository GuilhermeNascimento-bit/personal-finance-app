import { useId } from "react";

// Marca do app: quadrado arredondado na cor de destaque com três barras
// subindo (crescimento) e uma faísca. As barras crescem no hover (logo.css).
export default function Logo({ tamanho = 32, className = "" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`logo ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--cor-acento) 70%, #fff)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--cor-acento) 70%, #000)" }} />
        </linearGradient>
        <linearGradient id={`brilho-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${id}`}>
          <rect width="32" height="32" rx="10" />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${id})`}>
        <rect width="32" height="32" fill={`url(#lg-${id})`} />
        <rect className="logo-barra b1" x="7.5" y="17" width="4.5" height="8" rx="2.25" fill="#fff" fillOpacity="0.7" />
        <rect className="logo-barra b2" x="13.75" y="12.5" width="4.5" height="12.5" rx="2.25" fill="#fff" fillOpacity="0.85" />
        <rect className="logo-barra b3" x="20" y="8" width="4.5" height="17" rx="2.25" fill="#fff" />
        <path className="logo-faisca" d="M9.5 6.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" fill="#fff" />
        <rect className="logo-reflexo" x="-20" y="-4" width="12" height="40" fill={`url(#brilho-${id})`} transform="rotate(20)" />
      </g>
    </svg>
  );
}
