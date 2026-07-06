import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Save, ArrowRight, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useCS } from "@/lib/cs-store";
import { RESPONSAVEIS, SAUDES, PLANO_MRR, type Plano, type Saude } from "@/lib/cs-types";

export const Route = createFileRoute("/configuracoes/clientes")({
  component: ConfigClientes,
});

const iso2date = (iso: string) => (iso ? iso.slice(0, 10) : "");
const PLANOS = Object.keys(PLANO_MRR) as Plano[];

function ConfigClientes() {
  const { clientes, updateCliente, setSaudeOverride, clearSaudeOverride, calcSaudeCliente } = useCS();
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string>(clientes[0]?.id ?? "");

  const cliente = clientes.find((c) => c.id === sel);
  const filtrados = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      {/* Lista */}
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="w-full rounded-md border bg-card pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <ul className="max-h-[560px] space-y-1 overflow-y-auto">
          {filtrados.map((c) => (
            <li key={c.id}>
              <button onClick={() => setSel(c.id)} className={"w-full rounded-md border px-3 py-2 text-left text-sm transition-colors " + (sel === c.id ? "border-primary/60 bg-primary/5" : "border-transparent hover:bg-accent")}>
                <div className="font-medium truncate">{c.nome}</div>
                <div className="text-[11px] text-muted-foreground">{c.nicho} · {c.plano}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      {cliente ? (
        <ConfigForm
          key={cliente.id}
          cliente={cliente}
          saudeAtual={calcSaudeCliente(cliente).saude}
          onSave={(patch, saude) => {
            updateCliente(cliente.id, patch);
            if (saude === "Auto") clearSaudeOverride(cliente.id);
            else setSaudeOverride(cliente.id, saude, "Definido em Configurações");
            toast.success("Cliente atualizado");
          }}
        />
      ) : (
        <div className="text-sm text-muted-foreground">Selecione um cliente.</div>
      )}
    </div>
  );
}

function ConfigForm({
  cliente,
  saudeAtual,
  onSave,
}: {
  cliente: import("@/lib/cs-types").Cliente;
  saudeAtual: Saude;
  onSave: (patch: Partial<import("@/lib/cs-types").Cliente>, saude: Saude | "Auto") => void;
}) {
  const [dataInicio, setDataInicio] = useState(iso2date(cliente.dataInicio));
  const [dataRenovacao, setDataRenovacao] = useState(iso2date(cliente.dataRenovacao));
  const [plano, setPlano] = useState<Plano>(cliente.plano);
  const [valorMensal, setValorMensal] = useState(cliente.valorMensal);
  const [responsavel, setResponsavel] = useState(cliente.responsavel);
  const [instagram, setInstagram] = useState(cliente.redes?.instagram ?? "");
  const [metaAds, setMetaAds] = useState(cliente.redes?.metaAds ?? "");
  const [drive, setDrive] = useState(cliente.redes?.drive ?? "");
  const [metaComercial, setMetaComercial] = useState(cliente.metaComercial ?? "");
  const [saude, setSaude] = useState<Saude | "Auto">(cliente.saudeOverride ? cliente.saudeOverride.saude : "Auto");

  return (
    <div className="rounded-lg border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{cliente.nome}</h2>
        <Link to="/clientes/$id" params={{ id: cliente.id }} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Abrir ficha <ArrowRight className="h-3 w-3" /></Link>
      </div>

      {/* Contrato */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contrato</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Campo label="Início"><input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input mt-1" /></Campo>
          <Campo label="Término / renovação"><input type="date" value={dataRenovacao} onChange={(e) => setDataRenovacao(e.target.value)} className="input mt-1" /></Campo>
          <Campo label="Plano">
            <select value={plano} onChange={(e) => setPlano(e.target.value as Plano)} className="input mt-1">
              {PLANOS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Campo>
          <Campo label="Valor mensal (R$)"><input type="number" value={valorMensal} onChange={(e) => setValorMensal(Number(e.target.value))} className="input mt-1" /></Campo>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Campo label="Responsável (CS)">
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="input mt-1">
              {RESPONSAVEIS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Campo>
          <Campo label="Saúde das vendas (override)">
            <select value={saude} onChange={(e) => setSaude(e.target.value as Saude | "Auto")} className="input mt-1">
              <option value="Auto">Automática (atual: {saudeAtual})</option>
              {SAUDES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Campo>
        </div>
      </div>

      {/* Acessos das redes */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Instagram className="h-3.5 w-3.5" /> Acessos das redes</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Instagram"><input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input mt-1" placeholder="@perfil" /></Campo>
          <Campo label="Meta Ads / BM"><input value={metaAds} onChange={(e) => setMetaAds(e.target.value)} className="input mt-1" placeholder="ID da conta / acesso" /></Campo>
          <Campo label="Drive / materiais"><input value={drive} onChange={(e) => setDrive(e.target.value)} className="input mt-1" placeholder="link" /></Campo>
        </div>
      </div>

      {/* Metas do cliente */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metas do cliente</div>
        <Campo label="Meta comercial / objetivo">
          <input value={metaComercial} onChange={(e) => setMetaComercial(e.target.value)} className="input mt-1" placeholder="Ex: 8 contratos/mês · reduzir CPL para R$ 30" />
        </Campo>
      </div>

      <button
        onClick={() =>
          onSave(
            {
              dataInicio: new Date(dataInicio).toISOString(),
              dataRenovacao: new Date(dataRenovacao).toISOString(),
              plano,
              valorMensal,
              responsavel,
              redes: { instagram, metaAds, drive },
              metaComercial,
            },
            saude,
          )
        }
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <Save className="h-4 w-4" /> Salvar alterações
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
