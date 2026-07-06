/**
 * Dados financeiros — snapshot de Julho/2026.
 * Fonte: planilhas "Régua de Cobranças" (recebimentos) e
 * "Orçamento Real — Controle Financeiro" (contas a pagar de julho).
 *
 * A régua de cobrança é calculada relativa a uma data de referência
 * (REF_HOJE) para que o snapshot permaneça coerente independente de quando
 * o app é aberto.
 */

export const REF_HOJE = new Date(2026, 6, 2); // 02/07/2026

export type CobrancaStatus = "Quitado" | "Em Aberto" | "Atrasado";
export type CompetenciaMes = "Junho" | "Julho";

export interface Recebimento {
  nome: string;
  valor: number;
  venc: string; // "dd/mm"
  mes: CompetenciaMes;
  status: CobrancaStatus;
  multa?: boolean;
}

/* -------- Recebimentos: Julho (49) + atrasados de Junho (régua rígida) -------- */

type RRow = [string, number, string, CobrancaStatus, boolean?];

const julho: RRow[] = [
  ["Cristina Nunes", 885, "05/07", "Em Aberto"],
  ["Jean Roberto", 500, "05/07", "Quitado"],
  ["Wesley Vieira Saxofonista", 450, "05/07", "Quitado"],
  ["DJ Roberto Junior", 1189, "05/07", "Em Aberto"],
  ["CasarMus", 789, "08/07", "Em Aberto"],
  ["Be. Cowork", 300, "10/07", "Em Aberto"],
  ["Betisa", 1000, "10/07", "Em Aberto"],
  ["Fábio Gonzalez", 789, "10/07", "Em Aberto"],
  ["Fernando Bocão", 1189, "10/07", "Em Aberto"],
  ["Jaziel Lima", 789, "10/07", "Em Aberto"],
  ["Michael Matt", 689, "10/07", "Em Aberto"],
  ["Rafa Musketeer", 789, "10/07", "Em Aberto"],
  ["Rodrigo Celebrante", 500, "10/07", "Em Aberto"],
  ["Verbo Duo", 800, "10/07", "Em Aberto"],
  ["Cris Martinez", 689, "15/07", "Em Aberto"],
  ["DJ Dan Reis", 1189, "15/07", "Em Aberto"],
  ["Flavio Rodrigues", 1000, "15/07", "Em Aberto"],
  ["Pierre Ricardo", 939, "15/07", "Em Aberto"],
  ["Danilo", 689, "20/07", "Em Aberto"],
  ["Musica Nova", 689, "20/07", "Em Aberto"],
  ["Fabiano Assis", 689, "20/07", "Em Aberto"],
  ["Fatima Lamarque", 689, "20/07", "Em Aberto"],
  ["Wagner Dioli", 500, "20/07", "Em Aberto"],
  ["Banda Virada do Século", 689, "20/07", "Em Aberto"],
  ["Leandro de Paula", 689, "20/07", "Em Aberto"],
  ["Wesley Vieira Saxofonista", 450, "21/07", "Em Aberto"],
  ["Rubens Celebrante", 689, "25/07", "Em Aberto"],
  ["Rubens Celebrante (2ª cobrança)", 689, "25/07", "Em Aberto"],
  ["Wagner Bonato", 789, "25/07", "Em Aberto"],
  ["Danilo Romero", 600, "25/07", "Em Aberto"],
  ["Ricardo e Natalia", 689, "25/07", "Em Aberto"],
  ["Stella Ferreira", 789, "25/07", "Em Aberto"],
  ["Vitor Catita", 600, "25/07", "Em Aberto"],
  ["Wes SOLM", 689, "25/07", "Em Aberto"],
  ["Zaqueu", 3100, "26/07", "Quitado"],
  ["AnaLu", 200, "30/07", "Em Aberto"],
  ["Renato Munhoz", 789, "30/07", "Em Aberto"],
  ["Rebeka Porto", 689, "30/07", "Em Aberto"],
  ["Joel Ramos Eventos", 600, "30/07", "Em Aberto"],
];

// Atrasados de Junho ainda em aberto — populam a régua rígida (D+7 a D+30)
const junhoAtrasados: RRow[] = [
  ["Eric Tedeschi", 1189, "01/05", "Atrasado"],
  ["Denis Luz", 747, "15/06", "Atrasado"],
  ["Samuel Linares", 500, "15/06", "Atrasado", true],
  ["Rubens Celebrante", 689, "25/06", "Atrasado"],
  ["Fabiano Assis", 689, "20/06", "Atrasado"],
  ["Fatima Lamarque", 489, "20/06", "Atrasado"],
  ["Wagner Dioli", 500, "20/06", "Atrasado"],
  ["Rebeka Porto", 720, "30/06", "Atrasado"],
  ["Joel Ramos Eventos", 600, "30/06", "Atrasado"],
  ["Renato Munhoz", 789, "30/06", "Atrasado"],
];

export const RECEBIMENTOS: Recebimento[] = [
  ...julho.map(([nome, valor, venc, status, multa]) => ({ nome, valor, venc, status, multa, mes: "Julho" as const })),
  ...junhoAtrasados.map(([nome, valor, venc, status, multa]) => ({ nome, valor, venc, status, multa, mes: "Junho" as const })),
];

