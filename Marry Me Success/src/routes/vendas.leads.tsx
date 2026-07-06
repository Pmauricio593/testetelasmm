import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Search, Info, X } from "lucide-react";
import {
  NEGOCIACOES, ORIGENS, ETAPAS_KANBAN, POR_ORIGEM, soma, fmtBRL, fmtData,
  type EtapaVenda, type Temperatura, type Negociacao,
} from "@/lib/cs-vendas";
import { VendasHeader, TemperaturaBadge, EtapaBadge, VendaKpi } from "@/components/cs/vendas-ui";

export const Route = createFileRoute("/vendas/leads")({
  component: LeadsQuentesPage,
});

const ATIVOS = NEGOCIACOES.filter((n) => n.etapa !== "Ganho" && n.etapa !== "Perdido");

interface Bant { autoridade: string; necessidade: string; prazo: string; proximosPassos: string; quem: string; discussao: string }
const bantVazio = (n: Negociacao): Bant => ({ autoridade: "", necessidade: "", prazo: "", proximosPassos: "", quem: n.responsavel ?? "", discussao: n.proximaAcao ?? "" });

function LeadsQuentesPage() {
  const [busca, setBusca] = useState("");
  const [fOrigem, setFOrigem] = useState("Todas");
  const [fEtapa, setFEtapa] = useState<EtapaVenda | "Todas">("Todas");
  const [fTemp, setFTemp] = useState<Temperatura | "Todas">("Quente");
  const [sel, setSel] = useState<string | null>(null);
  const [bants, setBants] = useState<Record<string, Bant>>({});

  const quentes = ATIVOS.filter((n) => n.temperatura === "Quente");
  const topOrigem = [...POR_ORIGEM].sort((a, b) => b.fechadas - a.fechadas)[0];

  const filtrados = ATIVOS.filter((n) => {
    if (busca && !n.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fOrigem !== "Todas" && n.origem !== fOrigem) return false;
    if (fEtapa !== "Todas" && n.etapa !== fEtapa) return false;
    if (fTemp !== "Todas" && n.temperatura !== fTemp) return false;
    return true;
  }).sort((a, b) => b.valorMensal - a.valorMensal);

  const selNeg = ATIVOS.find((n) => n.id === sel);
  const bant = selNeg ? bants[selNeg.id] ?? bantVazio(selNeg) : null;
  const setBant = (patch: Partial<Bant>) => { if (selNeg) setBants((prev) => ({ ...prev, [selNeg.id]: { ...(prev[selNeg.id] ?? bantVazio(selNeg)), ...patch } })); };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <VendasHeader icon={<Flame className="h-4 w-4" />} title="Leads Quentes" description="Clique num negócio para ver a discussão e os próximos passos (BANT)" />

      <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <VendaKpi label="Leads quentes" value={quentes.length.toString()} hint="prioridade de contato" />
        <VendaKpi label="MRR quente" value={fmtBRL(soma(quentes))} hint="potencial a fechar" />
        <VendaKpi label="Negócios ativos" value={ATIVOS.length.toString()} hint="no pipeline avançado" />
        <VendaKpi label="Origem que mais fecha" value={topOrigem?.origem ?? "—"} hint={`${topOrigem?.fechadas ?? 0} contratos`} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar lead..." className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Filtro label="Temp." value={fTemp} onChange={(v) => setFTemp(v as Temperatura | "Todas")} options={["Todas", "Quente", "Morno", "Frio"]} />
        <Filtro label="Etapa" value={fEtapa} onChange={(v) => setFEtapa(v as EtapaVenda | "Todas")} options={["Todas", ...ETAPAS_KANBAN.filter((e) => e !== "Ganho" && e !== "Perdido")]} />
        <Filtro label="Origem" value={fOrigem} onChange={setFOrigem} options={["Todas", ...ORIGENS]} />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">{filtrados.length} negócios · clique para abrir</div>
        <div className="max-h-[540px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Lead</th>
                <th className="px-3 py-2.5 text-left font-medium">Telefone</th>
                <th className="px-3 py-2.5 text-left font-medium">Origem</th>
                <th className="px-3 py-2.5 text-left font-medium">Etapa</th>
                <th className="px-3 py-2.5 text-left font-medium">Temp.</th>
                <th className="px-4 py-2.5 text-right font-medium">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((n) => (
                <tr key={n.id} onClick={() => setSel(n.id)} className={"cursor-pointer hover:bg-accent/30 " + (sel === n.id ? "bg-accent/40" : "")}>
                  <td className="px-4 py-2.5 font-medium">{n.nome}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{n.telefone || "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{n.origem}</td>
                  <td className="px-3 py-2.5"><EtapaBadge etapa={n.etapa} /></td>
                  <td className="px-3 py-2.5"><TemperaturaBadge t={n.temperatura} /></td>
                  <td className="px-4 py-2.5 text-right font-semibold">{n.valorMensal ? fmtBRL(n.valorMensal) : "—"}</td>
                </tr>
              ))}
              {!filtrados.length && (<tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum lead com esses filtros.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {selNeg && bant && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSel(null)} />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l bg-card shadow-xl">
            <header className="flex items-start justify-between gap-3 border-b p-5">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Oportunidade</div>
                <h2 className="truncate text-lg font-semibold">{selNeg.nome}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <EtapaBadge etapa={selNeg.etapa} /><TemperaturaBadge t={selNeg.temperatura} />
                  <span>· {selNeg.origem} · {selNeg.valorMensal ? fmtBRL(selNeg.valorMensal) : "—"}/mês</span>
                </div>
                {selNeg.telefone && <div className="mt-1 text-xs text-muted-foreground">📞 {selNeg.telefone}</div>}
              </div>
              <button onClick={() => setSel(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <BantField label="Discussão / contexto" value={bant.discussao} onChange={(v) => setBant({ discussao: v })} rows={3} placeholder="O que foi conversado, situação atual…" />
              <div className="grid grid-cols-1 gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Devolutiva (BANT)</div>
                <BantField label="Autoridade (quem decide)" value={bant.autoridade} onChange={(v) => setBant({ autoridade: v })} />
                <BantField label="Necessidade / dor" value={bant.necessidade} onChange={(v) => setBant({ necessidade: v })} />
                <BantField label="Prazo (time frame)" value={bant.prazo} onChange={(v) => setBant({ prazo: v })} />
                <BantField label="Próximos passos" value={bant.proximosPassos} onChange={(v) => setBant({ proximosPassos: v })} rows={2} />
                <BantField label="Quem fez a reunião" value={bant.quem} onChange={(v) => setBant({ quem: v })} />
              </div>
              <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Anotações em memória (protótipo). A operação comercial oficial roda no <span className="font-medium text-foreground">Crescer</span>. Conectar depois.</span>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function BantField({ label, value, onChange, rows = 1, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {rows > 1 ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="input mt-1 resize-y" placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1" placeholder={placeholder} />
      )}
    </div>
  );
}

function Filtro({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}:
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring max-w-[180px]">
        {options.map((o) => (<option key={o}>{o}</option>))}
      </select>
    </label>
  );
}
