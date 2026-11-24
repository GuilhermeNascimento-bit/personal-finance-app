// Objeto do contexto isolado num módulo próprio: quando os dicionários ou o
// provider mudam (hot reload), este arquivo não é reexecutado e o contexto
// continua o mesmo — evita "useIdioma() é null" durante o desenvolvimento.
import { createContext } from "react";

export const IdiomaContext = createContext(null);
