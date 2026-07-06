import type {
  Agendamento,
  Cliente,
  Etapa,
  MetricaSemana,
  Nicho,
  Plano,
  Reuniao,
  RoteiroIA,
  Tarefa,
  VendaSemana,
} from "./cs-types";
import { PLANO_MRR, RESPONSAVEIS } from "./cs-types";

const today = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n: number) => daysAgo(-n);

/* ---------- métricas sintéticas (demo) ---------- */

const metricas = (base: number, trend: "up" | "down" | "flat"): MetricaSemana[] =>
  Array.from({ length: 8 }, (_, i) => {
    const factor = trend === "up" ? 1 + i * 0.05 : trend === "down" ? 1 - i * 0.06 : 1;
    return {
      semana: `S${i + 1}`,
      cpl: +(base * (2 - factor)).toFixed(2),
      ctr: +(1.8 * factor).toFixed(2),
      leads: Math.max(3, Math.round(20 * factor)),
      gasto: Math.round(800 * (1 + i * 0.05)),
    };
  });

const vendas = (
  ticketBase: number,
  scenario: "converte" | "vaza" | "seca" | "premium",
): VendaSemana[] =>
  Array.from({ length: 8 }, (_, i) => {
    const semana = `S${i + 1}`;
    let leads: number;
    let taxaFechar: number;
    let ticket = ticketBase;
    switch (scenario) {
      case "converte":
        leads = 10 + i;
        taxaFechar = 0.22 + i * 0.01;
        break;
      case "vaza":
        leads = 12 + i;
        taxaFechar = Math.max(0.05, 0.2 - i * 0.02);
        break;
      case "seca":
        leads = Math.max(3, 14 - i);
        taxaFechar = Math.max(0.06, 0.18 - i * 0.01);
        ticket = ticketBase * (1 - i * 0.02);
        break;
      case "premium":
        leads = 6 + Math.floor(i / 2);
        taxaFechar = 0.35;
        ticket = ticketBase * (1 + i * 0.03);
        break;
    }
    const reunioes = Math.round(leads * 0.6);
    const propostas = Math.round(reunioes * 0.7);
    const fechados = Math.max(0, Math.round(leads * taxaFechar));
    const receita = Math.round(fechados * ticket);
    return {
      semana,
      leads,
      reunioes,
      propostas,
      fechados,
      receita,
      ticketMedio: fechados ? Math.round(receita / fechados) : 0,
    };
  });

const RESUMOS_REUNIAO = [
  "Alinhamento de campanha e revisão de criativos aprovados.",
  "Revisão de resultados da semana e ajustes de segmentação.",
  "Kickoff: definição de público, tom de voz e diferenciais.",
  "Análise de funil e reforço de proposta comercial no fechamento.",
  "Feedback sobre roteiros e novos ângulos de anúncio.",
];
const reunioesHist = (dates: number[]): Reuniao[] =>
  dates.map((d, i) => ({ id: `r${i}`, data: daysAgo(d), resumo: RESUMOS_REUNIAO[i % 5] }));

const ctx = (nicho: string) => ({
  publicoAlvo: `Noivas 25-35 buscando ${nicho.toLowerCase()} de alto padrão em SP capital e interior.`,
  tomDeVoz: "Sofisticado, próximo e emocional — sem clichês românticos.",
  diferenciais: "Portfólio premiado, atendimento consultivo, pacotes personalizados.",
  sazonalidade: "Pico entre março–junho e setembro–novembro; captação forte jan/fev.",
});

/* ---------- inferências a partir da planilha de cobranças ---------- */

const parseBR = (s: string | null): Date | null => {
  if (!s) return null;
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
};

