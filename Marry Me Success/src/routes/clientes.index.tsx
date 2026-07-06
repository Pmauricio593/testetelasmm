import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type DragEvent } from "react";
import { Plus, Search, LayoutGrid, Table as TableIcon, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCS, diasAte, mrrDoCliente } from "@/lib/cs-store";
import { resumoCampanha, resumoVendas } from "@/lib/cs-insights";
import {
  ETAPAS,
  SAUDES,
  PLANO_MRR,
  RESPONSAVEIS,
  type Etapa,
  type Nicho,
  type Plano,
  type Saude,
  type StatusPagamento,
  type Cliente,
  type SaudeCalculada,
} from "@/lib/cs-types";
import {
  SaudeBadge,
  EtapaBadge,
  InadimplenteTag,
  RenovacaoTag,
  TarefasAtrasadasTag,
  fmtData,
  fmtBRL,
} from "@/components/cs/badges";
import { HealthBreakdownCharts } from "@/components/cs/HealthBreakdown";

export const Route = createFileRoute("/clientes/")({
  component: ClientesPage,
});

const nichos: Nicho[] = [
  "Músico",
  "Banda",
  "DJ",
  "Celebrante",
  "Cerimonialista",
  "Fotógrafo",
  "Cinegrafista",
];

interface Row {
  c: Cliente;
  saude: SaudeCalculada;
  atrasadas: number;
  diasRen: number;
}

