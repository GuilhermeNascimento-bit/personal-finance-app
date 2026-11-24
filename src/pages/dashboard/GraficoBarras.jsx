import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useMoeda } from "../../context/MoedaContext";
import { useIdioma } from "../../i18n/IdiomaContext";

function obterUltimos6Meses(locale) {
  const meses = [];
  const agora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({
      mes: d.toLocaleDateString(locale, { month: "short" }).replace(".", ""),
      ano: d.getFullYear(),
      mesNum: d.getMonth(),
      receitas: 0,
      despesas: 0,
    });
  }
  return meses;
}

export default function GraficoBarras({ transacoes }) {
  const { formatarValor, moeda } = useMoeda();
  const { t, locale } = useIdioma();

  const dados = obterUltimos6Meses(locale);
  transacoes.forEach((tr) => {
    const data = new Date(tr.data);
    const entrada = dados.find(
      (d) => d.mesNum === data.getMonth() && d.ano === data.getFullYear()
    );
    if (!entrada) return;
    if (tr.tipo === "receita") entrada.receitas += tr.valor;
    else if (tr.status === "pago") entrada.despesas += tr.valor;
  });

  const sim = moeda.simbolo;

  return (
    <div>
      <div className="legenda-grafico">
        <span><i style={{ background: "var(--grafico-receita)" }} />{t("comum.receitas")}</span>
        <span><i style={{ background: "var(--grafico-despesa)" }} />{t("comum.despesas")}</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dados} barGap={4} barCategoryGap="32%" margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--cor-borda-cartao)" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: "var(--cor-texto-secundario)" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--cor-texto-secundario)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v === 0 ? `${sim}0` : `${sim}${(v / 1000).toFixed(1)}k`}
            tickCount={5}
            allowDecimals={false}
            width={54}
          />
          <Tooltip
            cursor={{ fill: "var(--cor-fundo-secao)", radius: 6 }}
            formatter={(valor) => formatarValor(valor)}
            contentStyle={{
              background: "var(--cor-fundo-cartao)",
              border: "1px solid var(--cor-borda)",
              borderRadius: 10,
              fontSize: 13,
              boxShadow: "var(--sombra-flutuante)",
            }}
            labelStyle={{ color: "var(--cor-texto-principal)", fontWeight: 600, textTransform: "capitalize" }}
          />
          <Bar animationDuration={900} animationEasing="ease-out" dataKey="receitas" name={t("comum.receitas")} fill="var(--grafico-receita)" radius={[5, 5, 1, 1]} maxBarSize={22} />
          <Bar animationDuration={900} animationBegin={150} animationEasing="ease-out" dataKey="despesas" name={t("comum.despesas")} fill="var(--grafico-despesa)" radius={[5, 5, 1, 1]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
