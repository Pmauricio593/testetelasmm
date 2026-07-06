import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, AlertTriangle, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { RECEBIMENTOS, CONTAS_PAGAR, parseVenc, fmtMoeda } from "@/lib/cs-financeiro";
import { KpiFin } from "@/components/cs/financeiro-ui";

export const Route = createFileRoute("/financeiro/fluxo")({
  component: FluxoPage,
});

const SEMANAS = [
  { label: "01–07/jul", min: 1, max: 7 },
  { label: "08–14/jul", min: 8, max: 14 },
  { label: "15–21/jul", min: 15, max: 21 },
  { label: "22–28/jul", min: 22, max: 28 },
  { label: "29–31/jul", min: 29, max: 31 },
];

interface Lancamento {
  id: string;
  semana: number;
  tipo: "Entrada" | "Saída";
  descricao: string;
  valor: number;
}

const diaDe = (venc: string) => parseVenc(venc)?.getDate() ?? 0;

function FluxoPage() {
  const [saldoInicial, setSaldoInicial] = useState(5000);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [form, setForm] = useState<{ semana: number; tipo: "Entrada" | "Saída"; descricao: string; valor: string }>({
    semana: 0,
    tipo: "Saída",
    descricao: "",
    valor: "",
  });

  const semanas = useMemo(() => {
    let acumulado = saldoInicial;
    return SEMANAS.map((s, i) => {
      const recDaSemana = RECEBIMENTOS.filter((r) => r.mes === "Julho" && diaDe(r.venc) >= s.min && diaDe(r.venc) <= s.max);
      const aReceber = recDaSemana.filter((r) => r.status !== "Quitado").reduce((a, r) => a + r.valor, 0);
      const recebido = recDaSemana.filter((r) => r.status === "Quitado").reduce((a, r) => a + r.valor, 0);
      const aPagar = CONTAS_PAGAR.filter((c) => diaDe(c.venc) >= s.min && diaDe(c.venc) <= s.max).reduce((a, c) => a + c.valor, 0);
      const manEnt = lancamentos.filter((l) => l.semana === i && l.tipo === "Entrada").reduce((a, l) => a + l.valor, 0);
      const manSai = lancamentos.filter((l) => l.semana === i && l.tipo === "Saída").reduce((a, l) => a + l.valor, 0);
      const entradas = aReceber + recebido + manEnt;
      const saidas = aPagar + manSai;
      const saldoSemana = entradas - saidas;
      acumulado += saldoSemana;
      return { ...s, i, aReceber, recebido, aPagar: aPagar + manSai, entradas, saidas, saldoSemana, acumulado };
    });
  }, [saldoInicial, lancamentos]);

  const quebra = semanas.find((s) => s.acumulado < 0);
  const totalEntradas = semanas.reduce((a, s) => a + s.entradas, 0);
  const totalSaidas = semanas.reduce((a, s) => a + s.saidas, 0);
  const saldoFinal = semanas[semanas.length - 1]?.acumulado ?? saldoInicial;

  const addLancamento = () => {
    const v = Number(form.valor);
    if (!form.descricao.trim() || !v) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    setLancamentos((prev) => [...prev, { id: `l${Date.now()}`, semana: form.semana, tipo: form.tipo, descricao: form.descricao.trim(), valor: v }]);
    setForm({ ...form, descricao: "", valor: "" });
    toast.success("Lançamento adicionado");
  };

  return (
    <div className="space-y-6">
      {/* Alerta de quebra de caixa */}
      {quebra && (
        <div className="flex items-start gap-2 rounded-lg border border-saude-critico/40 bg-saude-critico/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-saude-critico" />
          <div className="text-sm">
            <div className="font-semibold text-saude-critico">Alerta de quebra de caixa</div>
            <div className="text-muted-foreground">
              O saldo acumulado fica negativo na semana <span className="font-medium text-foreground">{quebra.label}</span> ({fmtMoeda(quebra.acumulado)}). Antecipe recebimentos ou reprograme saídas.
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Saldo inicial</div>
          <input type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(Number(e.target.value))} className="mt-2 w-32 rounded-md border bg-background px-2 py-1 text-xl font-semibold outline-none focus:ring-2 focus:ring-ring" />
          <div className="mt-1 text-xs text-muted-foreground">editável</div>
        </div>
        <KpiFin label="Entradas (mês)" value={fmtMoeda(totalEntradas)} tom="receber" />
        <KpiFin label="Saídas (mês)" value={fmtMoeda(totalSaidas)} tom="saida" />
        <KpiFin label="Saldo final projetado" value={fmtMoeda(saldoFinal)} tom={saldoFinal >= 0 ? "ok" : "risco"} />
      </section>

      {/* Tabela semanal */}
      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-5 py-4"><h2 className="text-sm font-semibold">Fluxo de caixa · semana a semana (Julho)</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Semana</th>
                <th className="px-3 py-2.5 text-right font-medium">A receber</th>
                <th className="px-3 py-2.5 text-right font-medium">Recebido</th>
                <th className="px-3 py-2.5 text-right font-medium">A pagar</th>
                <th className="px-3 py-2.5 text-right font-medium">Saldo semana</th>
                <th className="px-4 py-2.5 text-right font-medium">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {semanas.map((s) => (
                <tr key={s.label} className="hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium">{s.label}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{fmtMoeda(s.aReceber)}</td>
                  <td className="px-3 py-2.5 text-right text-saude-saudavel">{fmtMoeda(s.recebido)}</td>
                  <td className="px-3 py-2.5 text-right text-saude-risco">{fmtMoeda(s.aPagar)}</td>
                  <td className={"px-3 py-2.5 text-right font-medium " + (s.saldoSemana < 0 ? "text-saude-risco" : "")}>{fmtMoeda(s.saldoSemana)}</td>
                  <td className={"px-4 py-2.5 text-right font-semibold " + (s.acumulado < 0 ? "text-saude-critico" : "text-foreground")}>{fmtMoeda(s.acumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lançamento manual */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Novo lançamento manual</h2>
        <div className="flex flex-wrap items-end gap-2">
          <Campo label="Semana">
            <select value={form.semana} onChange={(e) => setForm({ ...form, semana: Number(e.target.value) })} className="input mt-1 w-32">
              {SEMANAS.map((s, i) => (<option key={s.label} value={i}>{s.label}</option>))}
            </select>
          </Campo>
          <Campo label="Tipo">
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "Entrada" | "Saída" })} className="input mt-1 w-28">
              <option>Entrada</option>
              <option>Saída</option>
            </select>
          </Campo>
          <Campo label="Descrição">
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: adiantamento fornecedor" className="input mt-1 w-56" />
          </Campo>
          <Campo label="Valor (R$)">
            <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="input mt-1 w-28" />
          </Campo>
          <button onClick={addLancamento} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>

        {lancamentos.length > 0 && (
          <ul className="mt-4 divide-y rounded-md border">
            {lancamentos.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{SEMANAS[l.semana].label}</span>
                <span className={"w-16 shrink-0 text-xs font-medium " + (l.tipo === "Entrada" ? "text-saude-saudavel" : "text-saude-risco")}>{l.tipo}</span>
                <span className="min-w-0 flex-1 truncate">{l.descricao}</span>
                <span className="font-semibold">{fmtMoeda(l.valor)}</span>
                <button onClick={() => setLancamentos((prev) => prev.filter((x) => x.id !== l.id))} className="text-muted-foreground hover:text-saude-risco" aria-label="Remover">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>Lançamentos manuais (em memória). Recebimentos e contas vêm das planilhas (mock). <span className="font-medium text-foreground">Conectar Asaas / contas a pagar depois.</span></span>
        </div>
      </section>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
