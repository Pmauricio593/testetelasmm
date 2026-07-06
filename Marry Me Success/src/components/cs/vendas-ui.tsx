import type { ReactNode } from "react";
import type { Temperatura, EtapaVenda, PropostaStatus } from "@/lib/cs-vendas";

export function VendasHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <header className="mb-6 flex items-start gap-2">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
        {icon}
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

const tempStyle: Record<Temperatura, string> = {
  Quente: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
  Morno: "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40",
  Frio: "bg-primary/10 text-primary border-primary/30",
};

export function TemperaturaBadge({ t }: { t: Temperatura }) {
  const emoji = t === "Quente" ? "🔥" : t === "Morno" ? "🌤️" : "❄️";
  return (
    <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " + tempStyle[t]}>
      {emoji} {t}
    </span>
  );
}

export const etapaStyle: Record<EtapaVenda, string> = {
  Qualificado: "bg-blue-100/60 text-blue-800 border-blue-200",
  Negociação: "bg-amber-100/60 text-amber-800 border-amber-200",
  Proposta: "bg-purple-100/60 text-purple-800 border-purple-200",
  Ganho: "bg-emerald-100/60 text-emerald-800 border-emerald-200",
  Perdido: "bg-rose-100/60 text-rose-700 border-rose-200",
};

export function EtapaBadge({ etapa }: { etapa: EtapaVenda }) {
  return <span className={"inline-flex rounded-md border px-2 py-0.5 text-xs font-medium " + etapaStyle[etapa]}>{etapa}</span>;
}

const propStyle: Record<PropostaStatus, string> = {
  Enviada: "bg-blue-100/60 text-blue-800 border-blue-200",
  Aceita: "bg-emerald-100/60 text-emerald-800 border-emerald-200",
  Recusada: "bg-rose-100/60 text-rose-700 border-rose-200",
};

export function PropostaStatusBadge({ status }: { status: PropostaStatus }) {
  return <span className={"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium " + propStyle[status]}>{status}</span>;
}

export function VendaKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
