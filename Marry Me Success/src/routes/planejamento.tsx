import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CalendarRange, Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Legend, Cell,
} from "recharts";
import {
  PLANOS, CENARIOS, UNIT_ECONOMICS, mesAtualPlano, alertaCapacidade, fmtBRL, fmtBRLm,
  type CenarioId,
} from "@/lib/cs-planejamento";

export const Route = createFileRoute("/planejamento")({
  component: PlanejamentoPage,
});

const alertaStyle: Record<string, string> = {
  OK: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  Atenção: "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40",
  Estourado: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
};

function PlanejamentoPage() {
  const [cenarioId, setCenarioId] = useState<CenarioId>("META");
  const [selYm, setSelYm] = useState<string | null>(null);

  const cen = CENARIOS.find((c) => c.id === cenarioId)!;
  const plano = PLANOS[cenarioId];
  const ue = UNIT_ECONOMICS[cenarioId];
  const atual = mesAtualPlano(plano);
  const sel = plano.find((m) => m.ym === selYm) ?? atual;
  const selIdx = plano.indexOf(sel);
  const short = (m: string) => m.replace("/26", "");
  const chart = plano.map((m) => ({ mes: short(m.mes), mrr: m.mrrBruto, arr: m.arr, atual: m.ym === atual.ym }));

  // Projeção no ritmo atual: extrapola o MRR usando o crescimento médio até o mês corrente
  const curIdx = plano.indexOf(atual);
  const ratios: number[] = [];
  for (let i = 1; i <= curIdx; i++) ratios.push(plano[i].mrrBruto / plano[i - 1].mrrBruto);
  const gAtual = ratios.length ? Math.pow(ratios.reduce((a, b) => a * b, 1), 1 / ratios.length) : 1;
  const projData: { mes: string; meta: number; proj: number }[] = [];
  let projPrev = plano[curIdx]?.mrrBruto ?? plano[0].mrrBruto;
  plano.forEach((m, i) => {
    let proj: number;
    if (i < curIdx) proj = m.mrrBruto;
    else if (i === curIdx) { proj = m.mrrBruto; projPrev = proj; }
    else { projPrev = Math.round(projPrev * gAtual); proj = projPrev; }
    projData.push({ mes: short(m.mes), meta: m.mrrBruto, proj });
  });
  const projDez = projData[projData.length - 1].proj;
  const metaDez = plano[plano.length - 1].mrrBruto;
  const gapPct = metaDez ? Math.round((projDez / metaDez - 1) * 100) : 0;
  const cresc = plano.map((m) => ({ mes: short(m.mes), clientes: m.clientesFim, novos: m.novos, churn: m.churn }));
  const receita = plano.map((m) => ({ mes: short(m.mes), bruto: m.mrrBruto, liquido: m.mrrLiquido }));

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-8">
      <header className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25"><CalendarRange className="h-4 w-4" /></span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planejamento Anual 2026</h1>
          <p className="text-sm text-muted-foreground">Metas da empresa · visão geral e aprofundamento por área</p>
        </div>
      </header>

      {/* Cenário */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Cenário:</span>
        {CENARIOS.map((c) => (
          <button key={c.id} onClick={() => { setCenarioId(c.id); setMetaEdit(null); }}
            className={"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " + (c.id === cenarioId ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>
            {c.nome} <span className="opacity-70">· {c.alvo}</span>
          </button>
        ))}
      </div>

      {/* ===== GERAL ===== */}
      <SectionTitle>Visão geral</SectionTitle>
      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Alvo ARR (Dez/26)" value={fmtBRLm(cen.alvoARR)} hint={`Cenário ${cen.nome}`} />
        <Kpi label="Clientes no fim do ano" value={cen.clientesFinal.toString()} hint="carteira em Dez/26" />
        <Kpi label="MRR bruto (Dez/26)" value={fmtBRL(cen.mrrBrutoFinal)} hint="meta de saída" />
        <Kpi label="Un. de CS no fim" value={plano[plano.length - 1].unidadesCS.toString()} hint="times de atendimento" />
      </section>

      <section className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Mês {sel.ym === atual.ym && <span className="text-muted-foreground">· atual</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => selIdx > 0 && setSelYm(plano[selIdx - 1].ym)} disabled={selIdx === 0} className="rounded-md border p-1 hover:bg-accent disabled:opacity-40" aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
            <span className="w-20 text-center text-sm font-semibold">{sel.mes}</span>
            <button onClick={() => selIdx < plano.length - 1 && setSelYm(plano[selIdx + 1].ym)} disabled={selIdx === plano.length - 1} className="rounded-md border p-1 hover:bg-accent disabled:opacity-40" aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Metric label="Meta de novo MRR" value={fmtBRL(sel.metaNovoMRR)} sub={`ticket ${fmtBRL(sel.ticket)}`} />
          <Metric label="Novos clientes" value={`${sel.novos}`} sub={`${sel.novosInbound} inbound + ${sel.novosOutbound} outbound`} />
          <Metric label="Clientes no fim" value={`${sel.clientesFim}`} sub={`churn previsto ${sel.churn}`} />
          <Metric label="MRR bruto alvo" value={fmtBRL(sel.mrrBruto)} sub={`ARR ${fmtBRLm(sel.arr)}`} />
        </div>
      </section>

      <section className="mb-8 rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold">Trajetória até {cen.alvo}</h3>
        <p className="mb-3 text-xs text-muted-foreground">Barras = MRR bruto · linha = ARR run-rate · tracejado = alvo</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis yAxisId="l" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
              <YAxis yAxisId="r" orientation="right" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + (v / 1_000_000).toFixed(1) + "MM"} />
              <Tooltip formatter={(v: number, k) => (k === "arr" ? fmtBRLm(v) : fmtBRL(v))} cursor={{ fill: "var(--accent)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="r" y={cen.alvoARR} stroke="var(--saude-risco)" strokeDasharray="4 4" />
              <Bar yAxisId="l" dataKey="mrr" name="MRR bruto" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chart.map((d, i) => (<Cell key={i} fill={d.atual ? "var(--primary)" : "var(--gold)"} />))}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="arr" name="ARR run-rate" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== META × PROJEÇÃO ===== */}
      <SectionTitle>Meta × Projeção (ritmo atual)</SectionTitle>
      <section className="mb-8 rounded-lg border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Tracejado = meta do cenário · linha cheia = projeção mantendo o crescimento atual (~{Math.round((gAtual - 1) * 100)}%/mês)</p>
          <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (gapPct >= 0 ? "bg-saude-saudavel/15 text-saude-saudavel" : "bg-saude-risco/15 text-saude-risco")}>
            No ritmo atual: {fmtBRL(projDez)} em Dez vs meta {fmtBRL(metaDez)} ({gapPct >= 0 ? "+" : ""}{gapPct}%)
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} cursor={{ fill: "var(--accent)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="meta" name="Meta" stroke="var(--saude-risco)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line type="monotone" dataKey="proj" name="Projeção (ritmo atual)" stroke="var(--saude-saudavel)" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== CRESCIMENTO ===== */}
      <SectionTitle>Crescimento de clientes</SectionTitle>
      <section className="mb-8 rounded-lg border bg-card p-5">
        <p className="mb-3 text-xs text-muted-foreground">Barras = novos clientes/mês · linha = carteira no fim do mês</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cresc} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--accent)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="novos" name="Novos" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line type="monotone" dataKey="clientes" name="Carteira (fim)" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== RECEITA ===== */}
      <SectionTitle>Receita (MRR)</SectionTitle>
      <section className="mb-8 rounded-lg border bg-card p-5">
        <p className="mb-3 text-xs text-muted-foreground">MRR bruto vs. líquido recebido (após inadimplência)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={receita} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} cursor={{ fill: "var(--accent)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="bruto" name="MRR bruto" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} />
              <Line type="monotone" dataKey="liquido" name="MRR líquido" stroke="var(--saude-saudavel)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== MÊS A MÊS (capacidade incluída) ===== */}
      <SectionTitle>O que precisamos mês a mês</SectionTitle>
      <section className="mb-8 rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Mês</th>
                <th className="px-3 py-2.5 text-right font-medium">Novos</th>
                <th className="px-3 py-2.5 text-right font-medium">Churn</th>
                <th className="px-3 py-2.5 text-right font-medium">Clientes fim</th>
                <th className="px-3 py-2.5 text-right font-medium">MRR bruto</th>
                <th className="px-3 py-2.5 text-right font-medium">MRR líquido</th>
                <th className="px-3 py-2.5 text-right font-medium">Un. CS</th>
                <th className="px-4 py-2.5 text-left font-medium">Capacidade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plano.map((m) => {
                const al = alertaCapacidade(m);
                return (
                  <tr key={m.ym} className={"hover:bg-accent/30 " + (m.ym === atual.ym ? "bg-primary/5" : "")}>
                    <td className="px-4 py-2.5 font-medium">{m.mes}{m.ym === atual.ym && <span className="ml-1.5 text-[10px] text-primary">atual</span>}</td>
                    <td className="px-3 py-2.5 text-right">{m.novos}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">-{m.churn}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{m.clientesFim}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmtBRL(m.mrrBruto)}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{fmtBRL(m.mrrLiquido)}</td>
                    <td className="px-3 py-2.5 text-right">{m.unidadesCS}</td>
                    <td className="px-4 py-2.5"><span className={"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium " + alertaStyle[al]}>{al}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== UNIT ECONOMICS ===== */}
      <SectionTitle>Unit economics — cenário {cen.nome}</SectionTitle>
      <section className="rounded-lg border bg-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Ue label="LTV" value={ue.ltv} />
          <Ue label="LTV / CAC" value={ue.ltvCac} />
          <Ue label="CAC" value={ue.cac} />
          <Ue label="Churn (meta)" value={ue.churnMeta} />
          <Ue label="NRR (Dez/26)" value={ue.nrr} />
          <Ue label="Quick Ratio" value={ue.quickRatio} />
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>Fonte: planilha de planejamento anual (3 cenários). Meta editável em memória. <span className="font-medium text-foreground">Conectar fonte depois.</span></span>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>;
}
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
function Ue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-primary">{value}</div>
    </div>
  );
}
