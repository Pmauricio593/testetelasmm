import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HeartPulse, Search, ArrowRight, X, Sliders } from "lucide-react";
import { useCS, mrrDoCliente } from "@/lib/cs-store";
import { SAUDES, RESPONSAVEIS, type Saude, type Cliente, type SaudeCalculada } from "@/lib/cs-types";
import { SaudeBadge, fmtBRL } from "@/components/cs/badges";

export const Route = createFileRoute("/health-score")({
  component: HealthScorePage,
});

const NIVEL_VALOR: Record<Saude, number> = { Saudável: 100, Atenção: 70, Risco: 40, Crítico: 15 };

interface Pesos { entregas: number; vendas: number; campanha: number; renovacao: number }
const PESOS_PADRAO: Pesos = { entregas: 40, vendas: 30, campanha: 20, renovacao: 10 };

function calcScore(saude: SaudeCalculada, p: Pesos): number {
  const total = p.entregas + p.vendas + p.campanha + p.renovacao || 1;
  const soma =
    p.entregas * NIVEL_VALOR[saude.entregas.nivel] +
    p.vendas * NIVEL_VALOR[saude.vendasCliente.nivel] +
    p.campanha * NIVEL_VALOR[saude.campanhas.nivel] +
    p.renovacao * NIVEL_VALOR[saude.renovacao.nivel];
  return Math.round(soma / total);
}
const corScore = (s: number) => (s >= 80 ? "text-saude-saudavel" : s >= 60 ? "text-saude-atencao" : s >= 40 ? "text-saude-risco" : "text-saude-critico");
const bgScore = (s: number) => (s >= 80 ? "bg-saude-saudavel" : s >= 60 ? "bg-saude-atencao" : s >= 40 ? "bg-saude-risco" : "bg-saude-critico");

function HealthScorePage() {
  const { clientes, calcSaudeCliente } = useCS();
  const [pesos, setPesos] = useState<Pesos>(PESOS_PADRAO);
  const [busca, setBusca] = useState("");
  const [fResp, setFResp] = useState("Todos");
  const [sel, setSel] = useState<string | null>(null);

  const linhas = useMemo(
    () =>
      clientes
        .filter((c) => c.etapaFunil !== "Encerrado/Churn")
        .map((c) => { const saude = calcSaudeCliente(c); return { c, saude, mrr: mrrDoCliente(c), score: calcScore(saude, pesos) }; }),
    [clientes, calcSaudeCliente, pesos],
  );

  const filtradas = linhas
    .filter((l) => (busca ? l.c.nome.toLowerCase().includes(busca.toLowerCase()) : true) && (fResp === "Todos" || l.c.responsavel === fResp))
    .sort((a, b) => a.score - b.score);

  const media = linhas.length ? Math.round(linhas.reduce((a, l) => a + l.score, 0) / linhas.length) : 0;
  const criticos = linhas.filter((l) => l.score < 40);
  const mrrRisco = linhas.filter((l) => l.score < 60).reduce((a, l) => a + l.mrr, 0);

  const linhaSel = linhas.find((l) => l.c.id === sel);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex items-start gap-2">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25"><HeartPulse className="h-4 w-4" /></span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Health Score</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Pontuação 0–100 por cliente · pesos ajustáveis</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Score médio" value={`${media}`} tom={media} />
        <Kpi label="Clientes críticos (<40)" value={criticos.length.toString()} />
        <Kpi label="MRR em risco (score <60)" value={fmtBRL(mrrRisco)} />
        <Kpi label="Clientes avaliados" value={linhas.length.toString()} />
      </section>

      {/* Pesos editáveis */}
      <section className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Pesos do score</h2>
          <span className="text-xs text-muted-foreground">· soma {pesos.entregas + pesos.vendas + pesos.campanha + pesos.renovacao}</span>
          <button onClick={() => setPesos(PESOS_PADRAO)} className="ml-auto text-xs text-primary hover:underline">Restaurar padrão</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {([["entregas", "Entregas no prazo"], ["vendas", "Saúde das vendas"], ["campanha", "Campanha (mídia)"], ["renovacao", "Renovação"]] as const).map(([k, label]) => (
            <div key={k}>
              <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{pesos[k]}</span></div>
              <input type="range" min={0} max={100} step={5} value={pesos[k]} onChange={(e) => setPesos({ ...pesos, [k]: Number(e.target.value) })} className="w-full accent-[var(--primary)]" />
            </div>
          ))}
        </div>
      </section>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">Responsável:
          <select value={fResp} onChange={(e) => setFResp(e.target.value)} className="rounded-md border bg-card px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring">
            {["Todos", ...RESPONSAVEIS].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-3 py-2.5 text-left font-medium w-40">Score</th>
                <th className="px-3 py-2.5 text-left font-medium">Saúde</th>
                <th className="px-3 py-2.5 text-left font-medium">Resp.</th>
                <th className="px-4 py-2.5 text-right font-medium">MRR</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map(({ c, saude, mrr, score }) => (
                <tr key={c.id} onClick={() => setSel(c.id)} className="cursor-pointer hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium">{c.nome}<div className="text-[11px] font-normal text-muted-foreground">{c.nicho} · {c.plano}</div></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={"text-lg font-bold " + corScore(score)}>{score}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className={"h-full " + bgScore(score)} style={{ width: `${score}%` }} /></div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><SaudeBadge saude={saude.saude} overridden={saude.overridden} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.responsavel}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmtBRL(mrr)}</td>
                  <td className="px-4 py-2.5 text-right"><ArrowRight className="inline h-3.5 w-3.5 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {linhaSel && <ScoreDrawer c={linhaSel.c} saude={linhaSel.saude} score={linhaSel.score} mrr={linhaSel.mrr} pesos={pesos} onClose={() => setSel(null)} />}
    </div>
  );
}

