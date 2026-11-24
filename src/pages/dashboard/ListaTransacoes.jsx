import { useState } from "react";
import { removerTransacao } from "../../firebase/transacoes";
import Confirmacao from "../../components/Confirmacao";
import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";

function badgeStatus(t, tr) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (t.status === "pago") return { texto: tr("comum.pago"), classe: "badge-pago" };

  const dataT = new Date(t.data);
  dataT.setHours(0, 0, 0, 0);

  if (dataT < hoje) return { texto: tr("comum.atrasado"), classe: "badge-atrasado" };
  return { texto: tr("comum.pendente"), classe: "badge-pendente" };
}

export default function ListaTransacoes({ transacoes, uid, aoEditar, resumido, modoLembrete }) {
  const { formatarValor } = useMoeda();
  const { t: tr, formatarData } = useIdioma();

  const [paraRemover, setParaRemover] = useState(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemover, setErroRemover] = useState("");

  async function confirmarRemocao() {
    setRemovendo(true);
    try {
      await removerTransacao(uid, paraRemover.id);
      setParaRemover(null);
      setErroRemover("");
    } catch {
      setErroRemover(tr("lista.erroRemover"));
    } finally {
      setRemovendo(false);
    }
  }

  if (transacoes.length === 0) {
    return (
      <div className="estado-vazio">
        <p>
          {modoLembrete
            ? tr("lista.semPendencias")
            : tr("lista.semTransacoes")}
        </p>
      </div>
    );
  }

  return (
    <div className="lista-transacoes">
      {paraRemover && (
        <Confirmacao
          perigo
          icone="lixeira"
          titulo={tr("lista.confirmarRemover")}
          texto={erroRemover || tr("seguranca.removerTexto")}
          resumo={
            <>
              <span>{paraRemover.categoria}</span>
              <strong>{paraRemover.tipo === "receita" ? "+" : "−"} {formatarValor(paraRemover.valor)}</strong>
            </>
          }
          rotuloConfirmar={tr("comum.remover")}
          ocupado={removendo}
          aoConfirmar={confirmarRemocao}
          aoCancelar={() => { setParaRemover(null); setErroRemover(""); }}
        />
      )}
      {transacoes.map((t, i) => {
        const badge = badgeStatus(t, tr);
        return (
          <div key={t.id} className="item-transacao" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
            <div className={`icone-transacao ${t.tipo === "receita" ? "icone-receita" : "icone-despesa"}`}>
              {t.tipo === "receita" ? "↑" : "↓"}
            </div>

            <div className="info-transacao">
              <p className="nome-transacao">{t.categoria}</p>
              <p className="data-transacao">{formatarData(t.data, { day: "2-digit", month: "short" })}</p>
            </div>

            <span className={`badge-status ${badge.classe}`}>{badge.texto}</span>

            <p className={`valor-transacao ${t.tipo === "receita" ? "valor-positivo" : "valor-negativo"}`}>
              {t.tipo === "receita" ? "+" : "-"}{formatarValor(t.valor)}
            </p>

            {!resumido && (
              <div className="acoes-transacao">
                <button className="botao-acao" onClick={() => aoEditar(t)} title={tr("comum.editar")}>✎</button>
                <button className="botao-acao botao-remover" onClick={() => setParaRemover(t)} title={tr("comum.remover")}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