function ClientesPage() {
  const { clientes, tarefas, setEtapa, addCliente, calcSaudeCliente, tarefasAtrasadasDoCliente } = useCS();
  const nav = useNavigate();
  const [modo, setModo] = useState<"kanban" | "tabela">("kanban");
  const [novoAberto, setNovoAberto] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<Etapa | "Todas">("Todas");
  const [filtroSaude, setFiltroSaude] = useState<Saude | "Todas">("Todas");
  const [filtroPag, setFiltroPag] = useState<StatusPagamento | "Todos">("Todos");

  const enriched: Row[] = useMemo(
    () =>
      clientes.map((c) => ({
        c,
        saude: calcSaudeCliente(c),
        atrasadas: tarefasAtrasadasDoCliente(c.id),
        diasRen: diasAte(c.dataRenovacao),
      })),
    [clientes, calcSaudeCliente, tarefasAtrasadasDoCliente],
  );

  const filtrados = enriched.filter((e) => {
    if (busca && !e.c.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroEtapa !== "Todas" && e.c.etapaFunil !== filtroEtapa) return false;
    if (filtroSaude !== "Todas" && e.saude.saude !== filtroSaude) return false;
    if (filtroPag !== "Todos" && e.c.statusPagamento !== filtroPag) return false;
    return true;
  });

  const handleDrop = (etapa: Etapa) => (ev: DragEvent) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    if (id) {
      setEtapa(id, etapa);
      toast.success(`Etapa atualizada para ${etapa}`);
    }
  };

  const rowSelecionada = enriched.find((e) => e.c.id === selecionado) ?? null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} fornecedores na carteira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border bg-card p-0.5">
            <button
              onClick={() => setModo("kanban")}
              className={
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium " +
                (modo === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setModo("tabela")}
              className={
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium " +
                (modo === "tabela" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              <TableIcon className="h-3.5 w-3.5" /> Tabela
            </button>
          </div>
          <button
            onClick={() => setNovoAberto(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Select value={filtroEtapa} onChange={(v) => setFiltroEtapa(v as Etapa | "Todas")}
          options={["Todas", ...ETAPAS]} label="Etapa" />
        <Select value={filtroSaude} onChange={(v) => setFiltroSaude(v as Saude | "Todas")}
          options={["Todas", ...SAUDES]} label="Saúde" />
        <Select value={filtroPag} onChange={(v) => setFiltroPag(v as StatusPagamento | "Todos")}
          options={["Todos", "Em dia", "Em atraso"]} label="Pagamento" />
      </div>

      {/* Carrossel de clientes */}
      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Carteira · {filtrados.length}</div>
          <div className="text-[11px] text-muted-foreground">clique num card para a visão rápida</div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filtrados.map(({ c, saude }) => (
            <button
              key={c.id}
              onClick={() => setSelecionado(c.id)}
              className={
                "w-44 shrink-0 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 " +
                (selecionado === c.id ? "border-primary/60 ring-1 ring-primary/30" : "")
              }
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {c.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{c.nome}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{c.nicho}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
                <span className="text-xs font-semibold">{fmtBRL(mrrDoCliente(c))}</span>
              </div>
            </button>
          ))}
          {!filtrados.length && <div className="py-6 text-sm text-muted-foreground">Nenhum cliente com esses filtros.</div>}
        </div>
      </section>

      {modo === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {ETAPAS.map((etapa) => {
            const items = filtrados.filter((e) => e.c.etapaFunil === etapa);
            return (
              <div
                key={etapa}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop(etapa)}
                className="flex flex-col rounded-lg bg-muted/40 min-h-[300px]"
              >
                <div className="px-3 py-2.5 border-b border-border/60">
                  <div className="text-xs font-semibold tracking-wide">{etapa}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {items.length} cliente{items.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {items.map(({ c, saude, atrasadas, diasRen }) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(ev) => ev.dataTransfer.setData("text/plain", c.id)}
                      onClick={() => setSelecionado(c.id)}
                      className={
                        "rounded-md border bg-card p-3 shadow-sm cursor-pointer hover:border-primary/40 transition-colors " +
                        (selecionado === c.id ? "border-primary/60 ring-1 ring-primary/30" : "")
                      }
                    >
                      <div className="flex items-start gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {c.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{c.nome}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {c.nicho} · {c.plano}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
                        <TarefasAtrasadasTag n={atrasadas} />
                        <RenovacaoTag dias={diasRen} />
                        <InadimplenteTag status={c.statusPagamento} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Nicho</th>
                  <th className="text-left px-4 py-3 font-medium">Plano</th>
                  <th className="text-left px-4 py-3 font-medium">Etapa</th>
                  <th className="text-left px-4 py-3 font-medium">Saúde</th>
                  <th className="text-left px-4 py-3 font-medium">Sinais</th>
                  <th className="text-left px-4 py-3 font-medium">Renovação</th>
                  <th className="text-left px-4 py-3 font-medium">Resp.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrados.map(({ c, saude, atrasadas, diasRen }) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelecionado(c.id)}
                    className={
                      "hover:bg-accent/40 cursor-pointer " +
                      (selecionado === c.id ? "bg-accent/40" : "")
                    }
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/clientes/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.nicho}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.plano}</td>
                    <td className="px-4 py-3"><EtapaBadge etapa={c.etapaFunil} /></td>
                    <td className="px-4 py-3">
                      <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <TarefasAtrasadasTag n={atrasadas} />
                        <InadimplenteTag status={c.statusPagamento} />
                        <RenovacaoTag dias={diasRen} />
                        {!atrasadas && c.statusPagamento === "Em dia" && (diasRen > 60 || diasRen < 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtData(c.dataRenovacao)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.responsavel}</td>
                  </tr>
                ))}
                {!filtrados.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum cliente com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {novoAberto && (
        <NovoClienteDialog
          onClose={() => setNovoAberto(false)}
          onSave={(dados) => {
            const id = addCliente(dados);
            setNovoAberto(false);
            toast.success("Cliente cadastrado");
            nav({ to: "/clientes/$id", params: { id } });
          }}
        />
      )}

      {rowSelecionada && (
        <HealthDrawer
          row={rowSelecionada}
          tarefas={tarefas}
          onClose={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}

function HealthDrawer({
  row,
  tarefas,
  onClose,
}: {
  row: Row;
  tarefas: import("@/lib/cs-types").Tarefa[];
  onClose: () => void;
}) {
  const { c, saude, atrasadas, diasRen } = row;
  const tarefasCli = tarefas
    .filter((t) => t.clienteId === c.id && t.status !== "Concluída")
    .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime());
  const proxTarefa = tarefasCli[0];
  const rc = resumoCampanha(c);
  const rv = resumoVendas(c);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l shadow-xl flex flex-col">
        <header className="flex items-start justify-between gap-3 border-b p-5">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Visão rápida
            </div>
            <h2 className="text-lg font-semibold truncate">{c.nome}</h2>
            <div className="text-xs text-muted-foreground">
              {c.nicho} · Plano {c.plano} · {c.responsavel}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <SaudeBadge saude={saude.saude} overridden={saude.overridden} label={`Geral: ${saude.saude}`} />
            </div>
            <HealthBreakdownCharts cliente={c} saude={saude} tarefas={tarefas} />
          </section>

          <section>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Sinais
            </div>
            <div className="flex flex-wrap gap-1.5">
              <TarefasAtrasadasTag n={atrasadas} />
              <InadimplenteTag status={c.statusPagamento} />
              <RenovacaoTag dias={diasRen} />
              <EtapaBadge etapa={c.etapaFunil} />
              {!atrasadas && c.statusPagamento === "Em dia" && (diasRen > 60 || diasRen < 0) && (
                <span className="text-xs text-muted-foreground">Sem sinais de alerta.</span>
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <QuickBox label="Próxima entrega" value={proxTarefa ? fmtData(proxTarefa.prazo) : "—"} sub={proxTarefa ? proxTarefa.titulo : `${tarefasCli.length} tarefa(s) abertas`} />
            <QuickBox label="Renovação de contrato" value={fmtData(c.dataRenovacao)} sub={diasRen >= 0 ? `em ${diasRen} dias` : `venceu há ${-diasRen}d`} />
          </div>

          <section>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Campanha (Meta Ads)</div>
            <div className="grid grid-cols-3 gap-2">
              <Mini label="CPL" value={rc.cplMedio ? fmtBRL(rc.cplMedio) : "—"} />
              <Mini label="Leads" value={rc.leadsTotal.toString()} />
              <Mini label="CTR" value={`${rc.ctrMedio.toFixed(1)}%`} />
            </div>
          </section>

          <section>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Vendas do cliente</div>
            <div className="grid grid-cols-3 gap-2">
              <Mini label="Receita" value={fmtBRL(rv.receitaTotal)} />
              <Mini label="ROAS" value={`${rv.roas.toFixed(1)}x`} />
              <Mini label="Contratos" value={rv.fechadosTotal.toString()} />
            </div>
          </section>

          <section>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Próximo passo
            </div>
            <p className="text-sm">{c.proximoPasso}</p>
          </section>
        </div>

        <footer className="border-t p-4">
          <Link
            to="/clientes/$id"
            params={{ id: c.id }}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Abrir ficha completa <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </aside>
    </>
  );
}

function QuickBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
      {sub && <div className="truncate text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function NovoClienteDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: {
    nome: string;
    nicho: Nicho;
    plano: Plano;
    responsavel: string;
    dataInicio: string;
    dataRenovacao: string;
    etapaFunil: Etapa;
  }) => void;
}) {
  const [nome, setNome] = useState("");
  const [nicho, setNicho] = useState<Nicho>("Banda");
  const [plano, setPlano] = useState<Plano>("Essencial");
  const [responsavel, setResponsavel] = useState(RESPONSAVEIS[0]);
  const hoje = new Date().toISOString().slice(0, 10);
  const em1ano = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataRenovacao, setDataRenovacao] = useState(em1ano);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
         onClick={onClose}>
      <div
        className="bg-card rounded-lg border shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Novo cliente</h2>
        <p className="text-xs text-muted-foreground mb-4">
          O contexto de marca é preenchido depois na ficha. A etapa inicial é Onboarding.
        </p>
        <div className="space-y-3">
          <Field label="Nome">
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              className="input" placeholder="Ex: Banda Nova Aurora" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nicho">
              <select value={nicho} onChange={(e) => setNicho(e.target.value as Nicho)}
                className="input">
                {nichos.map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Plano">
              <select value={plano} onChange={(e) => setPlano(e.target.value as Plano)}
                className="input">
                {(Object.keys(PLANO_MRR) as Plano[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Responsável">
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}
              className="input">
              {RESPONSAVEIS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de início">
              <input type="date" value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)} className="input" />
            </Field>
            <Field label="Data de renovação">
              <input type="date" value={dataRenovacao}
                onChange={(e) => setDataRenovacao(e.target.value)} className="input" />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            disabled={!nome.trim()}
            onClick={() =>
              onSave({
                nome: nome.trim(),
                nicho,
                plano,
                responsavel,
                dataInicio: new Date(dataInicio).toISOString(),
                dataRenovacao: new Date(dataRenovacao).toISOString(),
                etapaFunil: "Onboarding",
              })
            }
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Criar cliente
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
