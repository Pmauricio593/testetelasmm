import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Cliente,
  type Etapa,
  type Saude,
  type SaudeCalculada,
  type DimensaoSaude,
  type Confianca,
  type Tarefa,
  type TarefaStatus,
  type TarefaTipo,
  type RoteiroIA,
  type RoteiroTipo,
  type Agendamento,
  type Usuario,
  type PermKey,
  TODAS_PERMISSOES,
  PLANO_MRR,
} from "./cs-types";
import { seedAgendamentos, seedClientes, seedRoteiros, seedTarefas } from "./cs-mock";
import { seedPautas, type Pauta } from "./cs-pautas";
import { templateOnboarding, type OnbItem } from "./cs-onboarding";

const diasDesde = (iso: string) => {
  const d = new Date(iso).getTime();
  return Math.floor((Date.now() - d) / 86400000);
};

export const diasAte = (iso: string) => {
  const d = new Date(iso).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
};

export const semanasSemContato = (c: Cliente) => {
  if (!c.reunioes.length) return 99;
  const ultima = c.reunioes
    .map((r) => new Date(r.data).getTime())
    .sort((a, b) => b - a)[0];
  return Math.floor((Date.now() - ultima) / (86400000 * 7));
};

export const tendenciaCPLPior = (c: Cliente) => {
  const m = c.metricasCampanha;
  if (m.length < 4) return false;
  const inicio = m.slice(0, 3).reduce((s, x) => s + x.cpl, 0) / 3;
  const fim = m.slice(-3).reduce((s, x) => s + x.cpl, 0) / 3;
  return fim > inicio * 1.2;
};

const SAUDE_ORDER: Saude[] = ["Saudável", "Atenção", "Risco", "Crítico"];
const pior = (a: Saude, b: Saude): Saude =>
  SAUDE_ORDER.indexOf(a) > SAUDE_ORDER.indexOf(b) ? a : b;

export const statusTarefaEfetivo = (t: Tarefa): TarefaStatus => {
  if (t.status === "Concluída") return "Concluída";
  const atrasada = new Date(t.prazo).getTime() < Date.now();
  if (atrasada) return "Atrasada";
  return t.status;
};

function calcEntregas(c: Cliente, tarefas: Tarefa[]): DimensaoSaude {
  const doCliente = tarefas.filter((t) => t.clienteId === c.id);
  const abertas = doCliente.filter((t) => t.status !== "Concluída");
  const atrasadas = abertas.filter(
    (t) => new Date(t.prazo).getTime() < Date.now(),
  );
  const fatores: string[] = [];
  let nivel: Saude = "Saudável";
  if (atrasadas.length >= 3) {
    nivel = "Crítico";
    fatores.push(`${atrasadas.length} tarefas atrasadas`);
  } else if (atrasadas.length === 2) {
    nivel = "Risco";
    fatores.push("2 tarefas atrasadas");
  } else if (atrasadas.length === 1) {
    nivel = "Atenção";
    fatores.push("1 tarefa atrasada");
  } else if (!abertas.length) {
    fatores.push("Sem tarefas abertas");
  } else {
    fatores.push(`${abertas.length} tarefa(s) em dia`);
  }
  return { nivel, fatores };
}

function calcCampanhas(c: Cliente): DimensaoSaude {
  const m = c.metricasCampanha;
  const fatores: string[] = [];
  let nivel: Saude = "Saudável";
  if (!m.length) {
    return { nivel: "Atenção", fatores: ["Sem métricas de campanha ainda"] };
  }
  if (tendenciaCPLPior(c)) {
    nivel = pior(nivel, "Risco");
    fatores.push("CPL subindo mais de 20% nas últimas semanas");
  }
  const ultimo = m[m.length - 1];
  if (ultimo.ctr < 1) {
    nivel = pior(nivel, "Atenção");
    fatores.push(`CTR baixo (${ultimo.ctr.toFixed(2)}%)`);
  }
  if (ultimo.leads < 5) {
    nivel = pior(nivel, "Atenção");
    fatores.push(`Poucos leads (${ultimo.leads} na última semana)`);
  }
  if (!fatores.length) fatores.push("CPL, CTR e leads estáveis.");
  return { nivel, fatores };
}

