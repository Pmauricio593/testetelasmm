import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Clock } from "lucide-react";
import type { Tarefa, TarefaStatus } from "@/lib/cs-types";
import { statusTarefaEfetivo, useCS } from "@/lib/cs-store";

const statusStyle: Record<TarefaStatus, string> = {
  Pendente: "bg-muted text-muted-foreground border-border",
  "Em andamento": "bg-blue-100/60 text-blue-800 border-blue-200",
  Concluída: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  Atrasada: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
};

export function StatusTarefaBadge({ status }: { status: TarefaStatus }) {
  const Icon =
    status === "Concluída"
      ? CheckCircle2
      : status === "Atrasada"
        ? AlertTriangle
        : status === "Em andamento"
          ? Clock
          : Circle;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium " +
        statusStyle[status]
      }
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

export function isHoje(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

const fmtPrazo = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Linha de tarefa compacta reutilizável. */
export function TarefaRow({
  t,
  showCliente = false,
  clienteNome,
  onToggle,
}: {
  t: Tarefa;
  showCliente?: boolean;
  clienteNome?: string;
  onToggle?: () => void;
}) {
  const status = statusTarefaEfetivo(t);
  const hoje = isHoje(t.prazo) && status !== "Concluída";
  const destaque =
    status === "Atrasada"
      ? "bg-saude-risco/5"
      : hoje
        ? "bg-amber-50/60"
        : "";

  return (
    <div
      className={
        "grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_auto] gap-3 items-center px-4 py-2.5 text-sm border-b last:border-b-0 " +
        destaque
      }
    >
      <button
        onClick={onToggle}
        title={status === "Concluída" ? "Reabrir" : "Concluir"}
        className="text-muted-foreground hover:text-primary"
      >
        {status === "Concluída" ? (
          <CheckCircle2 className="h-4 w-4 text-saude-saudavel" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0">
        <div
          className={
            "truncate font-medium " +
            (status === "Concluída" ? "line-through text-muted-foreground" : "")
          }
        >
          {t.titulo}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {t.tipo}
          {t.origem === "clickup" && " · ClickUp"}
          {t.origem === "ia" && " · IA"}
        </div>
      </div>
      {showCliente && (
        <div className="hidden md:block">
          <Link
            to="/clientes/$id"
            params={{ id: t.clienteId }}
            className="text-sm text-primary hover:underline truncate"
          >
            {clienteNome ?? t.clienteId}
          </Link>
        </div>
      )}
      <div className="hidden md:block text-xs text-muted-foreground truncate">
        {t.responsavel}
      </div>
      <div className="hidden md:flex items-center gap-1 text-xs">
        <CalendarClock className="h-3 w-3 text-muted-foreground" />
        <span
          className={
            status === "Atrasada"
              ? "text-saude-risco font-medium"
              : hoje
                ? "text-amber-700 font-medium"
                : "text-muted-foreground"
          }
        >
          {fmtPrazo(t.prazo)}
          {hoje && " · hoje"}
        </span>
      </div>
      <div className="justify-self-end">
        <StatusTarefaBadge status={status} />
      </div>
    </div>
  );
}

/** Header alinhado às colunas do TarefaRow. */
export function TarefaRowHeader({ showCliente = false }: { showCliente?: boolean }) {
  return (
    <div className="hidden md:grid grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_auto] gap-3 items-center px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/40 border-b">
      <span />
      <span>Tarefa</span>
      <span>{showCliente ? "Cliente" : ""}</span>
      <span>Responsável</span>
      <span>Prazo</span>
      <span className="text-right">Status</span>
    </div>
  );
}

/** Hook util: toggle Concluída/Pendente. */
export function useToggleTarefa() {
  const { updateTarefa } = useCS();
  return (t: Tarefa) =>
    updateTarefa(t.id, {
      status: t.status === "Concluída" ? "Pendente" : "Concluída",
    });
}
