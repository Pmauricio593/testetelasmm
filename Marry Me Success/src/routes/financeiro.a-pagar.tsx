import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from "recharts";
import { Search } from "lucide-react";
import {
  CONTAS_PAGAR,
  CATEGORIAS_ORDEM,
  parseVenc,
  somaValor,
  fmtMoeda,
  type CategoriaDespesa,
} from "@/lib/cs-financeiro";
import { KpiFin, MiniSelect } from "@/components/cs/financeiro-ui";

export const Route = createFileRoute("/financeiro/a-pagar")({
  component: APagar,
});

const fmtK = (n: number) => "R$ " + Math.round(n / 100) / 10 + "k";
const SEMANAS = [
  { label: "01–07/07", min: 1, max: 7 },
  { label: "08–14/07", min: 8, max: 14 },
  { label: "15–21/07", min: 15, max: 21 },
  { label: "22–31/07", min: 22, max: 31 },
];

const catColor = (i: number) => (i === 0 ? "var(--primary)" : i === 1 ? "var(--saude-risco)" : "var(--gold)");

function APagar() {
  const [fCat, setFCat] = useState<CategoriaDespesa | "Todas">("Todas");
  const [busca, setBusca] = useState("");

  const total = somaValor(CONTAS_PAGAR);
  const maiorDesp = CONTAS_PAGAR.reduce((m, c) => (c.valor > m.valor ? c : m), CONTAS_PAGAR[0]);

  const porCat = useMemo(
    () =>
      CATEGORIAS_ORDEM.map((cat) => ({
        categoria: cat,
        valor: somaValor(CONTAS_PAGAR.filter((c) => c.categoria === cat)),
      }))
        .filter((d) => d.valor > 0)
        .sort((a, b) => b.valor - a.valor),
    [],
  );
  const maiorCat = porCat[0];

  const porSemana = useMemo(
    () =>
      SEMANAS.map((s) => ({
        semana: s.label,
        valor: somaValor(
          CONTAS_PAGAR.filter((c) => {
            const d = parseVenc(c.venc);
            return d && d.getDate() >= s.min && d.getDate() <= s.max;
          }),
        ),
      })),
    [],
  );

  const filtrados = CONTAS_PAGAR.filter((c) => {
    if (fCat !== "Todas" && c.categoria !== fCat) return false;
    if (busca && !c.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.valor - a.valor);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiFin label="Total a pagar" value={fmtMoeda(total)} hint={`${CONTAS_PAGAR.length} lançamentos`} tom="saida" />
        <KpiFin
          label="Maior categoria"
          value={fmtMoeda(maiorCat.valor)}
          hint={`${maiorCat.categoria} · ${((maiorCat.valor / total) * 100).toFixed(0)}% do total`}
        />
        <KpiFin label="Maior lançamento" value={fmtMoeda(maiorDesp.valor)} hint={maiorDesp.descricao} />
        <KpiFin label="Categorias" value={porCat.length.toString()} hint="grupos de despesa" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Despesas por categoria</h2>
          <p className="mb-3 text-xs text-muted-foreground">Julho 2026</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCat} layout="vertical" margin={{ left: 8, right: 56 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="categoria" width={132} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="valor" position="right" formatter={fmtK} style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  {porCat.map((_, i) => (
                    <Cell key={i} fill={catColor(i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Saídas por semana</h2>
          <p className="mb-3 text-xs text-muted-foreground">Quando as contas vencem</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSemana} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <XAxis dataKey="semana" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => "R$" + Math.round(v / 1000) + "k"} />
                <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="valor" fill="var(--saude-risco)" radius={[4, 4, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <h2 className="text-sm font-semibold">
            Lançamentos <span className="text-xs font-normal text-muted-foreground">· {filtrados.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Descrição..."
                className="w-40 rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <MiniSelect value={fCat} onChange={(v) => setFCat(v as CategoriaDespesa | "Todas")} options={["Todas", ...CATEGORIAS_ORDEM]} />
          </div>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Descrição</th>
                <th className="px-3 py-2 text-left font-medium">Categoria</th>
                <th className="px-3 py-2 text-left font-medium">Venc.</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((c, i) => (
                <tr key={i} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-medium">{c.descricao}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.categoria}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.venc}</td>
                  <td className="px-4 py-2 text-right font-semibold">{fmtMoeda(c.valor)}</td>
                </tr>
              ))}
              {!filtrados.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum lançamento com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t bg-muted/20">
              <tr>
                <td className="px-4 py-2 text-sm font-semibold" colSpan={3}>Total</td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-saude-risco">{fmtMoeda(somaValor(filtrados))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