function calcVendasCliente(c: Cliente): DimensaoSaude {
  const v = c.vendasCliente;
  if (!v.length) return { nivel: "Atenção", fatores: ["Sem dados de vendas ainda"] };
  const fatores: string[] = [];
  let nivel: Saude = "Saudável";

  const ultimas3 = v.slice(-3);
  const anteriores = v.slice(-6, -3);
  const somaFech = (arr: typeof v) => arr.reduce((s, x) => s + x.fechados, 0);
  const fechAtual = somaFech(ultimas3);
  const fechAnt = somaFech(anteriores);

  const semFechar = ultimas3.every((x) => x.fechados === 0);
  if (semFechar) {
    nivel = pior(nivel, "Crítico");
    fatores.push("Sem contratos fechados nas últimas 3 semanas");
  } else if (fechAnt > 0 && fechAtual < fechAnt * 0.6) {
    nivel = pior(nivel, "Risco");
    fatores.push("Contratos fechados caíram mais de 40%");
  }

  // conversão lead → fechado
  const totalLeads = v.reduce((s, x) => s + x.leads, 0);
  const totalFech = v.reduce((s, x) => s + x.fechados, 0);
  const taxa = totalLeads ? (totalFech / totalLeads) * 100 : 0;
  if (taxa && taxa < 8) {
    nivel = pior(nivel, "Atenção");
    fatores.push(`Baixa conversão lead→contrato (${taxa.toFixed(1)}%)`);
  }

  if (!fatores.length) {
    fatores.push(`Conversão ${taxa.toFixed(1)}% · ${totalFech} contratos no período`);
  }
  return { nivel, fatores };
}

function calcRenovacao(c: Cliente): DimensaoSaude {
  const fatores: string[] = [];
  let nivel: Saude = "Saudável";
  const dias = diasAte(c.dataRenovacao);
  const semanas = semanasSemContato(c);

  if (c.diasAtraso > 15) {
    nivel = pior(nivel, "Crítico");
    fatores.push("Inadimplente há mais de 15 dias");
  } else if (c.diasAtraso >= 5) {
    nivel = pior(nivel, "Risco");
    fatores.push("Inadimplente");
  } else if (c.diasAtraso >= 1) {
    nivel = pior(nivel, "Atenção");
    fatores.push("Pagamento em atraso");
  }

  if (c.etapaFunil === "Janela de Renovação") {
    if (c.confiancaFechamento === "Baixa") {
      nivel = pior(nivel, "Crítico");
      fatores.push("Confiança baixa de renovação");
    } else if (c.confiancaFechamento === "Média") {
      nivel = pior(nivel, "Risco");
      fatores.push("Confiança média de renovação");
    }
    if (semanas > 4) {
      nivel = pior(nivel, "Crítico");
      fatores.push(`Sem contato há ${semanas} semanas na janela`);
    }
  }

  if (dias >= 0 && dias <= 30 && c.etapaFunil !== "Encerrado/Churn") {
    nivel = pior(nivel, "Atenção");
    fatores.push(`Renovação em ${dias} dias`);
  }

  if (!fatores.length) fatores.push("Renovação distante e pagamento em dia.");
  return { nivel, fatores };
}

export function calcSaudeDim(c: Cliente, tarefas: Tarefa[]): SaudeCalculada {
  const entregas = calcEntregas(c, tarefas);
  const campanhas = calcCampanhas(c);
  const vendasCliente = calcVendasCliente(c);
  const renovacao = calcRenovacao(c);

  const geralAuto = [entregas.nivel, campanhas.nivel, vendasCliente.nivel, renovacao.nivel].reduce(
    (a, b) => pior(a, b),
    "Saudável" as Saude,
  );

  if (c.saudeOverride) {
    return {
      saude: c.saudeOverride.saude,
      fatores: [`Override manual: ${c.saudeOverride.justificativa}`],
      overridden: true,
      entregas,
      campanhas,
      vendasCliente,
      renovacao,
    };
  }

  const fatores = [
    ...entregas.fatores.map((f) => `Entregas · ${f}`),
    ...campanhas.fatores.map((f) => `Campanhas · ${f}`),
    ...vendasCliente.fatores.map((f) => `Vendas do cliente · ${f}`),
    ...renovacao.fatores.map((f) => `Renovação · ${f}`),
  ];

  return { saude: geralAuto, fatores, overridden: false, entregas, campanhas, vendasCliente, renovacao };
}

export function calcSaude(c: Cliente): SaudeCalculada {
  return calcSaudeDim(c, []);
}

export const mrrDoCliente = (c: Cliente) => c.valorMensal;