/* ------------------------------ Régua de cobrança ------------------------------ */

export type ReguaTom = "neutro" | "info" | "aviso" | "risco" | "critico";

export interface ReguaEtapa {
  id: string;
  label: string;
  curto: string;
  dia: number; // gatilho em dias relativos ao vencimento
  tom: ReguaTom;
  acao: string;
  template: string;
}

export const REGUA: ReguaEtapa[] = [
  {
    id: "a-vencer",
    label: "A vencer",
    curto: "A vencer",
    dia: -999,
    tom: "neutro",
    acao: "Dentro do prazo",
    template:
      "Olá, {NOME}! Tudo certo? Sua fatura do {PLANO} vence em {VENCIMENTO} (R$ {VALOR}). Qualquer coisa, estou à disposição. 💛",
  },
  {
    id: "d-5",
    label: "D-5 · Lembrete",
    curto: "D-5",
    dia: -5,
    tom: "info",
    acao: "Enviar boleto",
    template:
      "Olá, {NOME}. Tudo bem?\nAqui é o Financeiro da Marry Me!\n\nSegue o boleto referente ao {PLANO}:\nVencimento: {VENCIMENTO}\nValor: R$ {VALOR}\nLink da Fatura:\n\nSe precisar de 2ª via ou envio para o responsável financeiro, é só me informar por aqui.",
  },
  {
    id: "d-3",
    label: "D-3 · Lembrete",
    curto: "D-3",
    dia: -3,
    tom: "info",
    acao: "Confirmar recebimento",
    template:
      "Olá, {NOME}.\nPassando para confirmar: o boleto do {PLANO} com vencimento em {VENCIMENTO} chegou corretamente?\nSe preferir Pix, 2ª via ou encaminhar para o financeiro/administrativo, me avise e eu envio no formato ideal.",
  },
  {
    id: "venc",
    label: "Vencimento",
    curto: "Venc.",
    dia: 0,
    tom: "aviso",
    acao: "Lembrete de vencimento",
    template:
      "Oi, {NOME}! Passando só pra lembrar que hoje vence o pagamento do {PLANO} – Marry Me.\n\nValor: R$ {VALOR}\nBoleto: {BOLETO_LINK}\nPix: {PIX_COPIA_COLA}\n\nSe já pagou pode desconsiderar, obrigado! 🙏",
  },
  {
    id: "d2",
    label: "D+2 · Cobrança",
    curto: "D+2",
    dia: 2,
    tom: "aviso",
    acao: "Verificar compensação",
    template:
      "Oi, {NOME}! Tudo bem?\n\nVi aqui que ainda não apareceu a compensação do pagamento do {PLANO} com vencimento em {VENCIMENTO}.\n\nVocê consegue me confirmar se conseguiu acessar o link ou se já foi pago?",
  },
  {
    id: "d5",
    label: "D+5 · Cobrança",
    curto: "D+5",
    dia: 5,
    tom: "risco",
    acao: "Pedir previsão",
    template:
      "Olá, {NOME}! Reforço do Financeiro Marry Me: ainda não identificamos a compensação do {PLANO} vencido em {VENCIMENTO}.\n\nPara manter o cronograma em dia, pode me informar uma previsão de pagamento até quando?\nSe preferir, posso reenviar por Pix/2ª via.\n\nBoleto: {BOLETO_LINK}\nPix: {PIX_COPIA_COLA}",
  },
  {
    id: "d7",
    label: "D+7 · ⏸ Pausa",
    curto: "D+7",
    dia: 7,
    tom: "risco",
    acao: "Aviso de pausa",
    template:
      "Olá, {NOME}.\nFinanceiro Marry Me aqui, o {PLANO} (venc. {VENCIMENTO}) segue em aberto.\nLembrando que, se não tivermos a confirmação do pagamento, vamos precisar pausar temporariamente a execução/atendimento e retomamos assim que regularizar, ok?\nBoleto: {BOLETO_LINK} | Pix: {PIX_COPIA_COLA}",
  },
  {
    id: "d15",
    label: "D+15 · Atendimento pausado",
    curto: "D+15",
    dia: 15,
    tom: "risco",
    acao: "Reforçar regularização",
    template:
      "Olá, {NOME}. O {PLANO} (venc. {VENCIMENTO}) segue em aberto há 15 dias e a execução está pausada. Para retomarmos o atendimento precisamos regularizar o pagamento. Consegue acertar ainda esta semana?\nBoleto: {BOLETO_LINK} | Pix: {PIX_COPIA_COLA}",
  },
  {
    id: "d21",
    label: "D+21 · ⚠ Rescisão",
    curto: "D+21",
    dia: 21,
    tom: "critico",
    acao: "Aviso de rescisão",
    template:
      "Olá, {NOME}. Como não tivemos retorno sobre o {PLANO} vencido em {VENCIMENTO} (21 dias em aberto), este é o aviso formal de que o contrato entrará em processo de rescisão por inadimplência caso o pagamento não seja regularizado em até 72h. Seguimos à disposição para negociar.",
  },
  {
    id: "d30",
    label: "D+30 · 🔴 Negativação",
    curto: "D+30",
    dia: 30,
    tom: "critico",
    acao: "Negativação / protesto",
    template:
      "Olá, {NOME}. O {PLANO} vencido em {VENCIMENTO} completa 30 dias em aberto. Sem a regularização, o débito será encaminhado para protesto/negativação e o contrato considerado rescindido. Ainda dá tempo de resolver — me chame para acertarmos.",
  },
];

