import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Search } from "lucide-react";
import {
  RECEBIMENTOS,
  etapaDaCobranca,
  parseVenc,
  somaValor,
  fmtMoeda,
  type CobrancaStatus,
  type CompetenciaMes,
} from "@/lib/cs-financeiro";
import { KpiFin, MiniSelect, StatusBadge, tomColor } from "@/components/cs/financeiro-ui";

export const Route = createFileRoute("/financeiro/a-receber")({
  component: AReceber,
});

const SEMANAS = [
  { label: "01–07/07", min: 1, max: 7 },
  { label: "08–14/07", min: 8, max: 14 },
  { label: "15–21/07", min: 15, max: 21 },
  { label: "22–31/07", min: 22, max: 31 },
];

function AReceber() {
  const [fMes, setFMes] = useState<CompetenciaMes | "Todos">("Julho");
  const [fStatus, setFStatus] = useState<CobrancaStatus | "Todos">("Todos");
  const [busca, setBusca] = useState("");

  const julho = RECEBIMENTOS.filter((r) => r.mes === "Julho");
  const recebido = julho.filter((r) => r.status === "Quitado");
  const emAberto = julho.filter((r) => r.status !== "Quitado");
  const total = somaValor(julho);
  const ticket = julho.length ? total / julho.length : 0;
  const maior = julho.reduce((m, r) => (r.valor > m.valor ? r : m), julho[0]);

  const porSemana = useMemo(
    () =>
      SEMANAS.map((s) => {
        const itens = julho.filter((r) => {
          const d = parseVenc(r.venc);
          return d && d.getDate() >= s.min && d.getDate() <= s.max;
        });
        return { semana: s.label, recebido: somaValor(itens.filter((i) => i.status === "Quitado")), aberto: somaValor(itens.filter((i) => i.status !== "Quitado")) };
      }),
    [julho],
  );

  const filtrados = RECEBIMENTOS.filter((r) => {
    if (fMes !== "Todos" && r.mes !== fMes) return false;
    if (fStatus !== "Todos" && r.status !== fStatus) return false;
    if (busca && !r.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.valor - a.valor);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiFin label="Total a receber" value={fmtMoeda(total)} hint={`${julho.length} cobranças`} tom="receber" />
        <KpiFin label="Recebido" value={fmtMoeda(somaValor(recebido))} hint={`${recebido.length} quitadas`} tom="ok" />
        <KpiFin label="Em aberto" value={fmtMoeda(somaValor(emAberto))} hint={`${emAberto.length} cobranças`} tom="alerta" />
        <KpiFin label="Ticket médio" value={fmtMoeda(ticket)} />
        <KpiFin label="Maior cobrança" value={fmtMoeda(maior?.valor ?? 0)} hint={maior?.nome} />
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Entradas previstas por semana</h2>
        <p className="mb-3 text-xs text-muted-foreground">Distribuição dos vencimentos de julho · recebido vs. em aberto</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porSemana} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="semana" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
              <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="recebido" stackId="a" fill="var(--saude-saudavel)" name="Recebido" radius={[0, 0, 0, 0]} />
              <Bar dataKey="aberto" stackId="a" fill="var(--saude-atencao)" name="Em aberto" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <h2 className="text-sm font-semibold">
            Cobranças <span className="text-xs font-normal text-muted-foreground">· {filtrados.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Cliente..."
                className="w-36 rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <MiniSelect value={fMes} onChange={(v) => setFMes(v as CompetenciaMes | "Todos")} options={["Todos", "Julho", "Junho"]} />
            <MiniSelect value={fStatus} onChange={(v) => setFStatus(v as CobrancaStatus | "Todos")} options={["Todos", "Em Aberto", "Quitado", "Atrasado"]} />
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Cliente</th>
                <th className="px-3 py-2 text-left font-medium">Mês</th>
                <th className="px-3 py-2 text-left font-medium">Venc.</th>
                <th className="px-3 py-2 text-left font-medium">Etapa</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((r, i) => {
                const etapa = r.status === "Quitado" ? null : etapaDaCobranca(r);
                return (
                  <tr key={r.nome + i} className="hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium">
                      {r.nome}
                      {r.multa && <span className="ml-1 text-[10px] text-saude-risco">multa</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.mes}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.venc}</td>
                    <td className="px-3 py-2">
                      {etapa ? (
                        <span className="text-xs font-medium" style={{ color: tomColor[etapa.tom] }}>{etapa.curto}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{fmtMoeda(r.valor)}</td>
                    <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                  </tr>
                );
              })}
              {!filtrados.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma cobrança com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