interface Store {
  clientes: Cliente[];
  tarefas: Tarefa[];
  roteiros: RoteiroIA[];
  agendamentos: Agendamento[];
  getCliente: (id: string) => Cliente | undefined;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  setEtapa: (id: string, etapa: Etapa) => void;
  setConfianca: (id: string, c: Confianca) => void;
  setSaudeOverride: (id: string, saude: Saude, justificativa: string) => void;
  clearSaudeOverride: (id: string) => void;
  addReuniao: (id: string, resumo: string) => void;
  addCliente: (
    c: Omit<
      Cliente,
      | "id"
      | "valorMensal"
      | "contextoMarca"
      | "metricasCampanha"
      | "vendasCliente"
      | "reunioes"
      | "statusPagamento"
      | "diasAtraso"
      | "proximoPasso"
    >,
  ) => string;
  addTarefa: (t: Omit<Tarefa, "id" | "criadaEm">) => string;
  updateTarefa: (id: string, patch: Partial<Tarefa>) => void;
  addRoteiro: (r: Omit<RoteiroIA, "id" | "criadoEm">) => string;
  removeRoteiro: (id: string) => void;
  roteirosDoCliente: (clienteId: string) => RoteiroIA[];
  addAgendamento: (a: Omit<Agendamento, "id">) => string;
  updateAgendamento: (id: string, patch: Partial<Agendamento>) => void;
  removeAgendamento: (id: string) => void;
  agendamentosDoCliente: (clienteId: string) => Agendamento[];
  proximoAgendamento: (clienteId: string) => Agendamento | undefined;
  pautas: Pauta[];
  addPauta: (p: Omit<Pauta, "id">) => string;
  updatePauta: (id: string, patch: Partial<Pauta>) => void;
  removePauta: (id: string) => void;
  itensOnboarding: (cliente: Cliente) => OnbItem[];
  setClienteOnboarding: (clienteId: string, itens: OnbItem[]) => void;
  usuarios: Usuario[];
  usuarioAtual: Usuario;
  setUsuarioAtual: (id: string) => void;
  addUsuario: (u: Omit<Usuario, "id">) => string;
  updateUsuario: (id: string, patch: Partial<Usuario>) => void;
  removeUsuario: (id: string) => void;
  hasPermissao: (p: PermKey) => boolean;
  calcSaudeCliente: (c: Cliente) => SaudeCalculada;
  tarefasDoCliente: (clienteId: string) => Tarefa[];
  tarefasAtrasadasDoCliente: (clienteId: string) => number;
}

const seedUsuarios: Usuario[] = [
  { id: "u1", nome: "Paulo", papel: "Admin / Sócio", permissoes: [...TODAS_PERMISSOES] },
  { id: "u2", nome: "Kauê", papel: "Head de CS", permissoes: ["painel", "clientes", "health", "tarefas", "agenda", "renovacoes", "ferramentas"] },
  { id: "u3", nome: "Giovanni", papel: "Vendas / Closer", permissoes: ["painel", "vendas", "planejamento", "clientes"] },
  { id: "u4", nome: "Marina", papel: "CS Júnior", permissoes: ["painel", "clientes", "health", "tarefas", "agenda", "ferramentas"] },
];

const Ctx = createContext<Store | null>(null);

