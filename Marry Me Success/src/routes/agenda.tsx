import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  ArrowRight,
  CalendarOff,
} from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import { RESPONSAVEIS, type Agendamento } from "@/lib/cs-types";
import {
  AgendarDialog,
  fmtHora,
  ReuniaoLocalIcon,
  StatusReuniaoBadge,
} from "@/components/cs/agenda-ui";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function AgendaPage() {
  const {
    clientes,
    agendamentos,
    getCliente,
    addAgendamento,
    updateAgendamento,
    removeAgendamento,
    proximoAgendamento,
  } = useCS();

  const hoje = new Date();
  const [refDate, setRefDate] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSel, setDiaSel] = useState<string>(localKey(hoje));
  const [fResp, setFResp] = useState<string>("Todos");
  const [agendarAberto, setAgendarAberto] = useState(false);
  const [clienteFixo, setClienteFixo] = useState<string | undefined>(undefined);

  const nomeCliente = (id: string) => getCliente(id)?.nome ?? id;

  const filtrados = useMemo(
    () => (fResp === "Todos" ? agendamentos : agendamentos.filter((a) => a.responsavel === fResp)),
    [agendamentos, fResp],
  );

  // Mapa data(local) -> agendamentos
  const porDia = useMemo(() => {
    const m = new Map<string, Agendamento[]>();
    for (const a of filtrados) {
      const k = localKey(new Date(a.data));
      const arr = m.get(k) ?? [];
      arr.push(a);
      m.set(k, arr);
    }
    for (const arr of m.values())
      arr.sort((x, y) => new Date(x.data).getTime() - new Date(y.data).getTime());
    return m;
  }, [filtrados]);

  // Células do calendário do mês exibido
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const celulas: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const doDiaSel = (porDia.get(diaSel) ?? []).slice();

  // KPIs
  const agora = Date.now();
  const futuras = filtrados.filter((a) => a.status === "Agendada" && new Date(a.data).getTime() >= agora);
  const hojeKey = localKey(hoje);
  const agHoje = futuras.filter((a) => localKey(new Date(a.data)) === hojeKey);
  const em7 = futuras.filter((a) => {
    const dd = (new Date(a.data).getTime() - agora) / 86400000;
    return dd >= 0 && dd <= 7;
  });
  const ativos = clientes.filter((c) => c.etapaFunil !== "Encerrado/Churn");
  const semReuniao = ativos.filter((c) => !proximoAgendamento(c.id));
  const realizadas30 = filtrados.filter(
    (a) => a.status === "Realizada" && (agora - new Date(a.data).getTime()) / 86400000 <= 30,
  );

  const abrirAgendar = (clienteId?: string) => {
    setClienteFixo(clienteId);
    setAgendarAberto(true);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Reuniões dos clientes · {futuras.length} agendada(s) · {semReuniao.length} cliente(s) sem reunião
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Responsável:
            <select
              value={fResp}
              onChange={(e) => setFResp(e.target.value)}
              className="rounded-md border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {["Todos", ...RESPONSAVEIS].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => abrirAgendar(undefined)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <CalendarPlus className="h-4 w-4" /> Agendar reunião
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Reuniões hoje" value={agHoje.length.toString()} />
        <Kpi label="Próximos 7 dias" value={em7.length.toString()} />
        <Kpi label="Sem reunião agendada" value={semReuniao.length.toString()} alerta={semReuniao.length > 0} />
        <Kpi label="Realizadas (30d)" value={realizadas30.length.toString()} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Calendário */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1)} de {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRefDate(new Date(year, month - 1, 1))}
                className="rounded-md border p-1.5 hover:bg-accent"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const t = new Date();
                  setRefDate(new Date(t.getFullYear(), t.getMonth(), 1));
                  setDiaSel(localKey(t));
                }}
                className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
              >
                Hoje
              </button>
              <button
                onClick={() => setRefDate(new Date(year, month + 1, 1))}
                className="rounded-md border p-1.5 hover:bg-accent"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
                {w}
              </div>
            ))}
            {celulas.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const k = localKey(d);
              const doDia = porDia.get(k) ?? [];
              const isHoje = k === hojeKey;
              const isSel = k === diaSel;
              return (
                <button
                  key={k}
                  onClick={() => setDiaSel(k)}
                  className={
                    "min-h-[74px] rounded-md border p-1.5 text-left align-top transition-colors " +
                    (isSel
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50")
                  }
                >
                  <div
                    className={
                      "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
                      (isHoje ? "bg-primary text-primary-foreground font-semibold" : "text-foreground")
                    }
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {doDia.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className={
                          "truncate rounded px-1 py-0.5 text-[10px] " +
                          (a.status === "Realizada"
                            ? "bg-saude-saudavel/15 text-saude-saudavel line-through"
                            : "bg-primary/10 text-primary")
                        }
                      >
                        {fmtHora(a.data)} {nomeCliente(a.clienteId)}
                      </div>
                    ))}
                    {doDia.length > 2 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{doDia.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Reuniões do dia selecionado */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {diaSel === hojeKey ? "Hoje" : "Dia selecionado"}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </h2>
            <button
              onClick={() => abrirAgendar(undefined)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            >
              <CalendarPlus className="h-3 w-3" /> Nova
            </button>
          </div>

          {doDiaSel.length ? (
            <ul className="space-y-2">
              {doDiaSel.map((a) => (
                <li key={a.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Clock className="h-3.5 w-3.5" />
                        {fmtHora(a.data)} · {a.duracaoMin}min
                        <StatusReuniaoBadge status={a.status} />
                      </div>
                      <Link
                        to="/clientes/$id"
                        params={{ id: a.clienteId }}
                        className="mt-1 block truncate text-sm font-medium hover:text-primary"
                      >
                        {nomeCliente(a.clienteId)}
                      </Link>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{a.titulo}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ReuniaoLocalIcon local={a.local} /> {a.local}
                        </span>
                        · {a.tipo} · {a.responsavel}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {a.status === "Agendada" && (
                      <button
                        onClick={() => {
                          updateAgendamento(a.id, { status: "Realizada" });
                          toast.success("Marcada como realizada");
                        }}
                        className="rounded border px-2 py-1 text-[11px] hover:bg-accent"
                      >
                        Realizada
                      </button>
                    )}
                    <Link
                      to="/clientes/$id"
                      params={{ id: a.clienteId }}
                      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] hover:bg-accent"
                    >
                      Ficha <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => {
                        removeAgendamento(a.id);
                        toast.success("Removida");
                      }}
                      className="ml-auto text-muted-foreground hover:text-saude-risco"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma reunião neste dia.
            </div>
          )}
        </section>
      </div>

      {/* Clientes sem reunião agendada */}
      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <CalendarOff className="h-4 w-4 text-saude-atencao" />
          <h2 className="text-sm font-semibold">Clientes sem reunião agendada</h2>
          <span className="text-xs text-muted-foreground">· {semReuniao.length}</span>
        </div>
        {semReuniao.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {semReuniao.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div className="min-w-0">
                  <Link
                    to="/clientes/$id"
                    params={{ id: c.id }}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {c.nome}
                  </Link>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.nicho} · {c.etapaFunil} · {c.responsavel}
                  </div>
                </div>
                <button
                  onClick={() => abrirAgendar(c.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <CalendarPlus className="h-3 w-3" /> Agendar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Todos os clientes ativos têm reunião agendada. 🎉
          </p>
        )}
      </section>

      {agendarAberto && (
        <AgendarDialog
          clientes={clientes}
          clienteIdFixo={clienteFixo}
          onClose={() => setAgendarAberto(false)}
          onSave={(a) => {
            addAgendamento(a);
            setAgendarAberto(false);
            setDiaSel(localKey(new Date(a.data)));
            toast.success("Reunião agendada");
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, alerta }: { label: string; value: string; alerta?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-semibold " + (alerta ? "text-saude-atencao" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
