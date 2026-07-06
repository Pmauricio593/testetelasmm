import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCS, statusTarefaEfetivo } from "@/lib/cs-store";
import { RESPONSAVEIS, TAREFA_STATUS, type TarefaStatus } from "@/lib/cs-types";
import {
  TarefaRow,
  TarefaRowHeader,
  useToggleTarefa,
} from "@/components/cs/tarefas-ui";

export const Route = createFileRoute("/tarefas")({
  component: TarefasPage,
});

type Agrupar = "responsavel" | "prazo";

function TarefasPage() {
  const { tarefas, clientes } = useCS();
  const toggle = useToggleTarefa();
  const [agrupar, setAgrupar] = useState<Agrupar>("responsavel");
  const [busca, setBusca] = useState("");
  const [fResp, setFResp] = useState<string>("Todos");
  const [fStatus, setFStatus] = useState<TarefaStatus | "Todos">("Todos");
  const [fCliente, setFCliente] = useState<string>("Todos");

  const nomeCliente = useMemo(() => {
    const m = new Map(clientes.map((c) => [c.id, c.nome]));
    return (id: string) => m.get(id) ?? id;
  }, [clientes]);

  const filtradas = tarefas.filter((t) => {
    if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fResp !== "Todos" && t.responsavel !== fResp) return false;
    if (fCliente !== "Todos" && t.clienteId !== fCliente) return false;
    if (fStatus !== "Todos" && statusTarefaEfetivo(t) !== fStatus) return false;
    return true;
  });

  const grupos = useMemo(() => {
    const g = new Map<string, typeof filtradas>();
    for (const t of filtradas) {
      const key =
        agrupar === "responsavel"
          ? t.responsavel
          : bucketPrazo(t.prazo, t.status);
      const arr = g.get(key) ?? [];
      arr.push(t);
      g.set(key, arr);
    }
    for (const arr of g.values()) {
      arr.sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime());
    }
    const entries = Array.from(g.entries());
    if (agrupar === "prazo") {
      const order = ["Atrasadas", "Hoje", "Esta semana", "Depois", "Concluídas"];
      entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    return entries;
  }, [filtradas, agrupar]);

  const total = filtradas.length;
  const atrasadas = filtradas.filter((t) => statusTarefaEfetivo(t) === "Atrasada").length;
  const hoje = filtradas.filter(
    (t) =>
      statusTarefaEfetivo(t) !== "Concluída" &&
      new Date(t.prazo).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Central de Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Apoio da daily · {total} tarefas · {atrasadas} atrasadas · {hoje} vencendo hoje
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          <button
            onClick={() => setAgrupar("responsavel")}
            className={
              "px-3 py-1.5 text-xs font-medium rounded " +
              (agrupar === "responsavel"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Por responsável
          </button>
          <button
            onClick={() => setAgrupar("prazo")}
            className={
              "px-3 py-1.5 text-xs font-medium rounded " +
              (agrupar === "prazo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Por prazo
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tarefa..."
            className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Filtro label="Responsável" value={fResp} onChange={setFResp}
          options={["Todos", ...RESPONSAVEIS]} />
        <Filtro label="Status" value={fStatus} onChange={(v) => setFStatus(v as TarefaStatus | "Todos")}
          options={["Todos", ...TAREFA_STATUS]} />
        <Filtro label="Cliente" value={fCliente} onChange={setFCliente}
          options={["Todos", ...clientes.map((c) => c.id)]}
          renderOption={(o) => (o === "Todos" ? "Todos" : nomeCliente(o))}
        />
      </div>

      <div className="space-y-5">
        {grupos.map(([grupo, lista]) => (
          <div key={grupo} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
              <div className="text-sm font-semibold">{grupo}</div>
              <div className="text-xs text-muted-foreground">{lista.length} tarefa(s)</div>
            </div>
            <TarefaRowHeader showCliente />
            {lista.map((t) => (
              <TarefaRow
                key={t.id}
                t={t}
                showCliente
                clienteNome={nomeCliente(t.clienteId)}
                onToggle={() => toggle(t)}
              />
            ))}
          </div>
        ))}
        {!grupos.length && (
          <div className="rounded-lg border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            Nenhuma tarefa com esses filtros.
          </div>
        )}
      </div>
    </div>
  );
}

function bucketPrazo(prazo: string, status: string) {
  if (status === "Concluída") return "Concluídas";
  const d = new Date(prazo);
  const now = new Date();
  const diffDay = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDay < 0) return "Atrasadas";
  if (d.toDateString() === now.toDateString()) return "Hoje";
  if (diffDay <= 7) return "Esta semana";
  return "Depois";
}

function Filtro<T extends string>({
  label,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  renderOption?: (v: T) => string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring max-w-[200px]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}
