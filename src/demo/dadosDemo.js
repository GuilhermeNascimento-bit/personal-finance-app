// dadosDemo.js — dados de exemplo da demonstração, sempre relativos a hoje.
// Determinístico (semente fixa): a demo é igual para todo mundo, mas as datas
// acompanham o dia em que a pessoa abre o app.

const NOMES = {
  pt: {
    salario: "Salário", freela: "Freela de design", aluguel: "Aluguel", mercado: "Mercado",
    restaurante: "Restaurante", transporte: "Uber", streaming: "Netflix", academia: "Academia",
    energia: "Conta de luz", internet: "Internet", farmacia: "Farmácia", lazer: "Cinema",
    cafe: "Café", cartao: "Fatura do cartão", padaria: "Padaria",
    viagem: "Viagem para a praia", reserva: "Reserva de emergência", notebook: "Notebook novo",
  },
  en: {
    salario: "Salary", freela: "Design freelance", aluguel: "Rent", mercado: "Groceries",
    restaurante: "Restaurant", transporte: "Uber", streaming: "Netflix", academia: "Gym",
    energia: "Electricity bill", internet: "Internet", farmacia: "Pharmacy", lazer: "Movies",
    cafe: "Coffee", cartao: "Credit card bill", padaria: "Bakery",
    viagem: "Beach trip", reserva: "Emergency fund", notebook: "New laptop",
  },
};

// gerador pseudoaleatório com semente (mulberry32)
function aleatorio(semente) {
  return () => {
    semente |= 0;
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d) => d.toISOString().slice(0, 10);

export function gerarDadosDemo(idioma = "pt") {
  const n = NOMES[idioma] || NOMES.pt;
  const rnd = aleatorio(20261124);
  const entre = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;

  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const transacoes = [];
  let id = 0;
  const add = (tipo, categoria, data, valor, extra = {}) => {
    const passou = data <= hoje;
    transacoes.push({
      id: `demo-t-${++id}`,
      tipo,
      categoria,
      data,
      valor,
      status: extra.status ?? (passou ? "pago" : "pendente"),
      ...(tipo === "despesa" ? { formaPagamento: extra.formaPagamento ?? "debito" } : {}),
      ...(extra.recorrenteId ? { recorrenteId: extra.recorrenteId } : {}),
    });
  };

  // ── pagamentos fixos ──
  const recorrentes = [
    { id: "demo-r-salario", nome: n.salario, tipo: "receita", valor: 6500, dia: 5, formaPagamento: "dinheiro", ativo: true },
    { id: "demo-r-aluguel", nome: n.aluguel, tipo: "despesa", valor: 1800, dia: 10, formaPagamento: "debito", ativo: true },
    { id: "demo-r-internet", nome: n.internet, tipo: "despesa", valor: 119.9, dia: 15, formaPagamento: "debito", ativo: true },
    { id: "demo-r-streaming", nome: n.streaming, tipo: "despesa", valor: 55.9, dia: 2, formaPagamento: "credito", ativo: true },
    { id: "demo-r-academia", nome: n.academia, tipo: "despesa", valor: 99.9, dia: 3, formaPagamento: "credito", ativo: true },
  ];

  // ── 6 meses de histórico (5 completos + o atual até hoje) ──
  for (let m = 5; m >= 0; m--) {
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() - m;
    const dia = (d) => new Date(ano, mes, d, 12);
    const mesAtual = m === 0;
    const ate = (d) => !mesAtual || d <= hoje.getDate();

    // fixos (confirmados no fluxo de caixa)
    for (const r of recorrentes) {
      if (ate(r.dia)) {
        add(r.tipo, r.nome, dia(r.dia), r.valor, { formaPagamento: r.formaPagamento, recorrenteId: r.id });
      }
    }

    if (m % 2 === 0 && ate(18)) add("receita", n.freela, dia(18), entre(900, 1600));

    // mercado toda semana
    for (const d of [4, 11, 19, 26]) if (ate(d)) add("despesa", n.mercado, dia(d), entre(180, 420), { formaPagamento: rnd() > 0.5 ? "credito" : "debito" });
    // gastos do dia a dia
    for (const d of [6, 13, 21, 27]) if (ate(d)) add("despesa", n.restaurante, dia(d), entre(45, 140), { formaPagamento: "credito" });
    for (const d of [2, 8, 12, 16, 22, 28]) if (ate(d)) add("despesa", n.transporte, dia(d), entre(14, 38), { formaPagamento: "credito" });
    if (ate(9)) add("despesa", n.farmacia, dia(9), entre(30, 120));
    if (ate(24)) add("despesa", n.lazer, dia(24), entre(40, 90), { formaPagamento: "credito" });

    // conta de luz: paga nos meses anteriores
    if (!mesAtual) add("despesa", n.energia, dia(20), entre(150, 230));
  }

  // ── perguntas para o Diário e lembretes ──
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  const em3 = new Date(hoje); em3.setDate(hoje.getDate() + 3);
  const em6 = new Date(hoje); em6.setDate(hoje.getDate() + 6);
  add("despesa", n.energia, ontem, 187.4, { status: "pendente" });           // atrasada
  add("despesa", n.cartao, em3, 1240.55, { status: "pendente", formaPagamento: "credito" });
  add("despesa", n.internet, em6, 119.9, { status: "pendente" });

  // um registro de hoje, para o "Seu dia" não ficar vazio
  add("despesa", n.cafe, new Date(hoje.getTime() - 2 * 3600e3), 12.5, { formaPagamento: "debito" });

  // ── metas ──
  const daqui = (meses) => { const d = new Date(hoje); d.setMonth(d.getMonth() + meses); return iso(d); };
  const metas = [
    { id: "demo-m-1", nome: n.notebook, emoji: "💻", valor: 5500, acumulado: 4900, dataAlvo: daqui(2), criadoEm: new Date(hoje.getTime() - 3e9) },
    { id: "demo-m-2", nome: n.viagem, emoji: "🏖️", valor: 8000, acumulado: 3150, dataAlvo: daqui(8), criadoEm: new Date(hoje.getTime() - 2e9) },
    { id: "demo-m-3", nome: n.reserva, emoji: "💰", valor: 15000, acumulado: 6100, dataAlvo: daqui(14), criadoEm: new Date(hoje.getTime() - 1e9) },
  ];

  return { transacoes, recorrentes, metas };
}
