import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCog, Plus, Trash2, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import { PERMISSOES, type PermKey } from "@/lib/cs-types";

export const Route = createFileRoute("/configuracoes/usuarios")({
  component: ConfigUsuarios,
});

function ConfigUsuarios() {
  const { usuarios, usuarioAtual, setUsuarioAtual, addUsuario, updateUsuario, removeUsuario } = useCS();
  const [sel, setSel] = useState<string>(usuarioAtual.id);

  const u = usuarios.find((x) => x.id === sel);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      {/* Lista */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Time <span className="font-normal text-muted-foreground">· {usuarios.length}</span></div>
          <button
            onClick={() => { const id = addUsuario({ nome: "Novo usuário", papel: "Membro", permissoes: ["painel"] }); setSel(id); }}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> Novo
          </button>
        </div>
        <ul className="space-y-1">
          {usuarios.map((x) => (
            <li key={x.id}>
              <button onClick={() => setSel(x.id)} className={"flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors " + (sel === x.id ? "border-primary/60 bg-primary/5" : "border-transparent hover:bg-accent")}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{x.nome.slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{x.nome}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{x.papel}</span>
                </span>
                {x.id === usuarioAtual.id && <span className="rounded-full bg-saude-saudavel/15 px-1.5 py-0.5 text-[10px] font-medium text-saude-saudavel">você</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      {u ? (
        <UserForm
          key={u.id}
          usuario={u}
          isCurrent={u.id === usuarioAtual.id}
          onAcessar={() => { setUsuarioAtual(u.id); toast.success(`Acessando como ${u.nome}`); }}
          onSave={(patch) => { updateUsuario(u.id, patch); toast.success("Usuário atualizado"); }}
          onRemove={usuarios.length > 1 ? () => { removeUsuario(u.id); setSel(usuarios.find((x) => x.id !== u.id)!.id); toast.success("Usuário removido"); } : undefined}
        />
      ) : (
        <div className="text-sm text-muted-foreground">Selecione um usuário.</div>
      )}
    </div>
  );
}

function UserForm({
  usuario,
  isCurrent,
  onSave,
  onRemove,
  onAcessar,
}: {
  usuario: import("@/lib/cs-types").Usuario;
  isCurrent: boolean;
  onSave: (patch: Partial<import("@/lib/cs-types").Usuario>) => void;
  onRemove?: () => void;
  onAcessar: () => void;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [papel, setPapel] = useState(usuario.papel);
  const [perms, setPerms] = useState<PermKey[]>(usuario.permissoes);

  const toggle = (p: PermKey) => setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <div className="rounded-lg border bg-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold"><UserCog className="h-4 w-4 text-primary" /> {usuario.nome}</div>
        <div className="flex items-center gap-2">
          {!isCurrent && <button onClick={onAcessar} className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent">Acessar como</button>}
          {onRemove && <button onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-saude-risco"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Nome"><input value={nome} onChange={(e) => setNome(e.target.value)} className="input mt-1" /></Campo>
        <Campo label="Papel"><input value={papel} onChange={(e) => setPapel(e.target.value)} className="input mt-1" placeholder="Ex: Head de CS" /></Campo>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acessos do sistema</div>
        <p className="mb-3 text-xs text-muted-foreground">Módulos desmarcados ficam escondidos no menu deste usuário.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PERMISSOES.map((p) => {
            const on = perms.includes(p.key);
            return (
              <button key={p.key} onClick={() => toggle(p.key)} className={"flex items-center gap-2.5 rounded-md border p-2.5 text-left text-sm transition-colors " + (on ? "border-primary/40 bg-primary/5" : "hover:bg-accent")}>
                <span className={"flex h-4 w-4 shrink-0 items-center justify-center rounded border " + (on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => onSave({ nome, papel, permissoes: perms })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        <Save className="h-4 w-4" /> Salvar acessos
      </button>
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
