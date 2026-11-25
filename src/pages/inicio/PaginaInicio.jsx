import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../../i18n/IdiomaContext";
import { useMoeda } from "../../context/MoedaContext";
import { temaEfetivo, trocarTemaAnimado } from "../../utils/tema";
import Icone from "../../components/Icone";
import Logo from "../../components/Logo";
import Digitando from "../../components/Digitando";
import useContagem from "../../hooks/useContagem";
import "./inicio.css";

// Revela elementos .rolar-revela quando entram na tela
function useRevelarAoRolar(raiz) {
  useEffect(() => {
    const els = raiz.current?.querySelectorAll(".rolar-revela") ?? [];
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visivel"));
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visivel");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [raiz]);
}

// Prévia do app no topo (cartão de saldo + barras + atividade)
function PreviaApp() {
  const { t } = useIdioma();
  const { formatarValor } = useMoeda();
  const saldo = useContagem(4287.35, 1400);
  const itens = [
    { letra: t("landing.previa.i1")[0], nome: t("landing.previa.i1"), valor: "− " + formatarValor(42.9), tom: 2 },
    { letra: t("landing.previa.i2")[0], nome: t("landing.previa.i2"), valor: "+ " + formatarValor(6500), tom: 1, receita: true },
    { letra: t("landing.previa.i3")[0], nome: t("landing.previa.i3"), valor: "− " + formatarValor(18.4), tom: 6 },
  ];
  return (
    <div className="previa-palco" aria-hidden="true">
      <div className="previa luz inclinar">
        <div className="previa-saldo">
          <span className="previa-rotulo">{t("vg.saldoDisponivel")}</span>
          <strong>{formatarValor(saldo)}</strong>
          <div className="previa-mini">
            <span><i className="ponto receita" />{t("vg.entradas")}</span>
            <span><i className="ponto despesa" />{t("vg.saidas")}</span>
          </div>
        </div>
        <div className="previa-barras">
          {[48, 62, 40, 75, 58, 88].map((h, i) => (
            <span key={i} style={{ "--h": `${h}%`, animationDelay: `${0.5 + i * 0.08}s` }} />
          ))}
        </div>
        <ul className="previa-lista">
          {itens.map((it, i) => (
            <li key={i} style={{ animationDelay: `${0.9 + i * 0.12}s` }}>
              <span className={`vg-item-avatar tom-${it.tom}`}>{it.letra}</span>
              <span className="previa-nome">{it.nome}</span>
              <span className={`previa-valor ${it.receita ? "receita" : ""}`}>{it.valor}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="previa-bolha bolha-1">
        <Icone nome="check" tamanho={14} /> {t("landing.previa.bolha1")}
      </div>
      <div className="previa-bolha bolha-2">
        <Icone nome="metas" tamanho={14} /> {t("landing.previa.bolha2")}
      </div>
    </div>
  );
}

export default function PaginaInicio({ aoVerDemo, aoCriarConta, aoEntrar }) {
  const { t, idioma, setIdioma } = useIdioma();
  const [tema, setTema] = useState(temaEfetivo);
  const raiz = useRef(null);
  useRevelarAoRolar(raiz);

  const paraQue = [
    { icone: "diario", chave: "p1" },
    { icone: "relatorios", chave: "p2" },
    { icone: "metas", chave: "p3" },
  ];

  const passos = ["c1", "c2", "c3"];

  const comparacao = [
    { chave: "explorar", demo: true, conta: true },
    { chave: "salvar", demo: false, conta: true },
    { chave: "metas", demo: "ver", conta: true },
    { chave: "pdf", demo: false, conta: true },
    { chave: "perfil", demo: false, conta: true },
    { chave: "aparelhos", demo: false, conta: true },
  ];

  const marca = (v) =>
    v === true ? (
      <span className="cmp-sim"><Icone nome="check" tamanho={16} /></span>
    ) : v === false ? (
      <span className="cmp-nao">—</span>
    ) : (
      <span className="cmp-parcial">{t(`landing.cmp.${v}`)}</span>
    );

  return (
    <div className="inicio" ref={raiz}>
      <div className="fundo-ambiente" aria-hidden="true">
        <span className="orbe orbe-1" />
        <span className="orbe orbe-2" />
        <span className="orbe orbe-cursor" />
      </div>

      {/* ── Barra ── */}
      <header className="inicio-topo">
        <div className="inicio-marca">
          <Logo tamanho={32} />
          <span>{t("comum.marca")}</span>
        </div>
        <div className="inicio-topo-acoes">
          <button className="topbar-botao topbar-idioma" onClick={() => setIdioma(idioma === "pt" ? "en" : "pt")} title={t("topo.idioma")}>
            <span key={idioma} className="topbar-idioma-texto">{idioma.toUpperCase()}</span>
          </button>
          <button
            className="topbar-botao"
            onClick={(e) => {
              const novo = tema === "escuro" ? "claro" : "escuro";
              setTema(novo);
              trocarTemaAnimado(novo, e);
            }}
            title={tema === "escuro" ? t("topo.temaClaro") : t("topo.temaEscuro")}
          >
            <span key={tema} className="topbar-tema-icone"><Icone nome={tema === "escuro" ? "sol" : "lua"} tamanho={18} /></span>
          </button>
          <button className="inicio-entrar" onClick={aoEntrar}>{t("landing.entrar")}</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="inicio-hero">
        <div className="inicio-hero-texto">
          <span className="inicio-selo"><span className="verificar-ponto" /> {t("landing.selo")}</span>
          <h1><Digitando texto={t("landing.titulo")} atraso={350} velocidade={34} /></h1>
          <p className="inicio-sub">{t("landing.sub")}</p>
          <div className="inicio-ctas">
            <button className="inicio-cta primario" onClick={aoVerDemo}>
              <Icone nome="recomendacoes" tamanho={18} /> {t("landing.verDemo")}
            </button>
            <button className="inicio-cta secundario" onClick={aoCriarConta}>
              {t("landing.criarConta")} <Icone nome="chevron" tamanho={16} />
            </button>
          </div>
          <p className="inicio-nota">{t("landing.nota")}</p>
        </div>
        <PreviaApp />
      </section>

      {/* ── Pra que serve ── */}
      <section className="inicio-secao">
        <h2 className="rolar-revela">{t("landing.paraQueTitulo")}</h2>
        <p className="inicio-secao-sub rolar-revela">{t("landing.paraQueSub")}</p>
        <div className="inicio-cards">
          {paraQue.map((c, i) => (
            <article key={c.chave} className="inicio-card luz rolar-revela" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="inicio-card-icone"><Icone nome={c.icone} tamanho={22} /></span>
              <h3>{t(`landing.${c.chave}Titulo`)}</h3>
              <p>{t(`landing.${c.chave}Texto`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="inicio-secao">
        <h2 className="rolar-revela">{t("landing.comoTitulo")}</h2>
        <ol className="inicio-passos">
          {passos.map((p, i) => (
            <li key={p} className="rolar-revela" style={{ transitionDelay: `${i * 110}ms` }}>
              <span className="inicio-passo-num">{i + 1}</span>
              <div>
                <h3>{t(`landing.${p}Titulo`)}</h3>
                <p>{t(`landing.${p}Texto`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Demo x conta ── */}
      <section className="inicio-secao">
        <h2 className="rolar-revela">{t("landing.cmpTitulo")}</h2>
        <p className="inicio-secao-sub rolar-revela">{t("landing.cmpSub")}</p>
        <div className="inicio-cmp luz rolar-revela">
          <div className="cmp-linha cmp-cabecalho">
            <span />
            <span>{t("landing.cmp.demo")}</span>
            <span className="cmp-destaque">{t("landing.cmp.conta")}</span>
          </div>
          {comparacao.map((c) => (
            <div key={c.chave} className="cmp-linha">
              <span className="cmp-item">{t(`landing.cmp.${c.chave}`)}</span>
              <span>{marca(c.demo)}</span>
              <span className="cmp-destaque">{marca(c.conta)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final ── */}
      <section className="inicio-final rolar-revela">
        <Logo tamanho={56} />
        <h2>{t("landing.finalTitulo")}</h2>
        <p>{t("landing.finalSub")}</p>
        <div className="inicio-ctas centro">
          <button className="inicio-cta primario" onClick={aoCriarConta}>
            {t("landing.criarConta")} <Icone nome="chevron" tamanho={16} />
          </button>
          <button className="inicio-cta secundario" onClick={aoVerDemo}>{t("landing.verDemo")}</button>
        </div>
        <button className="inicio-link" onClick={aoEntrar}>{t("landing.jaTemConta")}</button>
      </section>

      <footer className="inicio-rodape">
        <span>© {new Date().getFullYear()} {t("comum.marca")}</span>
        <a href="https://github.com/GuilhermeNascimento-bit/personal-finance-app" target="_blank" rel="noopener noreferrer">
          {t("landing.codigo")}
        </a>
      </footer>
    </div>
  );
}
