import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useCS, mrrDoCliente, diasAte } from "@/lib/cs-store";
import { SAUDES, type Confianca, type Saude } from "@/lib/cs-types";
import { SaudeBadge, fmtBRL, fmtData } from "@/components/cs/badges";

export const Route = createFileRoute("/renovacoes")({
  component: Renovacoes,
});

const saudeColor: Record<Saude, string> = {
  Saudável: "var(--saude-saudavel)",
  Atenção: "var(--saude-atencao)",
  Risco: "var(--saude-risco)",
  Crítico: "var(--saude-critico)",
};

const confColor: Record<string, string> = {
  Alta: "var(--saude-saudavel)",
  Média: "var(--saude-atencao)",
  Baixa: "var(--saude-risco)",
  "Sem info": "var(--muted-foreground)",
};

function Renovacoes() {
  const { clientes, setConfianca, calcSaudeCliente } = useCS();

  const lista = useMemo(
    () =>
      clientes
        .filter((c) => c.etapaFunil === "Janela de Renovação")
        .map((c) => ({
          c,
          saude: calcSaudeCliente(c),
          mrr: mrrDoCliente(c),
          dias: diasAte(c.dataRenovacao),
        }))
        .sort((a, b) => a.dias - b.dias),
    [clientes, calcSaudeCliente],
  );

  const totalRisco = lista.reduce((s, x) => s + x.mrr, 0);

  const porMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of lista) {
      const d = new Date(x.c.dataRenovacao);
      const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      map.set(key, (map.get(key) ?? 0) + x.mrr);
    }
    return Array.from(map, ([mes, mrr]) => ({ mes, mrr }));
  }, [lista]);

  const porConfianca = useMemo(() => {
    const buckets = ["Alta", "Média", "Baixa", "Sem info"] as const;
    return buckets.map((b) => ({
      confianca: b,
      total: lista.filter((x) =>
        b === "Sem info" ? !x.c.confiancaFechamento : x.c.confiancaFechamento === b,
      ).length,
    }));
  }, [lista]);

  const porSaude = useMemo(
    () =>
      SAUDES.map((s) => ({
        saude: s,
        total: lista.filter((x) => x.saude.saude === s).length,
      })),
    [lista],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Central de Renovações</h1>
        <p className="text-sm text-muted-foreground">
          Clientes na Janela de Renovação, ordenados pela data mais próxima.
        </p>
      </header>

      <div className="rounded-lg border bg-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            MRR total em risco de renovação
          </div>
          <div className="text-2xl font-semibold mt-1">{fmtBRL(totalRisco)}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {lista.length} clientes em janela
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">MRR em risco por mês de renovação</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Bar dataKey="mrr" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Distribuição por confiança</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porConfianca}
                  dataKey="total"
                  nameKey="confianca"
                  outerRadius={70}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {porConfianca.map((e) => (
                    <Cell key={e.confianca} fill={confColor[e.confianca]} />
                  ))}
                </Pie>
                <Legend fontSize={11} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Saúde dos clientes em janela</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSaude} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis dataKey="saude" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {porSaude.map((s) => (
                    <Cell key={s.saude} fill={saudeColor[s.saude]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-right px-4 py-3 font-medium">MRR em jogo</th>
              <th className="text-left px-4 py-3 font-medium">Fim do contrato</th>
              <th className="text-left px-4 py-3 font-medium">Saúde</th>
              <th className="text-left px-4 py-3 font-medium">Confiança de fechamento</th>
              <th className="text-right px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lista.map(({ c, saude, mrr, dias }) => (
              <tr key={c.id} className="hover:bg-accent/40">
                <td className="px-4 py-3">
                  <Link
                    to="/clientes/$id"
                    params={{ id: c.id }}
                    className="font-medium hover:underline"
                  >
                    {c.nome}
                  </Link>
                  <div className="text-xs text-muted-foreground">{c.nicho} · {c.plano}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{fmtBRL(mrr)}</td>
                <td className="px-4 py-3">
                  <div>{fmtData(c.dataRenovacao)}</div>
                  <div className="text-xs text-muted-foreground">
                    {dias >= 0 ? `${dias} dias restantes` : `venceu há ${-dias} dias`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={c.confiancaFechamento || ""}
                    onChange={(e) => {
                      setConfianca(c.id, e.target.value as Confianca);
                      toast.success("Confiança atualizada");
                    }}
                    className="input max-w-[140px]"
                  >
                    <option value="">—</option>
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/clientes/$id"
                    params={{ id: c.id }}
                    className="text-xs text-primary hover:underline"
                  >
                    Abrir ficha →
                  </Link>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum cliente na janela de renovação.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