function ScoreDrawer({ c, saude, score, mrr, pesos, onClose }: { c: Cliente; saude: SaudeCalculada; score: number; mrr: number; pesos: Pesos; onClose: () => void }) {
  const total = pesos.entregas + pesos.vendas + pesos.campanha + pesos.renovacao || 1;
  const dims = [
    { label: "Entregas no prazo", peso: pesos.entregas, nivel: saude.entregas.nivel, fatores: saude.entregas.fatores },
    { label: "Saúde das vendas", peso: pesos.vendas, nivel: saude.vendasCliente.nivel, fatores: saude.vendasCliente.fatores },
    { label: "Campanha (mídia)", peso: pesos.campanha, nivel: saude.campanhas.nivel, fatores: saude.campanhas.fatores },
    { label: "Renovação", peso: pesos.renovacao, nivel: saude.renovacao.nivel, fatores: saude.renovacao.fatores },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b p-5">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Health Score</div>
            <h2 className="truncate text-lg font-semibold">{c.nome}</h2>
            <div className="text-xs text-muted-foreground">{c.nicho} · {c.responsavel} · {fmtBRL(mrr)}</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className={"text-4xl font-bold " + corScore(score)}>{score}</div>
            <div className="flex-1">
              <div className="mb-1 text-xs text-muted-foreground">de 100</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={"h-full " + bgScore(score)} style={{ width: `${score}%` }} /></div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Composição do score</div>
            <ul className="space-y-3">
              {dims.map((d) => {
                const valor = NIVEL_VALOR[d.nivel];
                const contrib = Math.round((d.peso * valor) / total);
                return (
                  <li key={d.label} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{d.label}</span>
                      <span className="text-xs text-muted-foreground">peso {d.peso} · nível {d.nivel}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className={"h-full " + bgScore(valor)} style={{ width: `${valor}%` }} /></div>
                      <span className="w-12 text-right text-xs font-semibold">+{contrib}</span>
                    </div>
                    {d.fatores.length > 0 && <div className="mt-1 text-[11px] text-muted-foreground">{d.fatores[0]}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <footer className="border-t p-4">
          <Link to="/clientes/$id" params={{ id: c.id }} onClick={onClose} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Abrir ficha completa <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </aside>
    </>
  );
}

function Kpi({ label, value, tom }: { label: string; value: string; tom?: number }) {
  const cor = tom !== undefined ? corScore(tom) : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-semibold " + cor}>{value}</div>
    </div>
  );
}