function inferNicho(nome: string): Nicho {
  const n = nome.toLowerCase();
  if (/\bdj\b/.test(n)) return "DJ";
  if (/celebrante/.test(n)) return "Celebrante";
  if (/fotografia|photografia|\bfoto\b|studio/.test(n)) return "Fotógrafo";
  if (/cine|films?|filmagem|v[ií]deo/.test(n)) return "Cinegrafista";
  if (/banda/.test(n)) return "Banda";
  if (/cerimonial|eventos|assessoria/.test(n)) return "Cerimonialista";
  return "Músico";
}

function inferEtapa(inicio: Date, termino: Date): Etapa {
  const now = Date.now();
  const dIni = (inicio.getTime() - now) / 86400000;
  const dTer = (termino.getTime() - now) / 86400000;
  if (dIni > 3) return "Onboarding";
  if (-dIni <= 30) return "Estruturação";
  if (dTer <= 30) return "Janela de Renovação";
  return "Operação Ativa";
}

const proximoPassoPorEtapa: Record<Etapa, string> = {
  Onboarding: "Realizar reunião de kickoff e coletar materiais de portfólio.",
  Estruturação: "Aprovar identidade e primeiros criativos da campanha.",
  "Operação Ativa": "Revisar métricas da semana e ajustar segmentação/criativos.",
  "Janela de Renovação": "Preparar proposta de renovação com case de resultados.",
  "Encerrado/Churn": "Arquivar histórico do cliente.",
};

const CONFIANCAS = ["Alta", "Média", "Baixa"] as const;
const TRENDS = ["up", "down", "flat"] as const;
const SCENARIOS = ["converte", "vaza", "seca", "premium"] as const;
const TICKETS = [3000, 5000, 8000, 12000, 6000, 9000];

/* [nome, plano, valorMensal|null, inicio, termino] — origem: planilha de cobranças 2026 */
type Row = [string, Plano, number | null, string | null, string | null];

