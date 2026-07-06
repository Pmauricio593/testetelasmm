import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { NEGOCIACOES, ORIGENS, soma, fmtBRL, fmtData, type PropostaStatus } from "@/lib/cs-vendas";
import { VendasHeader, PropostaStatusBadge, VendaKpi } from "@/components/cs/vendas-ui";

export const Route = createFileRoute("/vendas/propostas")({
  component: PropostasPage,
});

const STATUS: PropostaStatus[] = ["Enviada", "Aceita", "Recusada"];
const statusColor: Record<PropostaStatus, string> = {
  Enviada: "var(--saude-atencao)",
  Aceita: "var(--saude-saudavel)",
  Recusada: "var(--saude-risco)",
};

function statusDaEtapa(etapa: string): PropostaStatus {
  if (etapa === "Ganho") return "Aceita";
  if (etapa === "Perdido") return "Recusada";
  return "Enviada";
}

function PropostasPage() {
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState<PropostaStatus | "Todas">("Todas");
  const [fOrigem, setFOrigem] = useState("Todas");

  const propostas = useMemo(
    () =>
      NEGOCIACOES.filter((n) => n.propostaEnviada).map((n) => ({
        id: n.id,
        cliente: n.nome,
        origem: n.origem,
        valorMensal: n.valorMensal,
        status: statusDaEtapa(n.etapa),
        data: n.dataFechamento || n.dataOrigem,
      })),
    [],
  );

  const aceitas = propostas.filter((p) => p.status === "Aceita");
  const recusadas = propostas.filter((p) => p.status === "Recusada");
  const abertas = propostas.filter((p) => p.status === "Enviada");
  const taxa = aceitas.length + recusadas.length ? (aceitas.length / (aceitas.length + recusadas.length)) * 100 : 0;

  const porStatus = STATUS.map((s) => ({ status: s, valor: soma(propostas.filter((p) => p.status === s)) })).filter((d) => d.valor > 0);

  const filtradas = propostas.filter((p) => {
    if (busca && !p.cliente.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fStatus !== "Todas" && p.status !== fStatus) return false;
    if (fOrigem !== "Todas" && p.origem !== fOrigem) return false;
    return true;
  }).sort((a, b) => new Date(b.data || "0").getTime() - new Date(a.data || "0").getTime());

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <VendasHeader
        icon={<FileText className="h-4 w-4" />}
        title="Propostas / Orçamentos"
        description="Propostas enviadas no CRM e resultado de conversão"
      />

      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <VendaKpi label="Propostas enviadas" value={propostas.length.toString()} hint={fmtBRL(soma(propostas)) + " em MRR"} />
        <VendaKpi label="Em aberto" value={abertas.length.toString()} hint={fmtBRL(soma(abertas))} />
        <VendaKpi label="Aceitas" value={aceitas.length.toString()} hint={fmtBRL(soma(aceitas))} />
        <VendaKpi label="Taxa de aceite" value={`${taxa.toFixed(0)}%`} hint={`${aceitas.length}✓ / ${recusadas.length}✗`} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">MRR por status</h2>
          <p className="mb-3 text-xs text-muted-foreground">Distribuição das propostas</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="status" width={80} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {porStatus.map((d, i) => (
                    <Cell key={i} fill={statusColor[d.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
            <h2 className="text-sm font-semibold">
              Propostas <span className="text-xs font-normal text-muted-foreground">· {filtradas.length}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Cliente..." className="w-32 rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value as PropostaStatus | "Todas")} className="rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring">
                {["Todas", ...STATUS].map((o) => <option key={o}>{o}</option>)}
              </select>
              <select value={fOrigem} onChange={(e) => setFOrigem(e.target.value)} className="max-w-[150px] rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring">
                {["Todas", ...ORIGENS].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium">Origem</th>
                  <th className="px-3 py-2 text-left font-medium">Data</th>
                  <th className="px-3 py-2 text-right font-medium">MRR</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtradas.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium">{p.cliente}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.origem}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtData(p.data)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{p.valorMensal ? fmtBRL(p.valorMensal) : "—"}</td>
                    <td className="px-4 py-2"><PropostaStatusBadge status={p.status} /></td>
                  </tr>
                ))}
                {!filtradas.length && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma proposta com esses filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
