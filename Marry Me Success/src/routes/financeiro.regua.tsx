import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  RECEBIMENTOS,
  REGUA,
  etapaDaCobranca,
  preencherTemplate,
  somaValor,
  fmtMoeda,
  type Recebimento,
} from "@/lib/cs-financeiro";
import { KpiFin, tomColor } from "@/components/cs/financeiro-ui";

export const Route = createFileRoute("/financeiro/regua")({
  component: ReguaPage,
});

function ReguaPage() {
  const [etapaSel, setEtapaSel] = useState<string>("a-vencer");

  const abertas = RECEBIMENTOS.filter((r) => r.status !== "Quitado");
  const porEtapa = useMemo(() => {
    const m = new Map<string, Recebimento[]>();
    for (const e of REGUA) m.set(e.id, []);
    for (const r of abertas) m.get(etapaDaCobranca(r).id)!.push(r);
    return m;
  }, [abertas]);

  const etapaAtual = REGUA.find((e) => e.id === etapaSel) ?? REGUA[0];
  const itensEtapa = (porEtapa.get(etapaSel) ?? []).slice().sort((a, b) => b.valor - a.valor);

  const emRisco = abertas.filter((r) => {
    const id = etapaDaCobranca(r).id;
    return ["d7", "d15", "d21", "d30"].includes(id);
  });

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiFin label="Cobranças em aberto" value={abertas.length.toString()} hint={fmtMoeda(somaValor(abertas))} tom="alerta" />
        <KpiFin label="A vencer" value={(porEtapa.get("a-vencer")?.length ?? 0).toString()} hint="dentro do prazo" />
        <KpiFin label="Em cobrança (pós-venc.)" value={abertas.filter((r) => !["a-vencer", "d-5", "d-3"].includes(etapaDaCobranca(r).id)).length.toString()} hint="vencidas" tom="saida" />
        <KpiFin label="Em risco (D+7 a D+30)" value={emRisco.length.toString()} hint={fmtMoeda(somaValor(emRisco))} tom="risco" />
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Régua de Cobrança</h2>
          <span className="text-xs text-muted-foreground">· clique numa etapa para ver os clientes e a mensagem pronta</span>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2">
          {REGUA.map((e) => {
            const itens = porEtapa.get(e.id) ?? [];
            const ativo = e.id === etapaSel;
            const cor = tomColor[e.tom];
            return (
              <button
                key={e.id}
                onClick={() => setEtapaSel(e.id)}
                className={
                  "min-w-[104px] flex-1 rounded-md border p-2.5 text-left transition-all " +
                  (ativo ? "ring-2" : "hover:bg-accent/50") +
                  (itens.length ? "" : " opacity-50")
                }
                style={ativo ? ({ borderColor: cor, "--tw-ring-color": cor } as React.CSSProperties) : { borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="text-[11px] font-semibold" style={{ color: cor }}>{e.curto}</span>
                </div>
                <div className="mt-1 text-lg font-semibold leading-none">{itens.length}</div>
                <div className="mt-1 text-[10px] text-muted-foreground truncate">{e.acao}</div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  {itens.length ? fmtMoeda(somaValor(itens)) : "—"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tomColor[etapaAtual.tom] }} />
              <span className="text-sm font-semibold">{etapaAtual.label}</span>
              <span className="text-xs text-muted-foreground">· {itensEtapa.length} cliente(s)</span>
            </div>
            {itensEtapa.length ? (
              <ul className="divide-y rounded-md border">
                {itensEtapa.map((r, i) => (
                  <li key={r.nome + i} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {r.nome}
                        {r.multa && <span className="ml-1 text-[10px] text-saude-risco">multa</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">vence {r.venc} · {r.mes}</div>
                    </div>
                    <div className="text-sm font-semibold">{fmtMoeda(r.valor)}</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(preencherTemplate(etapaAtual, r));
                        toast.success(`Mensagem copiada · ${r.nome.split(" ")[0]}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      <Copy className="h-3 w-3" /> Msg
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhuma cobrança nesta etapa.
              </div>
            )}
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Mensagem da etapa</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(etapaAtual.template);
                  toast.success("Template copiado");
                }}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Copy className="h-3 w-3" /> Copiar
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/90">
              {etapaAtual.template}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