const raw: Row[] = [
  ["Jean Roberto", "Essencial", 500, "29/05/2026", "29/08/2026"],
  ["Be. Cowork", "Growth", 300, "10/04/2026", "10/04/2027"],
  ["Betisa", "Essencial", 1000, "10/04/2026", "10/04/2027"],
  ["AnaLu", "Essencial", 200, "10/04/2026", "10/04/2027"],
  ["Eric Tedeschi", "Growth", 1126, "10/02/2026", "10/08/2026"],
  ["Danilo Romero", "Essencial", 600, "25/05/2026", "25/08/2026"],
  ["Airtonsax", "Essencial", 400, "27/02/2026", "27/05/2026"],
  ["CasarMus", "Essencial", 789, "11/05/2026", "11/08/2026"],
  ["Stella Ferreira", "Essencial", 600, "25/03/2026", "25/06/2026"],
  ["Vitor Catita", "Essencial", 600, "25/03/2026", "25/06/2026"],
  ["Wesley Vieira Arpeggio", "Growth", 900, "10/02/2026", "10/06/2026"],
  ["Joel Ramos Eventos", "Essencial", 600, "26/03/2026", "26/06/2026"],
  ["Fábio Gonzalez", "Growth", 789, "10/03/2026", "10/07/2026"],
  ["Alexandre Pissarro", "Growth", 1089, null, null],
  ["Bruna Canto e Prosa", "Essencial", 789, "31/03/2026", "30/06/2026"],
  ["Juliano Olcheski", "Essencial", null, "20/05/2026", "20/08/2026"],
  ["Cristina Nunes", "Essencial", 789, "01/04/2026", "01/07/2026"],
  ["Renato Munhoz", "Essencial", 789, "15/04/2026", "15/07/2026"],
  ["Wagner Bonato", "Essencial", 789, "25/06/2026", "25/09/2026"],
  ["Jaziel Lima", "Essencial", 789, "04/05/2026", "04/08/2026"],
  ["Banda Virada do Século", "Growth", 850, "05/05/2026", "25/06/2026"],
  ["Anderson Photografia", "Essencial", 689, "13/05/2026", "13/08/2026"],
  ["Pierre Trio Classico", "Essencial", 939, "15/06/2026", "15/09/2026"],
  ["Rodrigo Celebrante", "Essencial", 500, "15/05/2026", "15/08/2026"],
  ["Ricardo e Natalia", "Essencial", null, "25/05/2026", "25/08/2026"],
  ["Fernando Takehiro", "Estruturação Comercial", 712, "22/05/2026", "22/06/2026"],
  ["Wagner Dioli", "Essencial", 500, "20/05/2026", "20/09/2026"],
  ["DJ Dan Reis", "Growth", 1189, "29/05/2026", "29/08/2026"],
  ["Verbo Duo", "Essencial", 800, "10/06/2026", "10/09/2026"],
  ["Luciana Dornelas", "Essencial", null, null, null],
  ["Marcos Adriano", "Essencial", null, null, null],
  ["Mazetti Studio", "Essencial", null, null, null],
  ["Rubens Celebrante", "Essencial", 689, "10/06/2026", "10/09/2026"],
  ["Fatima Lamarque", "Essencial", 689, "01/06/2026", "01/09/2026"],
  ["Leandro de Paula", "Essencial", 689, "05/06/2026", "05/09/2026"],
  ["Cris Martinez", "Essencial", 689, "10/06/2026", "10/09/2026"],
  ["Rafa Musketeer", "Essencial", 689, "10/06/2026", "10/09/2026"],
  ["Rebeka Porto", "Essencial", 689, "10/06/2026", "10/09/2026"],
  ["Fabiano Assis", "Essencial", 689, "20/06/2026", "20/09/2026"],
  ["Michael Matt", "Estruturação Comercial", 747, "15/06/2026", "15/07/2026"],
  ["Luis Nassar", "Essencial", 689, "10/06/2026", "10/09/2026"],
  ["Denis Luz", "Estruturação Comercial", 747, "15/06/2026", "15/07/2026"],
  ["Fernando Bocão", "Growth", 1189, "10/07/2026", "10/09/2026"],
  ["Wes SOLM", "Estruturação Comercial", 747, "15/06/2026", "15/07/2026"],
  ["Aline Ribeiro Fotografia", "Essencial", 689, "19/06/2026", "19/09/2026"],
  ["Musica Nova", "Essencial", 626, "19/06/2026", "19/09/2026"],
  ["Danilo Catedral Music", "Estruturação Comercial", 747, "19/06/2026", "19/07/2026"],
  ["Miquéias Castro", "Essencial", 689, "23/06/2026", "23/09/2026"],
  ["Danilo Coutinho", "Estruturação Comercial", 747, "25/06/2026", "25/07/2026"],
  ["Zaqueu Celebrante", "Growth", 1189, "26/06/2026", "26/09/2026"],
  ["Fabiano Sax", "Estruturação Comercial", 747, "25/06/2026", "25/07/2026"],
  ["Harmony Music", "Estruturação Comercial", 747, "26/06/2026", "26/07/2026"],
  ["DJ Roberto Junior", "Growth", 1189, "29/06/2026", "29/09/2026"],
  ["Rodrigo Campos", "Estruturação Comercial", 747, "01/07/2026", "01/08/2026"],
];

export const seedClientes: Cliente[] = raw.map(([nome, plano, valor, inicioS, terminoS], i) => {
  const nicho = inferNicho(nome);
  const inicio = parseBR(inicioS) ?? new Date(today.getTime() - 30 * 86400000);
  const termino = parseBR(terminoS) ?? new Date(inicio.getTime() + 90 * 86400000);
  const etapaFunil = inferEtapa(inicio, termino);
  const valorMensal = valor ?? PLANO_MRR[plano];
  const reunioes =
    etapaFunil === "Onboarding" ? [] : reunioesHist(i % 2 ? [5, 18] : [8]);

  return {
    id: `c${i + 1}`,
    nome,
    nicho,
    plano,
    valorMensal,
    responsavel: RESPONSAVEIS[i % RESPONSAVEIS.length],
    dataInicio: iso(inicio),
    dataRenovacao: iso(termino),
    etapaFunil,
    statusPagamento: "Em dia",
    diasAtraso: 0,
    proximoPasso: proximoPassoPorEtapa[etapaFunil],
    confiancaFechamento:
      etapaFunil === "Janela de Renovação" ? CONFIANCAS[i % 3] : undefined,
    contextoMarca: ctx(nicho),
    metricasCampanha: metricas(40 + (i % 7) * 7, TRENDS[i % 3]),
    vendasCliente: vendas(TICKETS[i % TICKETS.length], SCENARIOS[i % 4]),
    reunioes,
  };
});

