import type { Saude, StatusPagamento, Etapa, Confianca } from "@/lib/cs-types";
import { AlertTriangle } from "lucide-react";

const saudeStyles: Record<Saude, string> = {
  Saudável: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  Atenção: "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40",
  Risco: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
  Crítico: "bg-saude-critico/15 text-saude-critico border-saude-critico/40",
};

export function SaudeBadge({
  saude,
  overridden,
  label,
}: {
  saude: Saude;
  overridden?: boolean;
  label?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium " +
        saudeStyles[saude]
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? saude}
      {overridden && <span className="text-[10px] opacity-70">· manual</span>}
    </span>
  );
}

/** Tag simples "Inadimplente" — sem exibir dias em atraso. */
export function InadimplenteTag({ status }: { status: StatusPagamento }) {
  if (status !== "Em atraso") return null;
  return (
    <span className="inline-flex items-center rounded-full border border-saude-risco/40 bg-saude-risco/15 px-2 py-0.5 text-xs font-medium text-saude-risco">
      Inadimplente
    </span>
  );
}

/** Badge detalhada com dias — apenas para telas internas (Ficha). */
export function PagamentoBadge({
  status,
  dias,
}: {
  status: StatusPagamento;
  dias: number;
}) {
  const atraso = status === "Em atraso";
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
        (atraso
          ? "bg-saude-risco/15 text-saude-risco border-saude-risco/40"
          : "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30")
      }
    >
      {atraso ? `Em atraso · ${dias}d` : "Em dia"}
    </span>
  );
}

const etapaStyles: Record<Etapa, string> = {
  Onboarding: "bg-blue-100/60 text-blue-800 border-blue-200",
  Estruturação: "bg-purple-100/60 text-purple-800 border-purple-200",
  "Operação Ativa": "bg-emerald-100/60 text-emerald-800 border-emerald-200",
  "Janela de Renovação": "bg-amber-100/60 text-amber-800 border-amber-200",
  "Encerrado/Churn": "bg-neutral-200/60 text-neutral-700 border-neutral-300",
};

export function EtapaBadge({ etapa }: { etapa: Etapa }) {
  return (
    <span
      className={
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium " +
        etapaStyles[etapa]
      }
    >
      {etapa}
    </span>
  );
}

export function ConfiancaBadge({ c }: { c?: Confianca }) {
  if (!c) return <span className="text-xs text-muted-foreground">—</span>;
  const map = {
    Alta: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
    Média: "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40",
    Baixa: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
  };
  return (
    <span
      className={
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " + map[c]
      }
    >
      Confiança {c}
    </span>
  );
}

/** Tag para renovação próxima (< 60 dias). */
export function RenovacaoTag({ dias }: { dias: number }) {
  if (dias < 0 || dias > 60) return null;
  const critico = dias <= 15;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium " +
        (critico
          ? "bg-saude-risco/15 text-saude-risco border-saude-risco/40"
          : "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40")
      }
    >
      Renova em {dias}d
    </span>
  );
}

/** Tag para tarefas atrasadas do cliente. */
export function TarefasAtrasadasTag({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-saude-risco/40 bg-saude-risco/15 px-2 py-0.5 text-xs font-medium text-saude-risco">
      <AlertTriangle className="h-3 w-3" />
      {n} atrasada{n > 1 ? "s" : ""}
    </span>
  );
}

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