const DIA = 86400000;

export function parseVenc(venc: string, ano = 2026): Date | null {
  const m = /(\d{1,2})\/(\d{1,2})/.exec(venc);
  if (!m) return null;
  return new Date(ano, Number(m[2]) - 1, Number(m[1]));
}

/** Etapa atual da régua para uma cobrança em aberto, relativa a REF_HOJE. */
export function etapaDaCobranca(r: Recebimento, hoje = REF_HOJE): ReguaEtapa {
  const venc = parseVenc(r.venc);
  if (!venc) return REGUA[0];
  const dias = Math.floor((hoje.getTime() - venc.getTime()) / DIA);
  let atual = REGUA[0];
  for (const e of REGUA) if (dias >= e.dia) atual = e;
  return atual;
}

const primeiroNome = (nome: string) => nome.split(" ")[0];

export function preencherTemplate(e: ReguaEtapa, r: Recebimento): string {
  return e.template
    .replaceAll("{NOME}", primeiroNome(r.nome))
    .replaceAll("{PLANO}", r.multa ? "acordo/multa" : "plano Marry Me")
    .replaceAll("{VALOR}", r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))
    .replaceAll("{VENCIMENTO}", r.venc)
    .replaceAll("{EMPRESA}", "Marry Me")
    .replaceAll("{BOLETO_LINK}", "asaas.com/b/•••")
    .replaceAll("{PIX_COPIA_COLA}", "00020126•••BR");
}

/* ------------------------------ Contas a pagar — Julho ------------------------------ */

export type CategoriaDespesa =
  | "Folha de pagamento"
  | "Marketing / Ads"
  | "Impostos"
  | "Ferramentas / TI"
  | "Outras saídas"
  | "Tarifas de cobrança";

export interface ContaPagar {
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  venc: string; // "dd/mm"
}

type PRow = [string, CategoriaDespesa, number, string];

const pagarRows: PRow[] = [
  ["Folha — Paulo", "Folha de pagamento", 4000, "10/07"],
  ["Meta Ads", "Marketing / Ads", 3000, "24/07"],
  ["Imposto (Simples Nacional)", "Impostos", 2699.44, "10/07"],
  ["Folha — Kauê", "Folha de pagamento", 2000, "08/07"],
  ["Folha — Murilo", "Folha de pagamento", 2000, "08/07"],
  ["Empréstimo", "Outras saídas", 1537, "20/07"],
  ["Folha — Paulo Maurício", "Folha de pagamento", 1200, "08/07"],
  ["Folha — Cristal", "Folha de pagamento", 900, "08/07"],
  ["Folha — João", "Folha de pagamento", 900, "08/07"],
  ["Folha — Giovanni", "Folha de pagamento", 900, "08/07"],
  ["Folha — Gabriel", "Folha de pagamento", 700, "08/07"],
  ["Claude (conta consolidada)", "Ferramentas / TI", 700, "20/07"],
  ["Guru", "Outras saídas", 600, "20/07"],
  ["Folha — Rafael", "Folha de pagamento", 500, "08/07"],
  ["Conta PF do Paulo", "Outras saídas", 500, "20/07"],
  ["Agillize Contabilidade", "Impostos", 259, "12/07"],
  ["Google Workspace", "Ferramentas / TI", 250, "10/07"],
  ["Allugator", "Ferramentas / TI", 198, "15/07"],
  ["FireFlies", "Ferramentas / TI", 110, "10/07"],
  ["Tarifa de Recebimento Asaas", "Tarifas de cobrança", 80, "20/07"],
  ["CapCut", "Ferramentas / TI", 65.9, "08/07"],
  ["Captions", "Ferramentas / TI", 49.99, "20/07"],
  ["ZapSign", "Ferramentas / TI", 39.9, "17/07"],
  ["Canva", "Ferramentas / TI", 35, "10/07"],
];

export const CONTAS_PAGAR: ContaPagar[] = pagarRows.map(([descricao, categoria, valor, venc]) => ({
  descricao,
  categoria,
  valor,
  venc,
}));

export const CATEGORIAS_ORDEM: CategoriaDespesa[] = [
  "Folha de pagamento",
  "Marketing / Ads",
  "Impostos",
  "Outras saídas",
  "Ferramentas / TI",
  "Tarifas de cobrança",
];

/* ------------------------------ helpers de agregação ------------------------------ */

export const somaValor = <T extends { valor: number }>(arr: T[]) =>
  arr.reduce((s, x) => s + x.valor, 0);

export const fmtMoeda = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
