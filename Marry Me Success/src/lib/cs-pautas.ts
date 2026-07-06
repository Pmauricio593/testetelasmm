/**
 * Pautas (Ferramentas) — templates de prompt para o operador montar o pedido
 * e rodar o modelo POR FORA (o software não executa IA). Suporta variações A/B/C.
 */

export interface Pauta {
  id: string;
  nome: string;
  descricao: string;
  anexosNecessarios: string[];
  exigePlanilha: boolean;
  suportaVariacoes: boolean;
  promptTemplate: string;
}

export interface DadosPedido {
  cliente: string;
  briefing: string;
  contexto: string;
  objetivo: string;
  observacoes: string;
  anexos: string;
}

export const seedPautas: Pauta[] = [
  {
    id: "reels",
    nome: "Roteiro de Reels",
    descricao: "Roteiro cena a cena para Reels/TikTok de fornecedor de casamento.",
    anexosNecessarios: ["Referências de vídeo / concorrentes", "Portfólio ou cenas disponíveis"],
    exigePlanilha: false,
    suportaVariacoes: true,
    promptTemplate:
      "Você é um roteirista especialista em vídeos curtos (Reels) para o mercado de casamentos.\n\n" +
      "Crie um ROTEIRO DE REELS para o cliente {CLIENTE}.\n\n" +
      "Objetivo do vídeo: {OBJETIVO}\n" +
      "Briefing: {BRIEFING}\n" +
      "Contexto de marca: {CONTEXTO}\n" +
      "Observações: {OBSERVACOES}\n" +
      "Materiais/anexos: {ANEXOS}\n" +
      "{VARIACAO}\n\n" +
      "Entregue:\n- Gancho (0–2s)\n- Desenvolvimento cena a cena (tempo · imagem/ação · fala · texto na tela)\n- CTA final\n- Legenda + hashtags",
  },
  {
    id: "reuniao",
    nome: "Reunião de Resultados",
    descricao: "Pauta + análise para a reunião de resultados do cliente.",
    anexosNecessarios: ["Planilha de métricas do período (campanha + vendas)"],
    exigePlanilha: true,
    suportaVariacoes: false,
    promptTemplate:
      "Você é um analista de Customer Success. Monte a PAUTA e a ANÁLISE para a reunião de resultados do cliente {CLIENTE}.\n\n" +
      "Objetivo da reunião: {OBJETIVO}\n" +
      "Período/briefing: {BRIEFING}\n" +
      "Contexto: {CONTEXTO}\n" +
      "Observações: {OBSERVACOES}\n" +
      "Dados anexados (planilha de métricas): {ANEXOS}\n" +
      "{VARIACAO}\n\n" +
      "Entregue: resumo executivo (KPIs), leitura do funil, o que funcionou e o que não funcionou, recomendações e plano de ação com responsáveis e prazos.",
  },
  {
    id: "copy",
    nome: "Copy para Anúncio",
    descricao: "Copy de Meta Ads (texto primário, títulos, CTA) para fornecedor de casamento.",
    anexosNecessarios: ["Diferenciais e provas sociais"],
    exigePlanilha: false,
    suportaVariacoes: true,
    promptTemplate:
      "Você é um copywriter de Meta Ads para o mercado de casamentos. Escreva a copy do anúncio para {CLIENTE}.\n\n" +
      "Objetivo: {OBJETIVO}\n" +
      "Briefing: {BRIEFING}\n" +
      "Contexto de marca: {CONTEXTO}\n" +
      "Observações: {OBSERVACOES}\n" +
      "Referências/anexos: {ANEXOS}\n" +
      "{VARIACAO}\n\n" +
      "Entregue: 3 ganchos, texto primário, 3 títulos, descrição, CTA e hashtags.",
  },
];

const val = (s: string) => (s && s.trim() ? s.trim() : "—");

export function montarPrompt(p: Pauta, d: DadosPedido, variacao?: string): string {
  const varTxt = variacao
    ? `Esta é a VARIAÇÃO ${variacao} — use um ângulo, gancho e tom distintos das outras variações.`
    : "";
  return p.promptTemplate
    .replaceAll("{CLIENTE}", val(d.cliente))
    .replaceAll("{OBJETIVO}", val(d.objetivo))
    .replaceAll("{BRIEFING}", val(d.briefing))
    .replaceAll("{CONTEXTO}", val(d.contexto))
    .replaceAll("{OBSERVACOES}", val(d.observacoes))
    .replaceAll("{ANEXOS}", val(d.anexos))
    .replaceAll("{VARIACAO}", varTxt);
}
