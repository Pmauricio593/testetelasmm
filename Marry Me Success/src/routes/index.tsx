import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp, Wallet, HeartHandshake, CalendarRange, AlertTriangle, ArrowRight, Flame, Target,
} from "lucide-react";
import { useCS, mrrDoCliente, diasAte, semanasSemContato, statusTarefaEfetivo } from "@/lib/cs-store";
import { SaudeBadge, InadimplenteTag, fmtBRL, fmtData } from "@/components/cs/badges";
import { RESUMO_VENDAS, NEGOCIACOES, FECHAMENTOS_MES } from "@/lib/cs-vendas";
import { RECEBIMENTOS, CONTAS_PAGAR, somaValor } from "@/lib/cs-financeiro";
import { PLANOS, CENARIOS, mesAtualPlano, fmtBRLm } from "@/lib/cs-planejamento";
import type { Saude } from "@/lib/cs-types";

export const Route = createFileRoute("/")({ component: Home });

const NIVEL: Record<Saude, number> = { Saudável: 100, Atenção: 70, Risco: 40, Crítico: 15 };

function Home() {
  const { clientes, tarefas, calcSaudeCliente, hasPermissao, usuarioAtual } = useCS();

  const dados = useMemo(() => {
    const ativos = clientes.filter((c) => c.etapaFunil !== "Encerrado/Churn").map((c) => ({ c, saude: calcSaudeCliente(c), mrr: mrrDoCliente(c), diasRen: diasAte(c.dataRenovacao), semanas: semanasSemContato(c) }));
    const mrrTotal = ativos.reduce((s, e) => s + e.mrr, 0);
    const emRisco = ativos.filter((e) => e.saude.saude === "Risco" || e.saude.saude === "Crítico");
    const renov30 = ativos.filter((e) => e.diasRen >= 0 && e.diasRen <= 30);
    const healthMedio = ativos.length ? Math.round(ativos.reduce((s, e) => s + NIVEL[e.saude.saude], 0) / ativos.length) : 0;
    const atrasadas = tarefas.filter((t) => statusTarefaEfetivo(t) === "Atrasada").length;
    return { ativos, mrrTotal, emRisco, renov30, healthMedio, atrasadas };
  }, [clientes, tarefas, calcSaudeCliente]);

  const planoMeta = PLANOS.META;
  const mesPlano = mesAtualPlano(planoMeta);
  const cenMeta = CENARIOS.find((c) => c.id === "META")!;
  const arrRunRate = dados.mrrTotal * 12;

  const metaMes = mesPlano.metaNovoMRR;
  const realizadoMes = FECHAMENTOS_MES[FECHAMENTOS_MES.length - 1]?.mrr ?? 0;
  const leadsQuentes = NEGOCIACOES.filter((n) => n.temperatura === "Quente" && n.etapa !== "Ganho" && n.etapa !== "Perdido").length;

  const receberJul = somaValor(RECEBIMENTOS.filter((r) => r.mes === "Julho"));
  const recebido = somaValor(RECEBIMENTOS.filter((r) => r.mes === "Julho" && r.status === "Quitado"));
  const aPagar = somaValor(CONTAS_PAGAR);
  const resultado = receberJul - aPagar;

  const verVendas = hasPermissao("vendas");
  const verFin = hasPermissao("financeiro");
  const verPlano = hasPermissao("planejamento");

  const precisaAtencao = dados.ativos
    .filter((e) => e.c.statusPagamento === "Em atraso" || e.semanas > 2 || (e.diasRen >= 0 && e.diasRen <= 30) || e.saude.saude === "Crítico")
    .sort((a, b) => (a.saude.saude === "Crítico" ? 0 : 1) - (b.saude.saude === "Crítico" ? 0 : 1))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral · Marry Me</h1>
        <p className="text-sm text-muted-foreground">Olá, {usuarioAtual.nome} — panorama da empresa hoje</p>
      </header>

      {/* KPIs macro */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="ARR run-rate" value={fmtBRLm(arrRunRate)} hint={`MRR ${fmtBRL(dados.mrrTotal)}`} icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi label="Clientes ativos" value={dados.ativos.length.toString()} hint={`health médio ${dados.healthMedio}`} icon={<HeartHandshake className="h-4 w-4" />} />
        {verFin ? (
          <Kpi label="Resultado do mês" value={fmtBRL(resultado)} hint={resultado >= 0 ? "superávit" : "déficit"} tom={resultado >= 0 ? "ok" : "risco"} icon={<Wallet className="h-4 w-4" />} />
        ) : (
          <Kpi label="MRR em risco" value={fmtBRL(dados.emRisco.reduce((s, e) => s + e.mrr, 0))} hint={`${dados.emRisco.length} clientes`} tom="risco" icon={<AlertTriangle className="h-4 w-4" />} />
        )}
        {verPlano ? (
          <Kpi label={`Meta ARR ${cenMeta.nome}`} value={fmtBRLm(cenMeta.alvoARR)} hint={`${Math.round((arrRunRate / cenMeta.alvoARR) * 100)}% atingido`} icon={<Target className="h-4 w-4" />} />
        ) : (
          <Kpi label="Renovações em 30d" value={dados.renov30.length.toString()} hint={fmtBRL(dados.renov30.reduce((s, e) => s + e.mrr, 0)) + " em jogo"} icon={<CalendarRange className="h-4 w-4" />} />
        )}
      </section>

      {/* Cards por área */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {verVendas && (
          <AreaCard title="Comercial" to="/vendas/metas" icon={<TrendingUp className="h-4 w-4" />}>
            <Progress label={`Meta do mês (${mesPlano.mes})`} atual={realizadoMes} meta={metaMes} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Mini label="Pipeline ativo" value={fmtBRL(RESUMO_VENDAS.mrrPipeline)} />
              <Mini label="Leads quentes" value={leadsQuentes.toString()} icon={<Flame className="h-3.5 w-3.5 text-saude-risco" />} />
              <Mini label="MRR fechado" value={fmtBRL(RESUMO_VENDAS.mrrFechado)} />
              <Mini label="Conversão" value={`${RESUMO_VENDAS.taxaConversao}%`} />
            </div>
          </AreaCard>
        )}

        {verFin && (
          <AreaCard title="Financeiro · Julho" to="/financeiro/visao-geral" icon={<Wallet className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Mini label="A receber" value={fmtBRL(receberJul)} />
              <Mini label="Recebido" value={fmtBRL(recebido)} />
              <Mini label="A pagar" value={fmtBRL(aPagar)} />
              <Mini label="Resultado" value={fmtBRL(resultado)} />
            </div>
            <div className="mt-3">
              <Progress label="Saídas × entradas" atual={aPagar} meta={receberJul} invert />
            </div>
          </AreaCard>
        )}

        <AreaCard title="Customer Success" to="/health-score" icon={<HeartHandshake className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Mini label="Health médio" value={`${dados.healthMedio}/100`} />
            <Mini label="Em risco" value={dados.emRisco.length.toString()} />
            <Mini label="Renovações 30d" value={dados.renov30.length.toString()} />
            <Mini label="Tarefas atrasadas" value={dados.atrasadas.toString()} />
          </div>
        </AreaCard>

        {verPlano && (
          <AreaCard title="Planejamento anual" to="/planejamento" icon={<Target className="h-4 w-4" />}>
            <Progress label={`Rumo a ${cenMeta.alvo}`} atual={arrRunRate} meta={cenMeta.alvoARR} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Mini label="ARR hoje" value={fmtBRLm(arrRunRate)} />
              <Mini label="Alvo Dez" value={fmtBRLm(cenMeta.alvoARR)} />
              <Mini label="Clientes Dez" value={cenMeta.clientesFinal.toString()} />
              <Mini label="Novos este mês" value={mesPlano.novos.toString()} />
            </div>
          </AreaCard>
        )}
      </div>

      {/* Precisa de atenção hoje */}
      <section className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-saude-risco" />
          <h2 className="text-sm font-semibold">Precisa de atenção hoje</h2>
          <span className="text-xs text-muted-foreground">· {precisaAtencao.length} clientes</span>
        </div>
        <ul className="divide-y">
          {precisaAtencao.map((e) => {
            const motivos: string[] = [];
            if (e.c.statusPagamento === "Em atraso") motivos.push("Pagamento em atraso");
            if (e.semanas > 2) motivos.push(`Sem contato há ${e.semanas} sem.`);
            if (e.diasRen >= 0 && e.diasRen <= 30) motivos.push(`Renova em ${e.diasRen}d`);
            if (e.saude.saude === "Crítico") motivos.push("Saúde crítica");
            return (
              <li key={e.c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{e.c.nome}</span>
                    <SaudeBadge saude={e.saude.saude} overridden={e.saude.overridden} />
                    <InadimplenteTag status={e.c.statusPagamento} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{motivos.join(" · ") || e.c.proximoPasso}</div>
                </div>
                <div className="hidden text-xs text-muted-foreground md:block">Renova {fmtData(e.c.dataRenovacao)}</div>
                <Link to="/clientes/$id" params={{ id: e.c.id }} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">Abrir <ArrowRight className="h-3 w-3" /></Link>
              </li>
            );
          })}
          {!precisaAtencao.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum alerta no momento. 🎉</li>}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, tom, icon }: { label: string; value: string; hint?: string; tom?: "ok" | "risco"; icon?: React.ReactNode }) {
  const cor = tom === "ok" ? "text-saude-saudavel" : tom === "risco" ? "text-saude-risco" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className={"mt-2 text-2xl font-semibold " + cor}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AreaCard({ title, to, icon, children }: { title: string; to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-primary">{icon}</span>{title}</div>
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Abrir <ArrowRight className="h-3 w-3" /></Link>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center gap-1 text-sm font-semibold">{icon}{value}</div>
    </div>
  );
}

function Progress({ label, atual, meta, invert }: { label: string; atual: number; meta: number; invert?: boolean }) {
  const pct = meta ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
  const cor = invert ? (pct > 90 ? "bg-saude-risco" : "bg-primary") : pct >= 100 ? "bg-saude-saudavel" : "bg-primary";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium">{pct}%</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={"h-full rounded-full " + cor} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
