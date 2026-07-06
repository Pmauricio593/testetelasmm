import { useState } from "react";
import { X, Video, MapPin, Phone } from "lucide-react";
import {
  REUNIAO_TIPOS,
  REUNIAO_LOCAIS,
  RESPONSAVEIS,
  type Agendamento,
  type Cliente,
  type ReuniaoTipo,
  type ReuniaoLocal,
  type ReuniaoStatus,
} from "@/lib/cs-types";

/* ----------------------------- Formatação ----------------------------- */

export const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const fmtDataHora = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) +
    " · " +
    fmtHora(iso)
  );
};

/* ----------------------------- Badges/ícones ----------------------------- */

export function ReuniaoLocalIcon({ local, className }: { local: ReuniaoLocal; className?: string }) {
  const cls = className ?? "h-3.5 w-3.5";
  if (local === "Google Meet") return <Video className={cls} />;
  if (local === "Presencial") return <MapPin className={cls} />;
  return <Phone className={cls} />;
}

const statusStyle: Record<ReuniaoStatus, string> = {
  Agendada: "bg-primary/10 text-primary border-primary/30",
  Realizada: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  Cancelada: "bg-muted text-muted-foreground border-border",
};

export function StatusReuniaoBadge({ status }: { status: ReuniaoStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        statusStyle[status]
      }
    >
      {status}
    </span>
  );
}

/* ----------------------------- Dialog de agendamento ----------------------------- */

export function AgendarDialog({
  clientes,
  clienteIdFixo,
  responsavelPadrao,
  inicial,
  onClose,
  onSave,
}: {
  clientes: Cliente[];
  clienteIdFixo?: string;
  responsavelPadrao?: string;
  inicial?: Partial<Agendamento>;
  onClose: () => void;
  onSave: (a: Omit<Agendamento, "id">) => void;
}) {
  const primeiroAtivo = clientes.find((c) => c.etapaFunil !== "Encerrado/Churn")?.id ?? clientes[0]?.id ?? "";
  const [clienteId, setClienteId] = useState(clienteIdFixo ?? inicial?.clienteId ?? primeiroAtivo);
  const base = inicial?.data ? new Date(inicial.data) : new Date(Date.now() + 86400000);
  const [data, setData] = useState(base.toISOString().slice(0, 10));
  const [hora, setHora] = useState(inicial?.data ? fmtHora(inicial.data) : "10:00");
  const [duracaoMin, setDuracao] = useState(inicial?.duracaoMin ?? 45);
  const [tipo, setTipo] = useState<ReuniaoTipo>(inicial?.tipo ?? "Reunião de Resultados");
  const [local, setLocal] = useState<ReuniaoLocal>(inicial?.local ?? "Google Meet");
  const [responsavel, setResponsavel] = useState(inicial?.responsavel ?? responsavelPadrao ?? RESPONSAVEIS[0]);
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");

  const salvar = () => {
    const dt = new Date(`${data}T${hora || "10:00"}:00`);
    onSave({
      clienteId,
      data: dt.toISOString(),
      duracaoMin,
      tipo,
      local,
      responsavel,
      titulo: titulo.trim() || tipo,
      status: inicial?.status ?? "Agendada",
      notas: inicial?.notas,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{inicial?.id ? "Editar reunião" : "Agendar reunião"}</h3>
          <button onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {!clienteIdFixo && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input mt-1">
                {clientes
                  .filter((c) => c.etapaFunil !== "Encerrado/Churn")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input mt-1"
              placeholder="Ex: Reunião de resultados do mês"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="input mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Duração</label>
              <select value={duracaoMin} onChange={(e) => setDuracao(Number(e.target.value))} className="input mt-1">
                {[30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as ReuniaoTipo)} className="input mt-1">
                {REUNIAO_TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Local</label>
              <select value={local} onChange={(e) => setLocal(e.target.value as ReuniaoLocal)} className="input mt-1">
                {REUNIAO_LOCAIS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Responsável</label>
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="input mt-1">
              {RESPONSAVEIS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={salvar}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {inicial?.id ? "Salvar" : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}
