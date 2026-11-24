import { useContext, useEffect, useState, useCallback } from "react";
import { IdiomaContext } from "./contexto";
import pt from "./pt";
import en from "./en";

// eslint-disable-next-line react-refresh/only-export-components
export const IDIOMAS = [
  { codigo: "pt", nome: "Português", locale: "pt-BR", bandeira: "🇧🇷" },
  { codigo: "en", nome: "English", locale: "en-US", bandeira: "🇺🇸" },
];

const DICIONARIOS = { pt, en };

function idiomaInicial() {
  const salvo = localStorage.getItem("idioma");
  if (salvo && DICIONARIOS[salvo]) return salvo;
  return (navigator.language || "pt").toLowerCase().startsWith("pt") ? "pt" : "en";
}

function buscar(dic, chave) {
  return chave.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dic);
}


export function IdiomaProvider({ children }) {
  const [idioma, setIdiomaState] = useState(idiomaInicial);
  const info = IDIOMAS.find((i) => i.codigo === idioma) || IDIOMAS[0];

  useEffect(() => {
    document.documentElement.lang = info.locale;
  }, [info.locale]);

  const setIdioma = useCallback((codigo) => {
    localStorage.setItem("idioma", codigo);
    setIdiomaState(codigo);
  }, []);

  // t("chave.sub", { nome: "Ana" }) → texto com {nome} substituído.
  // Se o valor for função, chama com as variáveis (útil para plurais).
  const t = useCallback(
    (chave, vars = {}) => {
      let v = buscar(DICIONARIOS[idioma], chave);
      if (v === undefined) v = buscar(pt, chave);
      if (v === undefined) return chave;
      if (typeof v === "function") return v(vars);
      if (typeof v !== "string") return v;
      return v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
    },
    [idioma]
  );

  const formatarData = useCallback(
    (data, opcoes) => new Date(data).toLocaleDateString(info.locale, opcoes),
    [info.locale]
  );

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma, t, locale: info.locale, formatarData }}>
      {children}
    </IdiomaContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIdioma() {
  return useContext(IdiomaContext);
}