/* ---------- tarefas (daily) derivadas dos clientes ---------- */

const PRAZOS = [-2, 0, 1, 3, 5, 7];
const TAREFA_STATUS_CICLO = ["Pendente", "Em andamento", "Pendente", "Concluída"] as const;
const TAREFA_TIPO_POR_ETAPA: Record<Etapa, Tarefa["tipo"]> = {
  Onboarding: "Reunião",
  Estruturação: "Criativo",
  "Operação Ativa": "Outro",
  "Janela de Renovação": "Follow-up",
  "Encerrado/Churn": "Outro",
};

export const seedTarefas: Tarefa[] = seedClientes.slice(0, 24).map((c, i) => ({
  id: `t${i + 1}`,
  titulo: c.proximoPasso,
  clienteId: c.id,
  responsavel: c.responsavel,
  prazo: daysAhead(PRAZOS[i % PRAZOS.length]),
  status: TAREFA_STATUS_CICLO[i % 4],
  tipo: TAREFA_TIPO_POR_ETAPA[c.etapaFunil],
  origem: i % 5 === 0 ? "clickup" : "manual",
  criadaEm: daysAgo(10),
}));

/* ---------- agenda: reuniões agendadas para quem precisa ---------- */

const atHour = (dayOffset: number, hour: number, min = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return iso(d);
};
const HORAS = [9, 10, 11, 14, 15, 16];

const precisaReuniao = seedClientes.filter(
  (c) => c.etapaFunil === "Janela de Renovação" || c.etapaFunil === "Onboarding",
);
const algunsAtivos = seedClientes.filter((c) => c.etapaFunil === "Operação Ativa").slice(0, 3);
const paraAgendar = [...precisaReuniao, ...algunsAtivos].slice(0, 14);

export const seedAgendamentos: Agendamento[] = paraAgendar.map((c, i) => {
  const tipo =
    c.etapaFunil === "Onboarding"
      ? "Onboarding / Kickoff"
      : c.etapaFunil === "Janela de Renovação"
        ? "Renovação"
        : "Reunião de Resultados";
  return {
    id: `ag${i + 1}`,
    clienteId: c.id,
    data: atHour(i % 12, HORAS[i % HORAS.length]),
    duracaoMin: tipo === "Onboarding / Kickoff" ? 60 : 45,
    titulo: `${tipo} — ${c.nome}`,
    tipo,
    local: i % 3 === 0 ? "Presencial" : i % 3 === 1 ? "Google Meet" : "Ligação",
    responsavel: c.responsavel,
    status: "Agendada",
  };
});

/* ---------- rascunhos de IA de exemplo ---------- */

export const seedRoteiros: RoteiroIA[] = seedClientes.length
  ? [
      {
        id: "ro1",
        clienteId: seedClientes[0].id,
        tipo: "Roteiro de anúncio",
        texto:
          "[ABERTURA] \"As melhores datas de 2027 fecham primeiro.\"\n\n[DESENVOLVIMENTO] Atendimento premiado e portfólio de alto padrão para o dia mais importante da sua vida.\n\n[CTA] Chame no direct e garanta sua data.",
        criadoEm: daysAgo(4),
      },
    ]
  : [];
