import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Target, Info, X } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend,
} from "recharts";
import { FECHAMENTOS_MES, POR_ORIGEM, RESUMO_VENDAS, NEGOCIACOES, fmtBRL, fmtMesAno, soma } from "@/lib/cs-vendas";
import { PLANOS, CENARIOS, mesAtualPlano, type CenarioId } from "@/lib/cs-planejamento";
import { VendasHeader, VendaKpi } from "@/components/cs/vendas-ui";

export const Route = createFileRoute("/vendas/metas")({
  component: MetasPage,
});

const MESES_2026 = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);

function MetasPage() {
  const [cenarioId, setCenarioId] = useState<CenarioId>("META");
  const [metaEdit, setMetaEdit] = useState<number | null>(null);
  const [drill, setDrill] = useState<string | null>(null);

  const cen = CENARIOS.find((c) => c.id === cenarioId)!;
  const plano = PLANOS[cenarioId];
  const atual = mesAtualPlano(plano);
  const metaMes = metaEdit ?? atual.metaNovoMRR;
  // Cascata: ao editar, os meses seguintes escalam na mesma proporção
  const fator = atual.metaNovoMRR ? metaMes / atual.metaNovoMRR : 1;

  const realMap = useMemo(() => new Map(FECHAMENTOS_MES.map((m) => [m.mes, m.mrr])), []);
  const metaMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of plano) {
      const escala = p.ym >= atual.ym ? fator : 1;
      m.set(p.ym, Math.round(p.metaNovoMRR * escala));
    }
    return m;
  }, [plano, fator, atual.ym]);

  const realizadoMes = realMap.get(atual.ym) ?? 0;
  const pctMes = metaMes ? (realizadoMes / metaMes) * 100 : 0;

  const anoData = MESES_2026.map((ym) => ({
    ym,
    mes: fmtMesAno(ym),
    realizado: realMap.get(ym) ?? 0,
    meta: metaMap.get(ym) ?? null,
    atual: ym === atual.ym,
  }));

  const origensFecham = [...POR_ORIGEM].filter((o) => o.fechadas > 0).sort((a, b) => b.mrr - a.mrr);
  const maxOrig = origensFecham[0]?.mrr || 1;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <VendasHeader icon={<Target className="h-4 w-4" />} title="Metas & Resultados" description="Meta comercial vs. realizado do CRM · ano 2026" />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Cenário:</span>
        {CENARIOS.map((c) => (
          <button key={c.id} onClick={() => { setCenarioId(c.id); setMetaEdit(null); }}
            className={"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " + (c.id === cenarioId ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>
            {c.nome} <span className="opacity-70">· {c.alvo}</span>
          </button>
        ))}
      </div>

      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Meta mensal · {atual.mes}</div>
          <input type="number" value={metaMes} onChange={(e) => setMetaEdit(Number(e.target.value))} className="mt-2 w-32 rounded-md border bg-background px-2 py-1 text-2xl font-semibold outline-none focus:ring-2 focus:ring-ring" />
          <div className="mt-1 text-xs text-muted-foreground">editável · cascateia p/ os próximos meses</div>
        </div>
        <VendaKpi label={`Realizado (${atual.mes})`} value={fmtBRL(realizadoMes)} hint={`${pctMes.toFixed(0)}% da meta`} />
        <VendaKpi label="MRR fechado (total)" value={fmtBRL(RESUMO_VENDAS.mrrFechado)} hint={`${RESUMO_VENDAS.fechadas} contratos`} />
        <VendaKpi label="Ticket médio" value={fmtBRL(RESUMO_VENDAS.ticketMedio)} hint="por contrato fechado" />
      </section>

      <section className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Progresso do mês · {atual.mes}</span>
          <span className="font-medium">{fmtBRL(realizadoMes)} / {fmtBRL(metaMes)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted"><div className={"h-full rounded-full " + (pctMes >= 100 ? "bg-saude-saudavel" : "bg-primary")} style={{ width: `${Math.min(100, pctMes)}%` }} /></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Realizado × Meta · 2026</h2>
          <p className="mb-3 text-xs text-muted-foreground">Clique num mês para ver os fechamentos e fontes</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={anoData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <XAxis dataKey="mes" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} interval={0} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} cursor={{ fill: "var(--accent)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="realizado" name="Realizado" radius={[4, 4, 0, 0]} maxBarSize={28} onClick={(d: { ym?: string }) => d?.ym && setDrill(d.ym)} className="cursor-pointer">
                  {anoData.map((d, i) => (<Cell key={i} fill={d.ym === drill ? "var(--saude-saudavel)" : d.atual ? "var(--primary)" : "var(--gold)"} />))}
                </Bar>
                <Line dataKey="meta" name="Meta" stroke="var(--saude-risco)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* chips de mês */}
          <div className="mt-3 flex flex-wrap gap-1">
            {anoData.filter((d) => d.realizado > 0).map((d) => (
              <button key={d.ym} onClick={() => setDrill(d.ym)} className={"rounded-md border px-2 py-1 text-xs " + (d.ym === drill ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent")}>{d.mes}</button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Contratos por origem</h2>
          <p className="mb-3 text-xs text-muted-foreground">De onde vêm as vendas</p>
          <ul className="space-y-3">
            {origensFecham.map((o) => (
              <li key={o.origem}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{o.origem}</span><span className="text-muted-foreground">{o.fechadas} · {fmtBRL(o.mrr)}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${(o.mrr / maxOrig) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {drill && <DrillMes ym={drill} meta={metaMap.get(drill) ?? null} realizado={realMap.get(drill) ?? 0} onClose={() => setDrill(null)} />}

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-dashed bg-muted/20 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>Meta do Planejamento (cenário selecionável). Ao editar, os meses seguintes recalculam proporcionalmente. Realizado vem do CRM (mock). <span className="font-medium text-foreground">Conectar fonte depois.</span></span>
      </div>
    </div>
  );
}

function DrillMes({ ym, meta, realizado, onClose }: { ym: string; meta: number | null; realizado: number; onClose: () => void }) {
  const fechamentos = NEGOCIACOES.filter((n) => n.etapa === "Ganho" && n.dataFechamento.startsWith(ym))
    .map((n) => ({ nome: n.nome, origem: n.origem, valor: n.valorMensal }))
    .sort((a, b) => b.valor - a.valor);
  const porOrigem = new Map<string, number>();
  for (const f of fechamentos) porOrigem.set(f.origem, (porOrigem.get(f.origem) ?? 0) + f.valor);
  const pct = meta ? Math.round((realizado / meta) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Fechamentos do mês</div>
            <h2 className="text-lg font-semibold">{fmtMesAno(ym)}</h2>
            <div className="text-xs text-muted-foreground">{fmtBRL(realizado)} realizado{meta ? ` · ${pct}% da meta (${fmtBRL(meta)})` : ""}</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {porOrigem.size > 0 && (
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Fontes</div>
              <ul className="space-y-1.5">
                {[...porOrigem.entries()].sort((a, b) => b[1] - a[1]).map(([o, v]) => (
                  <li key={o} className="flex items-center justify-between text-sm"><span>{o}</span><span className="font-medium">{fmtBRL(v)}</span></li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Contratos fechados · {fechamentos.length}</div>
            {fechamentos.length ? (
              <ul className="divide-y rounded-md border">
                {fechamentos.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0"><span className="block truncate font-medium">{f.nome}</span><span className="block text-[11px] text-muted-foreground">{f.origem}</span></span>
                    <span className="font-semibold">{fmtBRL(f.valor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem contratos registrados neste mês no CRM.</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
