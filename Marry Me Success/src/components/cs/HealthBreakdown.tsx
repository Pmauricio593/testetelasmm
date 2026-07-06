import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useMemo } from "react";
import { SaudeBadge, ConfiancaBadge } from "./badges";
import type { Cliente, SaudeCalculada, Tarefa } from "@/lib/cs-types";
import { diasAte } from "@/lib/cs-store";

/** Versão simples (texto), usada onde não precisamos de gráficos. */
export function HealthBreakdown({
  saude,
  dense = false,
}: {
  saude: SaudeCalculada;
  dense?: boolean;
}) {
  const dims = [
    { key: "entregas", label: "Entregas / Prazos", d: saude.entregas },
    { key: "campanhas", label: "Campanhas", d: saude.campanhas },
    { key: "vendas", label: "Vendas do cliente", d: saude.vendasCliente },
    { key: "renov", label: "Renovação do contrato", d: saude.renovacao },
  ] as const;
  return (
    <div className={dense ? "space-y-2" : "space-y-3"}>
      {dims.map(({ key, label, d }) => (
        <div key={key} className="rounded-md border bg-card px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <SaudeBadge saude={d.nivel} />
          </div>
          {!dense && (
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
              {d.fatores.map((f, i) => (
                <li key={i}>· {f}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/** Card com sparkline. Usado no drawer e na Ficha. */
function DimCard({
  label,
  nivel,
  fator,
  children,
}: {
  label: string;
  nivel: SaudeCalculada["entregas"]["nivel"];
  fator: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-xs font-medium">{label}</div>
        <SaudeBadge saude={nivel} />
      </div>
      <div className="h-14 -mx-1">{children}</div>
      <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
        {fator}
      </div>
    </div>
  );
}

/** Versão com gráficos das 4 dimensões — drawer e Ficha. */
export function HealthBreakdownCharts({
  cliente,
  saude,
  tarefas,
}: {
  cliente: Cliente;
  saude: SaudeCalculada;
  tarefas: Tarefa[];
}) {
  // Entregas: barras de tarefas atrasadas por semana (últimas 8 sem.)
  const entregasData = useMemo(() => {
    const buckets: { semana: string; atrasadas: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ini = Date.now() - (i + 1) * 7 * 86400000;
      const fim = Date.now() - i * 7 * 86400000;
      const n = tarefas.filter(
        (t) =>
          t.clienteId === cliente.id &&
          t.status !== "Concluída" &&
          new Date(t.prazo).getTime() >= ini &&
          new Date(t.prazo).getTime() < fim &&
          new Date(t.prazo).getTime() < Date.now(),
      ).length;
      buckets.push({ semana: `S${8 - i}`, atrasadas: n });
    }
    return buckets;
  }, [cliente.id, tarefas]);

  const dias = diasAte(cliente.dataRenovacao);
  const percRenov = Math.max(0, Math.min(100, ((60 - Math.min(dias, 60)) / 60) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <DimCard
        label="Entregas / Prazos"
        nivel={saude.entregas.nivel}
        fator={saude.entregas.fatores[0] ?? ""}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={entregasData}>
            <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
            <Bar dataKey="atrasadas" fill="var(--saude-risco)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </DimCard>

      <DimCard
        label="Campanhas (Meta Ads)"
        nivel={saude.campanhas.nivel}
        fator={saude.campanhas.fatores[0] ?? ""}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cliente.metricasCampanha}>
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="cpl" stroke="var(--primary)" strokeWidth={2} dot={false} name="CPL" />
            <Line type="monotone" dataKey="leads" stroke="var(--saude-saudavel)" strokeWidth={1.5} dot={false} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </DimCard>

      <DimCard
        label="Vendas do cliente"
        nivel={saude.vendasCliente.nivel}
        fator={saude.vendasCliente.fatores[0] ?? ""}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cliente.vendasCliente}>
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="fechados"
              stroke="var(--gold)"
              fill="var(--gold)"
              fillOpacity={0.25}
              strokeWidth={2}
              name="Contratos fechados"
            />
          </AreaChart>
        </ResponsiveContainer>
      </DimCard>

      <DimCard
        label="Renovação do contrato"
        nivel={saude.renovacao.nivel}
        fator={saude.renovacao.fatores[0] ?? ""}
      >
        <div className="h-full flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {dias >= 0 ? `Renova em ${dias}d` : `Venceu há ${-dias}d`}
            </span>
            {cliente.confiancaFechamento && (
              <ConfiancaBadge c={cliente.confiancaFechamento} />
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percRenov}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground">
            {cliente.statusPagamento === "Em atraso"
              ? `Inadimplente há ${cliente.diasAtraso}d`
              : "Pagamento em dia"}
          </div>
        </div>
      </DimCard>
    </div>
  );
}

const tooltipStyle = {
  fontSize: 11,
  padding: "4px 8px",
  border: "1px solid var(--border)",
  background: "var(--card)",
  borderRadius: 4,
};
