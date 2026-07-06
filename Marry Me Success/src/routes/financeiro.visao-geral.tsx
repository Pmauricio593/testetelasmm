import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import {
  RECEBIMENTOS,
  CONTAS_PAGAR,
  CATEGORIAS_ORDEM,
  somaValor,
  fmtMoeda,
} from "@/lib/cs-financeiro";
import { KpiFin } from "@/components/cs/financeiro-ui";

export const Route = createFileRoute("/financeiro/visao-geral")({
  component: VisaoGeral,
});

const fmtK = (n: number) => "R$ " + Math.round(n / 100) / 10 + "k";

function VisaoGeral() {
  const julho = RECEBIMENTOS.filter((r) => r.mes === "Julho");
  const entradas = somaValor(julho);
  const recebido = somaValor(julho.filter((r) => r.status === "Quitado"));
  const emAberto = entradas - recebido;
  const saidas = somaValor(CONTAS_PAGAR);
  const resultado = entradas - saidas;
  const margem = entradas ? (resultado / entradas) * 100 : 0;

  const comparativo = [
    { nome: "Entradas", valor: entradas, cor: "var(--saude-saudavel)" },
    { nome: "Saídas", valor: saidas, cor: "var(--saude-risco)" },
  ];

  const despesasPorCat = CATEGORIAS_ORDEM.map((cat) => ({
    categoria: cat,
    valor: somaValor(CONTAS_PAGAR.filter((c) => c.categoria === cat)),
  })).filter((d) => d.valor > 0);

  const pctRecebido = entradas ? (recebido / entradas) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiFin label="Entradas (a receber)" value={fmtMoeda(entradas)} hint={`${julho.length} cobranças`} tom="receber" size="lg" />
        <KpiFin label="Saídas (a pagar)" value={fmtMoeda(saidas)} hint={`${CONTAS_PAGAR.length} lançamentos`} tom="saida" size="lg" />
        <KpiFin
          label="Resultado do mês"
          value={fmtMoeda(resultado)}
          hint={`${resultado >= 0 ? "Superávit" : "Déficit"} · margem ${margem.toFixed(1)}%`}
          tom={resultado >= 0 ? "ok" : "risco"}
          size="lg"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Comparativo entradas x saídas */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Entradas × Saídas</h2>
          <p className="mb-2 text-xs text-muted-foreground">Comparativo direto do caixa de julho</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativo} margin={{ top: 24, right: 16, left: 8, bottom: 0 }}>
                <XAxis dataKey="nome" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)" }} />
                <YAxis hide />
                <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={120}>
                  <LabelList dataKey="valor" position="top" formatter={(v: number) => fmtMoeda(v)} style={{ fontSize: 12, fontWeight: 600, fill: "var(--foreground)" }} />
                  {comparativo.map((c, i) => (
                    <Cell key={i} fill={c.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* barra de saldo */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saídas consomem</span>
              <span className="font-medium">{entradas ? ((saidas / entradas) * 100).toFixed(0) : 0}% das entradas</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-saude-saudavel/25">
              <div
                className="h-full rounded-full bg-saude-risco"
                style={{ width: `${Math.min(100, entradas ? (saidas / entradas) * 100 : 0)}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              Sobra de <span className="font-semibold text-saude-saudavel">{fmtMoeda(resultado)}</span> após pagar todas as contas do mês.
            </div>
          </div>
        </section>

        {/* Composição das entradas */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Composição das entradas</h2>
          <p className="mb-4 text-xs text-muted-foreground">Quanto já entrou vs. o que falta receber</p>

          <div className="flex items-end gap-2 text-sm">
            <span className="text-2xl font-semibold text-saude-saudavel">{pctRecebido.toFixed(0)}%</span>
            <span className="mb-0.5 text-muted-foreground">recebido</span>
          </div>
          <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full">
            <div className="h-full bg-saude-saudavel" style={{ width: `${pctRecebido}%` }} />
            <div className="h-full flex-1 bg-saude-atencao/70" />
          </div>

          <ul className="mt-4 space-y-2">
            <LinhaComp cor="var(--saude-saudavel)" label="Recebido" valor={recebido} sub="quitadas" />
            <LinhaComp cor="var(--saude-atencao)" label="Em aberto" valor={emAberto} sub="a receber no mês" />
          </ul>
        </section>
      </div>

      {/* Composição das saídas */}
      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Composição das saídas — por categoria</h2>
          <span className="text-sm font-semibold text-saude-risco">{fmtMoeda(saidas)}</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={despesasPorCat} layout="vertical" margin={{ left: 8, right: 56 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="categoria" width={132} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
              <Tooltip formatter={(v: number) => fmtMoeda(v)} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="valor" position="right" formatter={fmtK} style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                {despesasPorCat.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "var(--primary)" : "var(--gold)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function LinhaComp({ cor, label, valor, sub }: { cor: string; label: string; valor: number; sub: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cor }} />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">· {sub}</span>
      <span className="ml-auto text-sm font-semibold">{fmtMoeda(valor)}</span>
    </li>
  );
}
