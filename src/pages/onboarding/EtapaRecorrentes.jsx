import { useState } from "react";
import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";

// nome: índice em ob.recSugestoes (traduzido)
const SUGESTOES = [
  { i: 0, tipo: "receita", dia: 5,  formaPagamento: "dinheiro" },
  { i: 1, tipo: "despesa", dia: 10, formaPagamento: "dinheiro" },
  { i: 2, tipo: "despesa", dia: 7,  formaPagamento: "credito"  },
  { i: 3, tipo: "despesa", dia: 15, formaPagamento: "debito"   },
  { i: 4, tipo: "despesa", dia: 1,  formaPagamento: "credito"  },
  { i: 5, tipo: "despesa", dia: 1,  formaPagamento: "dinheiro" },
];

const FORMAS = ["dinheiro", "debito", "credito"];

export default function EtapaRecorrentes({ valoresIniciais, aoAvancar, aoVoltar }) {
  const { moeda, formatarValor } = useMoeda();
  const { t } = useIdioma();
  const nomesSugestoes = t("ob.recSugestoes");

  const [lista, setLista]               = useState(valoresIniciais || []);
  const [tipo, setTipo]                 = useState("despesa");
  const [nome, setNome]                 = useState("");
  const [valor, setValor]               = useState("");
  const [dia, setDia]                   = useState("");
  const [formaPagamento, setForma]      = useState("dinheiro");
  const [erro, setErro]                 = useState("");

  function aplicarSugestao(s) {
    setTipo(s.tipo);
    setNome(nomesSugestoes[s.i]);
    setDia(String(s.dia));
    setForma(s.formaPagamento);
    setErro("");
  }

  function adicionar() {
    if (!nome.trim()) return setErro(t("fluxo.erroNome"));
    if (!valor || Number(valor) <= 0) return setErro(t("modal.erroValor"));
    const diaNum = Number(dia);
    if (!diaNum || diaNum < 1 || diaNum > 31) return setErro(t("fluxo.erroDia"));

    setLista((ant) => [
      ...ant,
      {
        nome: nome.trim(),
        tipo,
        valor: Number(valor),
        dia: diaNum,
        formaPagamento: tipo === "despesa" ? formaPagamento : "dinheiro",
      },
    ]);
    setNome("");
    setValor("");
    setDia("");
    setErro("");
  }

  function remover(i) {
    setLista((ant) => ant.filter((_, idx) => idx !== i));
  }

  return (
    <div className="etapa">
      <h2>{t("ob.recTitulo")}</h2>
      <p className="texto-etapa">
        {t("ob.recTexto")}
      </p>

      {/* Sugestões rápidas */}
      <div className="chips-sugestoes">
        {SUGESTOES.map((s) => (
          <button key={s.i} className="chip-sugestao" type="button" onClick={() => aplicarSugestao(s)}>
            {nomesSugestoes[s.i]}
          </button>
        ))}
      </div>

      {/* Formulário */}
      <div className="form-recorrente-ob">

        <div className="toggle-tipo">
          <button type="button" className={`toggle-opcao ${tipo === "receita" ? "ativo" : ""}`} onClick={() => setTipo("receita")}>↑ {t("comum.receita")}</button>
          <button type="button" className={`toggle-opcao ${tipo === "despesa" ? "ativo" : ""}`} onClick={() => setTipo("despesa")}>↓ {t("comum.despesa")}</button>
        </div>

        <input
          className="input-categoria"
          placeholder={t("ob.recPlaceholder")}
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErro(""); }}
        />

        <div className="linha-recorrente-ob">
          <div className="input-valor-wrapper">
            <span className="prefixo-moeda">{moeda.simbolo}</span>
            <input
              className="input-valor"
              type="number"
              placeholder={t("modal.valor")}
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div className="input-dia-wrapper">
            <span className="prefixo-dia">{t("ob.dia")}</span>
            <input
              className="input-valor"
              type="number"
              placeholder="07"
              min="1"
              max="31"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
        </div>

        {tipo === "despesa" && (
          <div className="toggle-tipo">
            {FORMAS.map((f) => (
              <button
                key={f}
                type="button"
                className={`toggle-opcao ${formaPagamento === f ? "ativo" : ""}`}
                onClick={() => setForma(f)}
              >
                {t(`comum.${f}`)}
              </button>
            ))}
          </div>
        )}

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button
          type="button"
          className="botao-adicionar-rec"
          onClick={adicionar}
        >
          + {t("modal.adicionar")}
        </button>
      </div>

      {/* Lista de itens adicionados */}
      {lista.length > 0 && (
        <div className="lista-rec-ob">
          {lista.map((item, i) => (
            <div key={i} className={`item-rec-ob item-rec-${item.tipo}`}>
              <span className="item-rec-seta">{item.tipo === "receita" ? "↑" : "↓"}</span>
              <div className="item-rec-texto">
                <span className="item-rec-nome">{item.nome}</span>
                <span className="item-rec-sub">
                  {t("ob.todoDia", { dia: item.dia })}
                  {item.tipo === "despesa" && item.formaPagamento !== "dinheiro"
                    ? ` · ${t(`comum.${item.formaPagamento}`)}`
                    : ""}
                </span>
              </div>
              <span className="item-rec-valor">
                {formatarValor(item.valor)}
              </span>
              <button className="botao-remover-item" onClick={() => remover(i)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="botoes-navegacao">
        <button className="botao-secundario" onClick={aoVoltar}>{t("comum.voltar")}</button>
        <button className="botao-primario" onClick={() => aoAvancar(lista)}>
          {lista.length === 0 ? t("ob.pular") : t("comum.continuar")}
        </button>
      </div>
    </div>
  );
}