export function CSProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(seedClientes);
  const [tarefas, setTarefas] = useState<Tarefa[]>(seedTarefas);
  const [roteiros, setRoteiros] = useState<RoteiroIA[]>(seedRoteiros);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(seedAgendamentos);
  const [pautas, setPautas] = useState<Pauta[]>(seedPautas);
  const [onboardingItens, setOnboardingItens] = useState<Record<string, OnbItem[]>>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>(seedUsuarios);
  const [currentUserId, setCurrentUserId] = useState<string>(seedUsuarios[0].id);

  const updateCliente = useCallback((id: string, patch: Partial<Cliente>) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const store: Store = useMemo(
    () => ({
      clientes,
      tarefas,
      roteiros,
      agendamentos,
      getCliente: (id) => clientes.find((c) => c.id === id),
      updateCliente,
      setEtapa: (id, etapa) => updateCliente(id, { etapaFunil: etapa }),
      setConfianca: (id, c) => updateCliente(id, { confiancaFechamento: c }),
      setSaudeOverride: (id, saude, justificativa) =>
        updateCliente(id, { saudeOverride: { saude, justificativa } }),
      clearSaudeOverride: (id) => updateCliente(id, { saudeOverride: null }),
      addReuniao: (id, resumo) => {
        setClientes((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  reunioes: [
                    { id: `r${Date.now()}`, data: new Date().toISOString(), resumo },
                    ...c.reunioes,
                  ],
                }
              : c,
          ),
        );
      },
      addCliente: (c) => {
        const id = `c${Date.now()}`;
        setClientes((prev) => [
          ...prev,
          {
            ...c,
            id,
            valorMensal: PLANO_MRR[c.plano],
            statusPagamento: "Em dia",
            diasAtraso: 0,
            proximoPasso: "Realizar reunião de kickoff.",
            contextoMarca: {
              publicoAlvo: "",
              tomDeVoz: "",
              diferenciais: "",
              sazonalidade: "",
            },
            metricasCampanha: [],
            vendasCliente: [],
            reunioes: [],
          },
        ]);
        return id;
      },
      addTarefa: (t) => {
        const id = `t${Date.now()}`;
        setTarefas((prev) => [
          { ...t, id, criadaEm: new Date().toISOString() },
          ...prev,
        ]);
        return id;
      },
      updateTarefa: (id, patch) =>
        setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      addRoteiro: (r) => {
        const id = `ro${Date.now()}`;
        setRoteiros((prev) => [
          { ...r, id, criadoEm: new Date().toISOString() },
          ...prev,
        ]);
        return id;
      },
      removeRoteiro: (id) => setRoteiros((prev) => prev.filter((r) => r.id !== id)),
      roteirosDoCliente: (clienteId) => roteiros.filter((r) => r.clienteId === clienteId),
      addAgendamento: (a) => {
        const id = `ag${Date.now()}`;
        setAgendamentos((prev) => [...prev, { ...a, id }]);
        return id;
      },
      updateAgendamento: (id, patch) =>
        setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
      removeAgendamento: (id) =>
        setAgendamentos((prev) => prev.filter((a) => a.id !== id)),
      agendamentosDoCliente: (clienteId) =>
        agendamentos
          .filter((a) => a.clienteId === clienteId)
          .sort((x, y) => new Date(x.data).getTime() - new Date(y.data).getTime()),
      proximoAgendamento: (clienteId) =>
        agendamentos
          .filter(
            (a) =>
              a.clienteId === clienteId &&
              a.status === "Agendada" &&
              new Date(a.data).getTime() >= Date.now(),
          )
          .sort((x, y) => new Date(x.data).getTime() - new Date(y.data).getTime())[0],
      pautas,
      addPauta: (p) => {
        const id = `pa${Date.now()}`;
        setPautas((prev) => [...prev, { ...p, id }]);
        return id;
      },
      updatePauta: (id, patch) =>
        setPautas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      removePauta: (id) => setPautas((prev) => prev.filter((p) => p.id !== id)),
      itensOnboarding: (cliente) => onboardingItens[cliente.id] ?? templateOnboarding(cliente.plano),
      setClienteOnboarding: (clienteId, itens) =>
        setOnboardingItens((prev) => ({ ...prev, [clienteId]: itens })),
      usuarios,
      usuarioAtual: usuarios.find((u) => u.id === currentUserId) ?? usuarios[0],
      setUsuarioAtual: (id) => setCurrentUserId(id),
      addUsuario: (u) => {
        const id = `u${Date.now()}`;
        setUsuarios((prev) => [...prev, { ...u, id }]);
        return id;
      },
      updateUsuario: (id, patch) =>
        setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u))),
      removeUsuario: (id) => setUsuarios((prev) => prev.filter((u) => u.id !== id)),
      hasPermissao: (p) => {
        const u = usuarios.find((x) => x.id === currentUserId) ?? usuarios[0];
        return u.permissoes.includes(p);
      },
      calcSaudeCliente: (c) => calcSaudeDim(c, tarefas),
      tarefasDoCliente: (clienteId) => tarefas.filter((t) => t.clienteId === clienteId),
      tarefasAtrasadasDoCliente: (clienteId) =>
        tarefas.filter(
          (t) =>
            t.clienteId === clienteId &&
            t.status !== "Concluída" &&
            new Date(t.prazo).getTime() < Date.now(),
        ).length,
    }),
    [clientes, tarefas, roteiros, agendamentos, pautas, onboardingItens, usuarios, currentUserId, updateCliente],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export const useCS = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCS fora de CSProvider");
  return ctx;
};

export { diasDesde };
export type { TarefaStatus, TarefaTipo, RoteiroTipo };
