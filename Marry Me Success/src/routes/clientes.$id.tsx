import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Sliders,
  X,
  ChevronDown,
  ChevronRight,
  CalendarPlus,
  CalendarClock,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useCS, mrrDoCliente, diasAte, semanasSemContato } from "@/lib/cs-store";
import {
  ETAPAS,
  SAUDES,
  type Confianca,
  type Saude,
  type Etapa,
  type TarefaTipo,
  TAREFA_TIPOS,
  RESPONSAVEIS,
} from "@/lib/cs-types";
import {
  SaudeBadge,
  PagamentoBadge,
  EtapaBadge,
  ConfiancaBadge,
  fmtBRL,
  fmtData,
} from "@/components/cs/badges";
import type { OnbItem } from "@/lib/cs-onboarding";
import { HealthBreakdownCharts } from "@/components/cs/HealthBreakdown";
import { InsightsPanel } from "@/components/cs/InsightsPanel";
import { TarefaRow, TarefaRowHeader, useToggleTarefa } from "@/components/cs/tarefas-ui";
import { AgendarDialog, fmtDataHora, ReuniaoLocalIcon } from "@/components/cs/agenda-ui";
import {
  gerarInsights,
  gerarRecomendacoes,
  resumoCampanha,
  resumoVendas,
} from "@/lib/cs-insights";

export const Route = createFileRoute("/clientes/$id")({
  component: FichaPage,
});

