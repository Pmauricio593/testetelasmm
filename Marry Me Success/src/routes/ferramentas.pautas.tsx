import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileStack, Plus, Trash2, Save, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import type { Pauta } from "@/lib/cs-pautas";

export const Route = createFileRoute("/ferramentas/pautas")({
  component: PautasPage,
});

type Draft = Omit<Pauta, "id" | "anexosNecessarios"> & { anexos: string };

const vazio: Draft = {
  nome: "",
  descricao: "",
  anexos: "",
  exigePlanilha: false,
  suportaVariacoes: true,
  promptTemplate: "",
};

function toDraft(p: Pauta): Draft {
  return { nome: p.nome, descricao: p.descricao, anexos: p.anexosNecessarios.join("\n"), exigePlanilha: p.exigePlanilha, suportaVariacoes: p.suportaVariacoes, promptTemplate: p.promptTemplate };
}

function PautasPage() {
  const { pautas, addPauta, updatePauta, removePauta } = useCS();
  const [editId, setEditId] = useState<string | null>(null);
  const [d, setD] = useState<Draft>(vazio);

  const novo = () => { setEditId(null); setD(vazio); };
  const editar = (p: Pauta) => { setEditId(p.id); setD(toDraft(p)); };

  const salvar = () => {
    if (!d.nome.trim() || !d.promptTemplate.trim()) {
      toast.error("Preencha nome e prompt template.");
      return;
    }
    const payload = {
      nome: d.nome.trim(),
      descricao: d.descricao.trim(),
      anexosNecessarios: d.anexos.split("\n").map((s) => s.trim()).filter(Boolean),
      exigePlanilha: d.exigePlanilha,
      suportaVariacoes: d.suportaVariacoes,
      promptTemplate: d.promptTemplate,
    };
    if (editId) { updatePauta(editId, payload); toast.success("Pauta atualizada"); }
    else { const id = addPauta(payload); setEditId(id); toast.success("Pauta criada"); }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Lista */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Pautas <span className="font-normal text-muted-foreground">· {pautas.length}</span></div>
          <button onClick={novo} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"><Plus className="h-3 w-3" /> Nova</button>
        </div>
        <ul className="space-y-2">
          {pautas.map((p) => (
            <li key={p.id}>
              <button onClick={() => editar(p)} className={"w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 " + (editId === p.id ? "border-primary/60 ring-1 ring-primary/30" : "")}>
                <div className="flex items-center gap-2">
                  <FileStack className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{p.nome}</span>
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{p.descricao}</div>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                  {p.exigePlanilha && <span className="rounded-full bg-saude-atencao/15 px-2 py-0.5 text-saude-atencao">exige planilha</span>}
                  {p.suportaVariacoes && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">A/B/C</span>}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground"><Paperclip className="mr-0.5 inline h-2.5 w-2.5" />{p.anexosNecessarios.length}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{editId ? "Editar pauta" : "Nova pauta"}</div>
          {editId && (
            <button onClick={() => { removePauta(editId); novo(); toast.success("Pauta removida"); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-saude-risco">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
          )}
        </div>
        <Campo label="Nome"><input value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} className="input mt-1" placeholder="Ex: Roteiro de Reels" /></Campo>
        <Campo label="Descrição"><input value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className="input mt-1" /></Campo>
        <Campo label="Anexos necessários (um por linha)">
          <textarea value={d.anexos} onChange={(e) => setD({ ...d, anexos: e.target.value })} rows={3} className="input mt-1 resize-y" placeholder={"Referências de vídeo\nPortfólio"} />
        </Campo>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={d.exigePlanilha} onChange={(e) => setD({ ...d, exigePlanilha: e.target.checked })} className="accent-[var(--primary)]" /> Exige planilha</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={d.suportaVariacoes} onChange={(e) => setD({ ...d, suportaVariacoes: e.target.checked })} className="accent-[var(--primary)]" /> Suporta variações A/B/C</label>
        </div>
        <Campo label="Prompt template">
          <textarea value={d.promptTemplate} onChange={(e) => setD({ ...d, promptTemplate: e.target.value })} rows={12} className="input mt-1 resize-y font-mono text-xs leading-relaxed" placeholder="Use {CLIENTE} {OBJETIVO} {BRIEFING} {CONTEXTO} {OBSERVACOES} {ANEXOS} {VARIACAO}" />
        </Campo>
        <p className="text-[11px] text-muted-foreground">Placeholders: {"{CLIENTE} {OBJETIVO} {BRIEFING} {CONTEXTO} {OBSERVACOES} {ANEXOS} {VARIACAO}"}</p>
        <button onClick={salvar} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Save className="h-4 w-4" /> Salvar pauta
        </button>
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
