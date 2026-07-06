export type Nicho =
  | "Músico"
  | "Banda"
  | "DJ"
  | "Celebrante"
  | "Cerimonialista"
  | "Fotógrafo"
  | "Cinegrafista";

export type Etapa =
  | "Onboarding"
  | "Estruturação"
  | "Operação Ativa"
  | "Janela de Renovação"
  | "Encerrado/Churn";

export type Saude = "Saudável" | "Atenção" | "Risco" | "Crítico";

export type Plano = "Essencial" | "Growth" | "Estruturação Comercial";

export type StatusPagamento = "Em dia" | "Em atraso";

export type Confianca = "Alta" | "Média" | "Baixa";

export type TarefaStatus = "Pendente" | "Em andamento" | "Concluída" | "Atrasada";
export type TarefaTipo = "Criativo" | "Reunião" | "Follow-up" | "Outro";

export type RoteiroTipo =
  | "Roteiro de anúncio"
  | "Vídeo de apresentação"
  | "Reels"
  | "Pauta de reunião"
  | "Insight de otimização";

export const ROTEIRO_TIPOS: RoteiroTipo[] = [
  "Roteiro de anúncio",
  "Vídeo de apresentação",
  "Reels",
  "Pauta de reunião",
  "Insight de otimização",
];

/** Valor mensal padrão por serviço — usado apenas como sugestão ao cadastrar
 *  um novo cliente. O MRR real de cada cliente vem de Cliente.valorMensal. */
export const PLANO_MRR: Record<Plano, number> = {
  Essencial: 689,
  Growth: 1089,
  "Estruturação Comercial": 747,
};

export const ETAPAS: Etapa[] = [
  "Onboarding",
  "Estruturação",
  "Operação Ativa",
  "Janela de Renovação",
  "Encerrado/Churn",
];

export const SAUDES: Saude[] = ["Saudável", "Atenção", "Risco", "Crítico"];
export const TAREFA_STATUS: TarefaStatus[] = ["Pendente", "Em andamento", "Concluída", "Atrasada"];
export const TAREFA_TIPOS: TarefaTipo[] = ["Criativo", "Reunião", "Follow-up", "Outro"];

export interface Reuniao {
  id: string;
  data: string;
  resumo: string;
}

export type ReuniaoStatus = "Agendada" | "Realizada" | "Cancelada";

export type ReuniaoTipo =
  | "Reunião de Resultados"
  | "Onboarding / Kickoff"
  | "Renovação"
  | "Alinhamento"
  | "Retenção";

export type ReuniaoLocal = "Google Meet" | "Presencial" | "Ligação";

export const REUNIAO_TIPOS: ReuniaoTipo[] = [
  "Reunião de Resultados",
  "Onboarding / Kickoff",
  "Renovação",
  "Alinhamento",
  "Retenção",
];

export const REUNIAO_LOCAIS: ReuniaoLocal[] = ["Google Meet", "Presencial", "Ligação"];

/** Reunião agendada (agenda nativa) — distinta do histórico em Cliente.reunioes. */
export interface Agendamento {
  id: string;
  clienteId: string;
  data: string; // ISO datetime de início
  duracaoMin: number;
  titulo: string;
  tipo: ReuniaoTipo;
  local: ReuniaoLocal;
  responsavel: string;
  status: ReuniaoStatus;
  notas?: string;
}

export interface ContextoMarca {
  publicoAlvo: string;
  tomDeVoz: string;
  diferenciais: string;
  sazonalidade: string;
}

export interface RedesCliente {
  instagram?: string;
  metaAds?: string;
  drive?: string;
}

/* --------- Usuários e permissões (RBAC em memória) --------- */

export type PermKey =
  | "painel"
  | "vendas"
  | "clientes"
  | "health"
  | "tarefas"
  | "agenda"
  | "renovacoes"
  | "ferramentas"
  | "financeiro"
  | "planejamento"
  | "configuracoes";

export const PERMISSOES: { key: PermKey; label: string }[] = [
  { key: "painel", label: "Painel Geral" },
  { key: "vendas", label: "Vendas" },
  { key: "planejamento", label: "Planejamento" },
  { key: "clientes", label: "Clientes" },
  { key: "health", label: "Health Score" },
  { key: "tarefas", label: "Tarefas" },
  { key: "agenda", label: "Agenda" },
  { key: "renovacoes", label: "Renovações" },
  { key: "ferramentas", label: "Ferramentas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "configuracoes", label: "Configurações" },
];

export const TODAS_PERMISSOES: PermKey[] = PERMISSOES.map((p) => p.key);

export interface Usuario {
  id: string;
  nome: string;
  papel: string;
  permissoes: PermKey[];
}

export interface MetricaSemana {
  semana: string;
  cpl: number;
  ctr: number;
  leads: number;
  gasto: number;
}

/** Funil comercial do próprio fornecedor (vendas dele, não a nossa renovação). */
export interface VendaSemana {
  semana: string;
  leads: number;         // leads recebidos pelo comercial dele
  reunioes: number;      // reuniões/visitas realizadas
  propostas: number;     // propostas enviadas
  fechados: number;      // contratos fechados
  receita: number;       // R$ fechado na semana
  ticketMedio: number;   // receita/fechados
}

export interface Tarefa {
  id: string;
  titulo: string;
  clienteId: string;
  responsavel: string;
  prazo: string;
  status: Exclude<TarefaStatus, "Atrasada"> | "Concluída";
  tipo: TarefaTipo;
  criadaEm: string;
  origem?: "manual" | "clickup" | "ia";
}

export interface RoteiroIA {
  id: string;
  clienteId: string;
  tipo: RoteiroTipo;
  texto: string;
  criadoEm: string;
  parametros?: Record<string, string>;
}

export interface Cliente {
  id: string;
  nome: string;
  nicho: Nicho;
  plano: Plano;
  /** Valor mensal real do contrato (R$), origem: planilha de cobranças. */
  valorMensal: number;
  responsavel: string;
  dataInicio: string;
  dataRenovacao: string;
  etapaFunil: Etapa;
  statusPagamento: StatusPagamento;
  diasAtraso: number;
  proximoPasso: string;
  confiancaFechamento?: Confianca;
  contextoMarca: ContextoMarca;
  metricasCampanha: MetricaSemana[];
  vendasCliente: VendaSemana[];
  reunioes: Reuniao[];
  saudeOverride?: { saude: Saude; justificativa: string } | null;
  redes?: RedesCliente;
  metaComercial?: string;
}

export interface DimensaoSaude {
  nivel: Saude;
  fatores: string[];
}

export interface SaudeCalculada {
  saude: Saude;
  fatores: string[];
  overridden: boolean;
  entregas: DimensaoSaude;
  campanhas: DimensaoSaude;
  vendasCliente: DimensaoSaude; // funil comercial do fornecedor
  renovacao: DimensaoSaude;     // renovação do contrato Marry Me + pagamento
}

export const RESPONSAVEIS = ["Kauê", "Giovanni", "Paulo"];
