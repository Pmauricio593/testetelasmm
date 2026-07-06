import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CobrancaStatus, ReguaTom } from "@/lib/cs-financeiro";

export const tomColor: Record<ReguaTom, string> = {
  neutro: "var(--muted-foreground)",
  info: "var(--primary)",
  aviso: "var(--saude-atencao)",
  risco: "var(--saude-risco)",
  critico: "var(--saude-critico)",
};

export const statusStyle: Record<CobrancaStatus, string> = {
  Quitado: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  "Em Aberto": "bg-primary/10 text-primary border-primary/30",
  Atrasado: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
};

export function StatusBadge({ status }: { status: CobrancaStatus }) {
  return (
    <span className={"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium " + statusStyle[status]}>
      {status}
    </span>
  );
}

type KpiTom = "receber" | "ok" | "alerta" | "saida" | "risco" | "neutro";

export function KpiFin({
  label,
  value,
  hint,
  tom = "neutro",
  size = "md",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tom?: KpiTom;
  size?: "md" | "lg";
}) {
  const cor =
    tom === "ok" || tom === "receber"
      ? "text-saude-saudavel"
      : tom === "alerta"
        ? "text-saude-atencao"
        : tom === "saida" || tom === "risco"
          ? "text-saude-risco"
          : "text-foreground";
  const showIcon = tom === "receber" || tom === "ok" || tom === "saida" || tom === "risco";
  const Icon = tom === "saida" || tom === "risco" ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={
          "mt-2 flex items-center gap-1.5 font-semibold " +
          cor +
          (size === "lg" ? " text-3xl" : " text-2xl")
        }
      >
        {showIcon && <Icon className="h-5 w-5 opacity-70" />}
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function MiniSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