function FichaPage() {
  const { id } = Route.useParams();
  const {
    getCliente,
    updateCliente,
    setEtapa,
    setConfianca,
    addReuniao,
    setSaudeOverride,
    clearSaudeOverride,
    calcSaudeCliente,
    tarefasDoCliente,
    tarefas,
    clientes,
    addTarefa,
    agendamentosDoCliente,
    proximoAgendamento,
    addAgendamento,
    updateAgendamento,
    removeAgendamento,
    itensOnboarding,
    setClienteOnboarding,
  } = useCS();
  const toggle = useToggleTarefa();
  const nav = useNavigate();
  const cliente = getCliente(id);
  const [overrideAberto, setOverrideAberto] = useState(false);
  const [novaReuniao, setNovaReuniao] = useState("");
  const [novaTarefaAberta, setNovaTarefaAberta] = useState(false);
  const [contextoAberto, setContextoAberto] = useState(false);
  const [agendarAberto, setAgendarAberto] = useState(false);
  const [fRespTarefa, setFRespTarefa] = useState("Todos");
  const [fPrazoTarefa, setFPrazoTarefa] = useState("Todos");
  const [novoOnbItem, setNovoOnbItem] = useState("");

  if (!cliente) {
    return (
      <div className="p-10">
        <p className="text-sm">Cliente não encontrado.</p>
        <Link to="/clientes" className="text-primary text-sm underline">Voltar</Link>
      </div>
    );
  }

  const saude = calcSaudeCliente(cliente);
  const mrr = mrrDoCliente(cliente);
  const semanas = semanasSemContato(cliente);
  const diasRen = diasAte(cliente.dataRenovacao);
  const tarefasCli = tarefasDoCliente(cliente.id);
  const tarefasFiltradas = tarefasCli.filter((t) => {
    if (fRespTarefa !== "Todos" && t.responsavel !== fRespTarefa) return false;
    if (fPrazoTarefa !== "Todos") {
      const diff = Math.ceil((new Date(t.prazo).getTime() - Date.now()) / 86400000);
      const hoje = new Date(t.prazo).toDateString() === new Date().toDateString();
      const bucket =
        t.status === "Concluída" ? "Depois" : diff < 0 ? "Atrasadas" : hoje ? "Hoje" : diff <= 7 ? "Esta semana" : "Depois";
      if (bucket !== fPrazoTarefa) return false;
    }
    return true;
  });
  const insights = useMemo(() => gerarInsights(cliente, tarefas), [cliente, tarefas]);
  const recomendacoes = useMemo(() => gerarRecomendacoes(cliente, tarefas), [cliente, tarefas]);
  const rc = useMemo(() => resumoCampanha(cliente), [cliente]);
  const rv = useMemo(() => resumoVendas(cliente), [cliente]);
  const ags = agendamentosDoCliente(cliente.id);
  const proxima = proximoAgendamento(cliente.id);

  const kpis = useMemo(() => {
    const m = cliente.metricasCampanha;
    const v = cliente.vendasCliente;
    const cpl = m.length ? m.reduce((s, x) => s + x.cpl, 0) / m.length : 0;
    const leadsSem = m.length ? m.reduce((s, x) => s + x.leads, 0) / m.length : 0;
    const fechSem = v.length ? v.reduce((s, x) => s + x.fechados, 0) / v.length : 0;
    const totalFech = v.reduce((s, x) => s + x.fechados, 0);
    const totalRec = v.reduce((s, x) => s + x.receita, 0);
    const ticket = totalFech ? totalRec / totalFech : 0;
    const conv = leadsSem && v.length ? (fechSem / leadsSem) * 100 : 0;
    return { cpl, leadsSem, fechSem, ticket, totalRec, conv };
  }, [cliente]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
      <button
        onClick={() => nav({ to: "/clientes" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
      </button>

      {/* ---------------- HEADER ---------------- */}
      <header className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-semibold">
                {cliente.nome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold">{cliente.nome}</h1>
                <div className="text-sm text-muted-foreground">
                  {cliente.nicho} · Plano {cliente.plano} · Responsável {cliente.responsavel}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SaudeBadge saude={saude.saude} overridden={saude.overridden} />
              <PagamentoBadge status={cliente.statusPagamento} dias={cliente.diasAtraso} />
              <EtapaBadge etapa={cliente.etapaFunil} />
              {cliente.etapaFunil === "Janela de Renovação" && (
                <ConfiancaBadge c={cliente.confiancaFechamento} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right">
            <MetaItem label="MRR" value={fmtBRL(mrr)} />
            <MetaItem label="Início" value={fmtData(cliente.dataInicio)} />
            <MetaItem
              label="Renovação"
              value={fmtData(cliente.dataRenovacao)}
              hint={diasRen >= 0 ? `em ${diasRen}d` : `venceu há ${-diasRen}d`}
            />
          </div>
        </div>

        {cliente.etapaFunil === "Onboarding" ? (
          <div className="mt-5 rounded-md border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            Cliente em <span className="font-medium text-foreground">Onboarding</span> — métricas de campanha e vendas aparecem após a ativação da conta.
          </div>
        ) : (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
          <Kpi label="CPL médio" value={kpis.cpl ? fmtBRL(kpis.cpl) : "—"} sub="Meta Ads (8 sem.)" />
          <Kpi label="Leads/sem (campanha)" value={kpis.leadsSem ? kpis.leadsSem.toFixed(1) : "—"} sub="média das últimas 8 sem." />
          <Kpi label="Contratos/sem (cliente)" value={kpis.fechSem ? kpis.fechSem.toFixed(1) : "—"} sub={`Conversão lead→fechado ${kpis.conv.toFixed(1)}%`} />
          <Kpi label="Ticket médio" value={kpis.ticket ? fmtBRL(kpis.ticket) : "—"} sub={`Receita total ${fmtBRL(kpis.totalRec)}`} />
        </div>
        )}
      </header>

      {/* ---------------- ETAPA + AJUSTE MANUAL ---------------- */}
      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Etapa do funil</h3>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {ETAPAS.map((e) => {
            const idx = ETAPAS.indexOf(cliente.etapaFunil);
            const passou = ETAPAS.indexOf(e) <= idx;
            const atual = e === cliente.etapaFunil;
            return (
              <div
                key={e}
                className={
                  "px-2.5 py-1 rounded-md text-xs " +
                  (atual
                    ? "bg-primary text-primary-foreground font-semibold"
                    : passou
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                {e}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Alterar etapa</label>
            <select
              value={cliente.etapaFunil}
              onChange={(e) => {
                setEtapa(cliente.id, e.target.value as Etapa);
                toast.success("Etapa atualizada");
              }}
              className="input mt-1"
            >
              {ETAPAS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          {cliente.etapaFunil === "Janela de Renovação" && (
            <div>
              <label className="text-xs text-muted-foreground">Confiança de renovação</label>
              <select
                value={cliente.confiancaFechamento || ""}
                onChange={(e) => {
                  setConfianca(cliente.id, e.target.value as Confianca);
                  toast.success("Confiança atualizada");
                }}
                className="input mt-1"
              >
                <option value="">Selecionar…</option>
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- ONBOARDING (só na etapa Onboarding) ---------------- */}
      {cliente.etapaFunil === "Onboarding" && (() => {
        const itens = itensOnboarding(cliente);
        const total = itens.length;
        const feitos = itens.filter((i) => i.done).length;
        const completo = total > 0 && feitos === total;
        const pct = total ? Math.round((feitos / total) * 100) : 0;
        const toggle = (id: string) => setClienteOnboarding(cliente.id, itens.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
        const remover = (id: string) => setClienteOnboarding(cliente.id, itens.filter((i) => i.id !== id));
        const adicionar = () => {
          if (!novoOnbItem.trim()) return;
          setClienteOnboarding(cliente.id, [...itens, { id: `o${Date.now()}`, label: novoOnbItem.trim(), done: false }]);
          setNovoOnbItem("");
        };
        return (
          <section className="rounded-lg border border-primary/30 bg-primary/5 p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Onboarding · progresso da etapa</h3>
                <p className="text-xs text-muted-foreground">Checklist pré-selecionada pelo plano {cliente.plano} · {feitos}/{total} concluídos</p>
              </div>
              <button
                disabled={!completo}
                onClick={() => { setEtapa(cliente.id, "Estruturação"); toast.success("Onboarding concluído — avançou para Estruturação"); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {completo ? "Concluir e avançar" : `Faltam ${total - feitos}`}
              </button>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={"h-full rounded-full " + (completo ? "bg-saude-saudavel" : "bg-primary")} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold">{pct}%</span>
            </div>
            <ul className="space-y-1.5">
              {itens.map((item) => (
                <li key={item.id} className={"flex items-center gap-2.5 rounded-md border p-2.5 " + (item.done ? "border-saude-saudavel/40 bg-saude-saudavel/5" : "bg-card")}>
                  <button onClick={() => toggle(item.id)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                    <span className={"flex h-4 w-4 shrink-0 items-center justify-center rounded border " + (item.done ? "border-saude-saudavel bg-saude-saudavel text-white" : "border-input")}>
                      {item.done && <span className="text-[10px]">✓</span>}
                    </span>
                    <span className={"truncate text-sm " + (item.done ? "line-through text-muted-foreground" : "font-medium")}>{item.label}</span>
                  </button>
                  <button onClick={() => remover(item.id)} className="text-muted-foreground hover:text-saude-risco" aria-label="Remover tarefa"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
              {!itens.length && <li className="text-sm text-muted-foreground">Sem tarefas — adicione abaixo.</li>}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={novoOnbItem}
                onChange={(e) => setNovoOnbItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
                placeholder="Adicionar tarefa ao onboarding…"
                className="input"
              />
              <button onClick={adicionar} className="inline-flex items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-accent"><Plus className="h-4 w-4" /></button>
            </div>
          </section>
        );
      })()}

      {/* Blocos de dados (saúde/campanha/vendas) só fora do onboarding — cliente novo ainda não tem histórico */}
      {cliente.etapaFunil !== "Onboarding" && (
      <>
      {/* ---------------- SAÚDE + INSIGHTS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Saúde por dimensão</h3>
            <button
              onClick={() => setOverrideAberto(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sliders className="h-3 w-3" /> Ajustar manualmente
            </button>
          </div>
          <HealthBreakdownCharts cliente={cliente} saude={saude} tarefas={tarefas} />
          {saude.overridden && (
            <button
              onClick={() => {
                clearSaudeOverride(cliente.id);
                toast.success("Override removido");
              }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Voltar ao cálculo automático
            </button>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">
            Insights para a reunião semanal
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              · gerados do cruzamento campanha × vendas × entregas
            </span>
          </h3>
          <InsightsPanel insights={insights} />
        </section>
      </div>

      {/* ---------------- CAMPANHAS ---------------- */}
      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Campanhas — Meta Ads (últimas 8 semanas)</h3>
        {cliente.metricasCampanha.length ? (
          <>
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label="Investimento total" value={fmtBRL(rc.gastoTotal)} />
              <MiniStat label="Leads gerados" value={rc.leadsTotal.toLocaleString("pt-BR")} />
              <MiniStat
                label="CPL real"
                value={fmtBRL(rc.cplMedio)}
                delta={rc.deltaCplPct}
                deltaBom="baixo"
              />
              <MiniStat
                label="CTR médio"
                value={`${rc.ctrMedio.toFixed(2)}%`}
                delta={rc.deltaLeadsPct}
                deltaLabel="leads"
                deltaBom="alto"
              />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cliente.metricasCampanha}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semana" fontSize={11} />
                  <YAxis yAxisId="l" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area yAxisId="l" type="monotone" dataKey="gasto" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.1} name="Investimento (R$)" />
                  <Line yAxisId="l" type="monotone" dataKey="cpl" stroke="var(--primary)" name="CPL (R$)" strokeWidth={2} />
                  <Line yAxisId="r" type="monotone" dataKey="leads" stroke="var(--saude-saudavel)" name="Leads" strokeWidth={2} />
                  <Line yAxisId="r" type="monotone" dataKey="ctr" stroke="var(--gold)" name="CTR %" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados de campanha ainda.</p>
        )}
      </section>

      {/* ---------------- VENDAS DO CLIENTE ---------------- */}
      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold">
          Vendas do cliente
          <span className="text-muted-foreground font-normal ml-2 text-xs">
            · funil comercial dele (não confundir com nossa renovação)
          </span>
        </h3>
        {cliente.vendasCliente.length ? (
          <>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniStat label="Receita gerada" value={fmtBRL(rv.receitaTotal)} />
            <MiniStat label="ROAS (mídia)" value={`${rv.roas.toFixed(1)}x`} hint="receita ÷ investimento" />
            <MiniStat label="Contratos" value={rv.fechadosTotal.toString()} hint={`ticket ${fmtBRL(rv.ticketMedio)}`} />
            <MiniStat label="Conversão lead→contrato" value={`${rv.conversao.toFixed(1)}%`} />
            <MiniStat label="CAC (mídia)" value={rv.cac ? fmtBRL(rv.cac) : "—"} hint="custo por contrato" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            <div className="h-64">
              <div className="text-xs text-muted-foreground mb-1">Contratos fechados & receita</div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cliente.vendasCliente}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semana" fontSize={11} />
                  <YAxis yAxisId="l" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="l" dataKey="fechados" fill="var(--gold)" name="Contratos" />
                  <Area yAxisId="r" type="monotone" dataKey="receita" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} name="Receita (R$)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <div className="text-xs text-muted-foreground mb-1">Funil semanal — leads → reuniões → propostas → fechados</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cliente.vendasCliente}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semana" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="leads" fill="var(--chart-2)" name="Leads" />
                  <Bar dataKey="reunioes" fill="var(--chart-3)" name="Reuniões" />
                  <Bar dataKey="propostas" fill="var(--chart-4)" name="Propostas" />
                  <Bar dataKey="fechados" fill="var(--saude-saudavel)" name="Fechados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            O cliente ainda não reportou vendas.
          </p>
        )}
      </section>

      {/* ---------------- RECOMENDAÇÕES DE MELHORIA ---------------- */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold">Recomendações de melhoria</h3>
          <span className="text-xs text-muted-foreground">
            · próximos passos para escalar resultados da conta
          </span>
        </div>
        {recomendacoes.length ? (
          <InsightsPanel insights={recomendacoes} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem recomendações no momento — a conta está saudável e sem gargalos claros.
          </p>
        )}
      </section>

      </>
      )}

      {/* ---------------- TAREFAS + REUNIÕES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Tarefas do cliente
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                · {tarefasFiltradas.length}/{tarefasCli.length} · ClickUp (mock)
              </span>
            </h3>
            <button
              onClick={() => setNovaTarefaAberta(true)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <Plus className="h-3 w-3" /> Nova
            </button>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              Responsável:
              <select value={fRespTarefa} onChange={(e) => setFRespTarefa(e.target.value)} className="rounded-md border bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring">
                {["Todos", ...RESPONSAVEIS].map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              Prazo:
              <select value={fPrazoTarefa} onChange={(e) => setFPrazoTarefa(e.target.value)} className="rounded-md border bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring">
                {["Todos", "Atrasadas", "Hoje", "Esta semana", "Depois"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>
          {tarefasFiltradas.length ? (
            <div className="rounded-md border overflow-hidden">
              <TarefaRowHeader />
              {tarefasFiltradas.map((t) => (
                <TarefaRow key={t.id} t={t} onToggle={() => toggle(t)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa com esses filtros.</p>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Reuniões
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                · última há {semanas} sem.
              </span>
            </h3>
            <button
              onClick={() => setAgendarAberto(true)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <CalendarPlus className="h-3 w-3" /> Agendar
            </button>
          </div>

          {/* Próximas reuniões agendadas */}
          {ags.filter((a) => a.status === "Agendada").length ? (
            <div className="mb-4 space-y-2">
              {ags
                .filter((a) => a.status === "Agendada")
                .map((a) => (
                  <div
                    key={a.id}
                    className="rounded-md border border-primary/30 bg-primary/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {fmtDataHora(a.data)} · {a.duracaoMin}min
                        </div>
                        <div className="mt-1 text-sm font-medium truncate">{a.titulo}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <ReuniaoLocalIcon local={a.local} /> {a.local}
                          </span>
                          · {a.tipo} · {a.responsavel}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            updateAgendamento(a.id, { status: "Realizada" });
                            addReuniao(cliente.id, `${a.titulo} (${a.tipo})`);
                            toast.success("Reunião marcada como realizada");
                          }}
                          className="rounded border px-2 py-1 text-[11px] hover:bg-accent"
                        >
                          Realizada
                        </button>
                        <button
                          onClick={() => {
                            removeAgendamento(a.id);
                            toast.success("Agendamento removido");
                          }}
                          className="text-muted-foreground hover:text-saude-risco"
                          aria-label="Remover agendamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mb-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Nenhuma reunião agendada.{" "}
              <button onClick={() => setAgendarAberto(true)} className="text-primary hover:underline">
                Agendar agora
              </button>
            </div>
          )}

          {/* Histórico */}
          <div className="text-xs font-semibold text-muted-foreground mb-2">Histórico</div>
          <div className="flex gap-2 mb-3">
            <input
              value={novaReuniao}
              onChange={(e) => setNovaReuniao(e.target.value)}
              placeholder="Registrar resumo de reunião realizada..."
              className="input"
            />
            <button
              disabled={!novaReuniao.trim()}
              onClick={() => {
                addReuniao(cliente.id, novaReuniao.trim());
                setNovaReuniao("");
                toast.success("Reunião registrada");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-3 max-h-60 overflow-y-auto">
            {cliente.reunioes.map((r) => (
              <li key={r.id} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                <div className="text-xs text-muted-foreground w-24 shrink-0">
                  {fmtData(r.data)}
                </div>
                <div className="text-sm">{r.resumo}</div>
              </li>
            ))}
            {!cliente.reunioes.length && (
              <li className="text-sm text-muted-foreground">Nenhuma reunião no histórico.</li>
            )}
          </ul>
        </section>
      </div>

      {/* ---------------- PRÓXIMO PASSO ---------------- */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Próximo passo</h3>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <textarea
          value={cliente.proximoPasso}
          onChange={(e) => updateCliente(cliente.id, { proximoPasso: e.target.value })}
          rows={2}
          className="input resize-none"
        />
      </section>

      {/* ---------------- CONTEXTO DE MARCA (acordeão) ---------------- */}
      <section className="rounded-lg border bg-card">
        <button
          onClick={() => setContextoAberto((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/40"
        >
          <div>
            <div className="text-sm font-semibold">Contexto de marca</div>
            <div className="text-xs text-muted-foreground">
              Alimenta as Ferramentas (Copy, Roteiros e Reunião de Resultados).
            </div>
          </div>
          {contextoAberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {contextoAberto && (
          <div className="border-t p-5 space-y-4">
            <ContextoField
              label="Público-alvo"
              value={cliente.contextoMarca.publicoAlvo}
              onChange={(v) => updateCliente(cliente.id, { contextoMarca: { ...cliente.contextoMarca, publicoAlvo: v } })}
            />
            <ContextoField
              label="Tom de voz e posicionamento"
              value={cliente.contextoMarca.tomDeVoz}
              onChange={(v) => updateCliente(cliente.id, { contextoMarca: { ...cliente.contextoMarca, tomDeVoz: v } })}
            />
            <ContextoField
              label="Diferenciais de portfólio"
              value={cliente.contextoMarca.diferenciais}
              onChange={(v) => updateCliente(cliente.id, { contextoMarca: { ...cliente.contextoMarca, diferenciais: v } })}
            />
            <ContextoField
              label="Sazonalidade do nicho"
              value={cliente.contextoMarca.sazonalidade}
              onChange={(v) => updateCliente(cliente.id, { contextoMarca: { ...cliente.contextoMarca, sazonalidade: v } })}
            />
          </div>
        )}
      </section>

      {overrideAberto && (
        <OverrideDialog
          onClose={() => setOverrideAberto(false)}
          onSave={(s, j) => {
            setSaudeOverride(cliente.id, s, j);
            setOverrideAberto(false);
            toast.success("Saúde ajustada manualmente");
          }}
        />
      )}

      {novaTarefaAberta && (
        <NovaTarefaDialog
          responsavelPadrao={cliente.responsavel}
          onClose={() => setNovaTarefaAberta(false)}
          onSave={(t) => {
            addTarefa({ ...t, clienteId: cliente.id, origem: "manual" });
            setNovaTarefaAberta(false);
            toast.success("Tarefa criada");
          }}
        />
      )}

      {agendarAberto && (
        <AgendarDialog
          clientes={clientes}
          clienteIdFixo={cliente.id}
          responsavelPadrao={cliente.responsavel}
          onClose={() => setAgendarAberto(false)}
          onSave={(a) => {
            addAgendamento(a);
            setAgendarAberto(false);
            toast.success("Reunião agendada");
          }}
        />
      )}
    </div>
  );
}

function MetaItem({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ContextoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="input mt-1 resize-none"
      />
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** Cartão compacto de métrica, com delta opcional (verde/vermelho conforme direção desejada). */
function MiniStat({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  deltaBom,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
  deltaBom?: "alto" | "baixo";
}) {
  const temDelta = typeof delta === "number" && Math.abs(delta) >= 1;
  const subiu = (delta ?? 0) > 0;
  const bom = deltaBom === "baixo" ? !subiu : subiu;
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
      {temDelta ? (
        <div className={"text-[11px] font-medium " + (bom ? "text-saude-saudavel" : "text-saude-risco")}>
          {subiu ? "▲" : "▼"} {Math.abs(delta as number).toFixed(0)}% {deltaLabel ?? ""}
        </div>
      ) : (
        hint && <div className="text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function OverrideDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Saude, justificativa: string) => void;
}) {
  const [saude, setSaude] = useState<Saude>("Atenção");
  const [just, setJust] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg border shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ajustar saúde manualmente</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Use enquanto o cálculo automático está sendo calibrado. Sempre justifique.
        </p>
        <label className="text-xs font-medium text-muted-foreground">Nível</label>
        <select value={saude} onChange={(e) => setSaude(e.target.value as Saude)}
          className="input mt-1 mb-3">
          {SAUDES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="text-xs font-medium text-muted-foreground">Justificativa</label>
        <textarea rows={3} value={just} onChange={(e) => setJust(e.target.value)}
          className="input mt-1 resize-none" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="rounded-md border px-3 py-2 text-sm">
            Cancelar
          </button>
          <button
            disabled={!just.trim()}
            onClick={() => onSave(saude, just.trim())}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Salvar override
          </button>
        </div>
      </div>
    </div>
  );
}

function NovaTarefaDialog({
  responsavelPadrao,
  onClose,
  onSave,
}: {
  responsavelPadrao: string;
  onClose: () => void;
  onSave: (t: {
    titulo: string;
    responsavel: string;
    prazo: string;
    status: "Pendente" | "Em andamento" | "Concluída";
    tipo: TarefaTipo;
  }) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [responsavel, setResponsavel] = useState(responsavelPadrao);
  const em3d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const [prazo, setPrazo] = useState(em3d);
  const [tipo, setTipo] = useState<TarefaTipo>("Follow-up");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-card rounded-lg border shadow-lg w-full max-w-md p-6"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nova tarefa</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className="input mt-1" placeholder="Ex: Revisar criativo semanal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}
                className="input mt-1">
                {RESPONSAVEIS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TarefaTipo)}
                className="input mt-1">
                {TAREFA_TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prazo</label>
            <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)}
              className="input mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            disabled={!titulo.trim()}
            onClick={() => onSave({
              titulo: titulo.trim(),
              responsavel,
              prazo: new Date(prazo).toISOString(),
              status: "Pendente",
              tipo,
            })}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Criar tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
