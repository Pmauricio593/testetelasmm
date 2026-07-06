import { useMemo, useState, type ReactNode } from "react";
import { Search, Check, Copy, Save, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import type { Cliente } from "@/lib/cs-types";
import { SaudeBadge } from "./badges";

/** Cabeçalho padrão das telas de ferramentas. */
export function FerramentaHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
          {icon}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

/**
 * Seleção de clientes (um ou vários) para os quais a ação será executada.
 * Lista clientes ativos com busca, "selecionar todos" e badge de saúde.
 */
export function ClienteMultiSelect({
  selecionados,
  onChange,
}: {
  selecionados: string[];
  onChange: (ids: string[]) => void;
}) {
  const { clientes, calcSaudeCliente } = useCS();
  const [busca, setBusca] = useState("");

  const ativos = useMemo(
    () => clientes.filter((c) => c.etapaFunil !== "Encerrado/Churn"),
    [clientes],
  );

  const filtrados = useMemo(
    () =>
      ativos.filter(
        (c) =>
          c.nome.toLowerCase().includes(busca.toLowerCase()) ||
          c.nicho.toLowerCase().includes(busca.toLowerCase()),
      ),
    [ativos, busca],
  );

  const sel = new Set(selecionados);
  const toggle = (id: string) => {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  const todosVisiveis = filtrados.length > 0 && filtrados.every((c) => sel.has(c.id));
  const toggleTodos = () => {
    if (todosVisiveis) {
      const remover = new Set(filtrados.map((c) => c.id));
      onChange(selecionados.filter((id) => !remover.has(id)));
    } else {
      onChange([...new Set([...selecionados, ...filtrados.map((c) => c.id)])]);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Clientes
          <span className="font-normal text-muted-foreground">
            · {selecionados.length} selecionado(s)
          </span>
        </div>
        <button
          onClick={toggleTodos}
          className="text-xs font-medium text-primary hover:underline"
        >
          {todosVisiveis ? "Limpar" : "Selecionar todos"}
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente ou nicho..."
            className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <ul className="max-h-[360px] overflow-y-auto px-2 pb-2 space-y-1">
        {filtrados.map((c) => {
          const ativo = sel.has(c.id);
          const saude = calcSaudeCliente(c);
          return (
            <li key={c.id}>
              <button
                onClick={() => toggle(c.id)}
                className={
                  "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors " +
                  (ativo
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-accent")
                }
              >
                <span
                  className={
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                    (ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background")
                  }
                >
                  {ativo && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.nicho} · {c.plano}
                  </span>
                </span>
                <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
              </button>
            </li>
          );
        })}
        {!filtrados.length && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </li>
        )}
      </ul>
    </div>
  );
}

/** Card de resultado gerado por cliente — editável, com copiar/salvar/enviar. */
export function ResultadoCard({
  cliente,
  texto,
  onChangeTexto,
  onSalvar,
  onEnviar,
  rows = 18,
  badge,
}: {
  cliente: Cliente;
  texto: string;
  onChangeTexto: (t: string) => void;
  onSalvar: () => void;
  onEnviar: () => void;
  rows?: number;
  badge?: string;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="text-sm font-semibold flex items-center gap-2">
          {cliente.nome}{" "}
          <span className="font-normal text-muted-foreground">· {cliente.nicho}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(texto);
              toast.success(`Copiado · ${cliente.nome}`);
            }}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
          >
            <Copy className="h-3 w-3" /> Copiar
          </button>
          <button
            onClick={onSalvar}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
          >
            <Save className="h-3 w-3" /> Salvar
          </button>
          <button
            onClick={onEnviar}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Send className="h-3 w-3" /> Enviar ao ClickUp
          </button>
        </div>
      </div>
      <div className="p-3">
        <textarea
          value={texto}
          onChange={(e) => onChangeTexto(e.target.value)}
          rows={rows}
          className="input min-h-[280px] resize-y font-mono text-xs leading-relaxed"
        />
      </div>
    </div>
  );
}
