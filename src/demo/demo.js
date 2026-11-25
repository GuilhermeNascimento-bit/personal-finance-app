// demo.js — "banco de dados" em memória para o modo demonstração.
//
// Enquanto a demo está ativa, os módulos de src/firebase/* desviam leituras e
// escritas para cá: nada vai ao Firestore, nada é salvo e tudo volta ao exemplo
// ao recarregar. A API imita o que os componentes já usam do Firestore
// (escutar = onSnapshot, adicionar/editar/remover = addDoc/updateDoc/deleteDoc).

import { gerarDadosDemo } from "./dadosDemo";

let ativo = false;
let colecoes = { transacoes: [], recorrentes: [], metas: [] };
const ouvintes = { transacoes: new Set(), recorrentes: new Set(), metas: new Set() };
let contador = 0;

const ORDEM = {
  transacoes: (a, b) => b.data - a.data,              // mais recentes primeiro
  recorrentes: (a, b) => a.dia - b.dia,               // por dia do mês
  metas: (a, b) => b.criadoEm - a.criadoEm,           // mais novas primeiro
};

function emitir(nome) {
  const lista = [...colecoes[nome]].sort(ORDEM[nome]).map((x) => ({ ...x }));
  ouvintes[nome].forEach((cb) => cb(lista));
}

export function emDemo() {
  return ativo;
}

export function iniciarDemo(idioma = "pt") {
  ativo = true;
  colecoes = gerarDadosDemo(idioma);
  Object.keys(colecoes).forEach(emitir);
}

export function encerrarDemo() {
  ativo = false;
  colecoes = { transacoes: [], recorrentes: [], metas: [] };
}

export const demo = {
  escutar(nome, callback) {
    ouvintes[nome].add(callback);
    // como o onSnapshot: entrega o estado atual de forma assíncrona
    const id = setTimeout(() => {
      callback([...colecoes[nome]].sort(ORDEM[nome]).map((x) => ({ ...x })));
    }, 0);
    return () => {
      clearTimeout(id);
      ouvintes[nome].delete(callback);
    };
  },

  async adicionar(nome, dados) {
    const id = `demo-${nome}-${++contador}`;
    colecoes[nome].push({ ...dados, id });
    emitir(nome);
    return { id };
  },

  async editar(nome, id, dados) {
    colecoes[nome] = colecoes[nome].map((x) => (x.id === id ? { ...x, ...dados } : x));
    emitir(nome);
  },

  async remover(nome, id) {
    colecoes[nome] = colecoes[nome].filter((x) => x.id !== id);
    emitir(nome);
  },
};
