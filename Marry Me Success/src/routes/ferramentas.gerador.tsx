import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Copy, Paperclip, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import { montarPrompt, type DadosPedido } from "@/lib/cs-pautas";

export const Route = createFileRoute("/ferramentas/gerador")({
  component: GeradorPage,
});

const VARIACOES = ["A", "B", "C"] as const;

function GeradorPage() {
  const { pautas, clientes } = useCS();
  const [pautaId, setPautaId] = useState(pautas[0]?.id ?? "");
  const [clienteId, setClienteId] = useState("");
  const [dados, setDados] = useState({ briefing: "", objetivo: "", observacoes: "", anexos: "" });
  const [vars, setVars] = useState<string[]>(["A"]);
  const [gerado, setGerado] = useState<{ variacao: string; texto: string }[]>([]);

  const pauta = pautas.find((p) => p.id === pautaId);
  const cliente = clientes.find((c) => c.id === clienteId);

  const contextoAuto = useMemo(() => {
    if (!cliente) return "";
    const m = cliente.contextoMarca;
    return [m.publicoAlvo && `Público: ${m.publicoAlvo}`, m.tomDeVoz && `Tom: ${m.tomDeVoz}`, m.diferenciais && `Diferenciais: ${m.diferenciais}`]
      .filter(Boolean)
      .join(" · ");
  }, [cliente]);

  const gerar = () => {
    if (!pauta) return;
    if (!cliente) {
      toast.error("Selecione o cliente.");
      return;
    }
    const base: DadosPedido = {
      cliente: cliente.nome,
      briefing: dados.briefing,
      objetivo: dados.objetivo,
      observacoes: dados.observacoes,
      anexos: dados.anexos,
      contexto: contextoAuto,
    };
    const lista = pauta.suportaVariacoes && vars.length ? vars : [""];
    setGerado(lista.map((v) => ({ variacao: v, texto: montarPrompt(pauta, base, v || undefined) })));
    toast.success("Prompt montado — copie e rode no seu modelo.");
  };

  const toggleVar = (v: string) => setVars((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      {/* Pedido */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">Novo pedido</div>
          <Campo label="Pauta">
            <select value={pautaId} onChange={(e) => { setPautaId(e.target.value); setGerado([]); }} className="input mt-1">
              {pautas.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
            </select>
          </Campo>
          {pauta && <p className="text-xs text-muted-foreground">{pauta.descricao}</p>}

          {pauta && (
            <div className="rounded-md border bg-muted/30 p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Anexos necessários
              </div>
              <ul className="space-y-0.5 text-xs">
                {pauta.anexosNecessarios.map((a) => (<li key={a} className="text-muted-foreground">• {a}</li>))}
              </ul>
              {pauta.exigePlanilha && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-saude-atencao">
                  <AlertTriangle className="h-3 w-3" /> Exige planilha de métricas anexada
                </div>
              )}
            </div>
          )}

          <Campo label="Cliente">
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input mt-1">
              <option value="">Selecione…</option>
              {clientes.filter((c) => c.etapaFunil !== "Encerrado/Churn").map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
          </Campo>
          {contextoAuto && <p className="text-[11px] text-muted-foreground">Contexto puxado da ficha: {contextoAuto}</p>}

          <Campo label="Objetivo">
            <input value={dados.objetivo} onChange={(e) => setDados({ ...dados, objetivo: e.target.value })} className="input mt-1" placeholder="Ex: gerar agendamentos para a próxima temporada" />
          </Campo>
          <Campo label="Briefing">
            <textarea value={dados.briefing} onChange={(e) => setDados({ ...dados, briefing: e.target.value })} rows={2} className="input mt-1 resize-y" placeholder="O que precisa ser produzido" />
          </Campo>
          <Campo label="Observações">
            <textarea value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} rows={2} className="input mt-1 resize-y" placeholder="Restrições, tom, o que evitar…" />
          </Campo>
          <Campo label="Anexos (cole aqui)">
            <textarea value={dados.anexos} onChange={(e) => setDados({ ...dados, anexos: e.target.value })} rows={3} className="input mt-1 resize-y font-mono text-xs" placeholder="Cole textos, dados da planilha, links de referência…" />
          </Campo>

          {pauta?.suportaVariacoes && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Variações</div>
              <div className="flex gap-2">
                {VARIACOES.map((v) => (
                  <button key={v} onClick={() => toggleVar(v)} className={"flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium " + (vars.includes(v) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={gerar} className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Montar prompt
          </button>
        </div>
      </div>

      {/* Prompts */}
      <div className="space-y-4">
        {gerado.map((g) => (
          <div key={g.variacao} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="text-sm font-semibold">
                Prompt pronto {g.variacao && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">Variação {g.variacao}</span>}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(g.texto); toast.success("Copiado"); }} className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent">
                <Copy className="h-3 w-3" /> Copiar
              </button>
            </div>
            <textarea readOnly value={g.texto} rows={16} className="input min-h-[260px] w-full resize-y border-0 font-mono text-xs leading-relaxed" />
          </div>
        ))}
        {!gerado.length && (
          <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed bg-card/50 px-6 text-center text-sm text-muted-foreground">
            <div>
              <Check className="mx-auto mb-2 h-6 w-6 text-primary/50" />
              Preencha o pedido e clique em <span className="font-medium text-foreground">Montar prompt</span>.<br />
              O sistema monta o texto — você roda no seu modelo por fora.
            </div>
          </div>
        )}
      </div>
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
