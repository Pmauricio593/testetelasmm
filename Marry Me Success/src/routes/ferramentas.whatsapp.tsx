import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageCircle, Search, Info } from "lucide-react";
import { useCS } from "@/lib/cs-store";

export const Route = createFileRoute("/ferramentas/whatsapp")({
  component: WhatsappPage,
});

type Risco = "Baixo" | "Médio" | "Alto";
const riscoDoTempo = (min: number): Risco => (min >= 120 ? "Alto" : min >= 40 ? "Médio" : "Baixo");
const riscoStyle: Record<Risco, string> = {
  Baixo: "bg-saude-saudavel/15 text-saude-saudavel border-saude-saudavel/30",
  Médio: "bg-saude-atencao/15 text-saude-atencao border-saude-atencao/40",
  Alto: "bg-saude-risco/15 text-saude-risco border-saude-risco/40",
};
const fmtTempo = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ""}` : `${min}min`);

function WhatsappPage() {
  const { clientes } = useCS();
  const [busca, setBusca] = useState("");
  const [fRisco, setFRisco] = useState<Risco | "Todos">("Todos");

  // Mock determinístico: tempo de resposta e mensagens pendentes por grupo.
  const grupos = useMemo(
    () =>
      clientes
        .filter((c) => c.etapaFunil !== "Encerrado/Churn")
        .map((c, i) => {
          const tempo = [8, 22, 55, 130, 15, 95, 200, 33, 12, 75][i % 10];
          const pendentes = [0, 1, 2, 3, 0, 1, 4, 0, 0, 2][i % 10];
          return { c, tempo, pendentes, risco: riscoDoTempo(tempo), responsavel: c.responsavel };
        }),
    [clientes],
  );

  const emRisco = grupos.filter((g) => g.risco === "Alto");
  const tempoMedio = grupos.length ? Math.round(grupos.reduce((a, g) => a + g.tempo, 0) / grupos.length) : 0;
  const pendentesTotal = grupos.reduce((a, g) => a + g.pendentes, 0);

  const filtrados = grupos.filter((g) => {
    if (busca && !g.c.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fRisco !== "Todos" && g.risco !== fRisco) return false;
    return true;
  }).sort((a, b) => b.tempo - a.tempo);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25"><MessageCircle className="h-4 w-4" /></span>
        <div>
          <h2 className="text-lg font-semibold">Supervisor de WhatsApp</h2>
          <p className="text-xs text-muted-foreground">Tempo de resposta e risco por grupo de cliente</p>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Grupos monitorados" value={grupos.length.toString()} />
        <Kpi label="Em risco (alto)" value={emRisco.length.toString()} tom="risco" />
        <Kpi label="Tempo médio de resposta" value={fmtTempo(tempoMedio)} />
        <Kpi label="Mensagens pendentes" value={pendentesTotal.toString()} tom={pendentesTotal ? "atencao" : undefined} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar grupo..." className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          Risco:
          <select value={fRisco} onChange={(e) => setFRisco(e.target.value as Risco | "Todos")} className="rounded-md border bg-card px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring">
            {["Todos", "Alto", "Médio", "Baixo"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Grupo (cliente)</th>
                <th className="px-3 py-2.5 text-left font-medium">Responsável</th>
                <th className="px-3 py-2.5 text-right font-medium">Tempo de resposta</th>
                <th className="px-3 py-2.5 text-right font-medium">Pendentes</th>
                <th className="px-4 py-2.5 text-left font-medium">Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((g) => (
                <tr key={g.c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium">{g.c.nome}<div className="text-[11px] font-normal text-muted-foreground">{g.c.nicho}</div></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{g.responsavel}</td>
                  <td className={"px-3 py-2.5 text-right font-medium " + (g.risco === "Alto" ? "text-saude-risco" : "")}>{fmtTempo(g.tempo)}</td>
                  <td className="px-3 py-2.5 text-right">{g.pendentes || "—"}</td>
                  <td className="px-4 py-2.5"><span className={"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium " + riscoStyle[g.risco]}>{g.risco}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>Dados mockados. <span className="font-medium text-foreground">Conectar integração de WhatsApp depois</span> para tempo de resposta e pendências reais.</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, tom }: { label: string; value: string; tom?: "risco" | "atencao" }) {
  const cor = tom === "risco" ? "text-saude-risco" : tom === "atencao" ? "text-saude-atencao" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-semibold " + cor}>{value}</div>
    </div>
  );
}
