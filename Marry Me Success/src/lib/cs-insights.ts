import type { Cliente, Tarefa } from "./cs-types";
import { diasAte, tendenciaCPLPior } from "./cs-store";

export interface Insight {
  tom: "positivo" | "atencao" | "risco";
  titulo: string;
  detalhe: string;
}

const soma = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((s, x) => s + f(x), 0);

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/**
 * Gera 3–6 bullets cruzando entregas × campanha × vendas do cliente × renovação.
 * Usado no bloco "Insights automáticos" da Ficha e como base para os
 * roteiros de IA e a pauta de reunião semanal.
 */
export function gerarInsights(c: Cliente, tarefas: Tarefa[]): Insight[] {
  const out: Insight[] = [];
  const m = c.metricasCampanha;
  const v = c.vendasCliente;

  // Campanha × Vendas
  if (m.length >= 6 && v.length >= 6) {
    const ultLeads = soma(m.slice(-3), (x) => x.leads);
    const antLeads = soma(m.slice(-6, -3), (x) => x.leads);
    const ultFech = soma(v.slice(-3), (x) => x.fechados);
    const antFech = soma(v.slice(-6, -3), (x) => x.fechados);

    if (ultLeads > antLeads * 1.1 && ultFech < antFech * 0.9) {
      out.push({
        tom: "risco",
        titulo: "Gargalo comercial: leads chegam, não convertem",
        detalhe: `Leads +${Math.round((ultLeads / antLeads - 1) * 100)}% nas últimas 3 semanas, mas contratos fechados caíram ${Math.round((1 - ultFech / Math.max(antFech, 1)) * 100)}%. Revisar script de atendimento e velocidade de resposta.`,
      });
    } else if (ultLeads < antLeads * 0.8 && ultFech < antFech * 0.8) {
      out.push({
        tom: "risco",
        titulo: "Queda simultânea de leads e vendas",
        detalhe: "Mídia e comercial caindo juntos — sinal de saturação de criativo ou público. Sugerir novo ângulo de anúncio e teste de público lookalike novo.",
      });
    } else if (ultLeads >= antLeads * 0.95 && ultFech > antFech * 1.1) {
      out.push({
        tom: "positivo",
        titulo: "Comercial afiado — conversão em alta",
        detalhe: `Mesmo volume de leads, contratos fechados +${Math.round((ultFech / Math.max(antFech, 1) - 1) * 100)}%. Bom momento para pedir depoimentos e case.`,
      });
    }
  }

  // CPL subindo
  if (m.length >= 4 && tendenciaCPLPior(c)) {
    const ultCPL = m[m.length - 1].cpl;
    out.push({
      tom: "atencao",
      titulo: `CPL em alta (última semana: R$ ${ultCPL.toFixed(2)})`,
      detalhe: "Pausar 2 criativos de menor CTR, duplicar público lookalike 1% com criativo novo em vídeo e testar -20% no orçamento por 7 dias para reoxigenar entrega.",
    });
  }

  // Ticket médio
  if (v.length >= 4) {
    const ultTicket = v.slice(-3).map((x) => x.ticketMedio).filter(Boolean);
    const antTicket = v.slice(-6, -3).map((x) => x.ticketMedio).filter(Boolean);
    const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
    const u = media(ultTicket);
    const a = media(antTicket);
    if (u && a && u > a * 1.1) {
      out.push({
        tom: "positivo",
        titulo: `Ticket médio subindo (R$ ${Math.round(u).toLocaleString("pt-BR")})`,
        detalhe: "O público qualificado paga mais. Vale reforçar upsell de pacotes premium na campanha e no atendimento.",
      });
    } else if (u && a && u < a * 0.85) {
      out.push({
        tom: "atencao",
        titulo: "Ticket médio caindo",
        detalhe: "Público chegando mais barato — revisar segmentação para não descaracterizar o posicionamento.",
      });
    }
  }

  // Sem propostas
  const semPropostas = v.slice(-2).every((x) => x.propostas === 0);
  if (v.length >= 2 && semPropostas) {
    out.push({
      tom: "risco",
      titulo: "Nenhuma proposta enviada nas últimas 2 semanas",
      detalhe: "Follow-up comercial parou. Sugerir cadência: 24h após lead, 3 dias, 7 dias.",
    });
  }

  // Entregas
  const atrasadasCriativo = tarefas.filter(
    (t) => t.clienteId === c.id && t.status !== "Concluída" && t.tipo === "Criativo" &&
      new Date(t.prazo).getTime() < Date.now(),
  ).length;
  if (atrasadasCriativo >= 2) {
    out.push({
      tom: "risco",
      titulo: `${atrasadasCriativo} criativos atrasados`,
      detalhe: "Produção travada — a campanha vai estagnar em 1-2 semanas. Escalar internamente.",
    });
  }

  // Renovação
  const dias = diasAte(c.dataRenovacao);
  if (dias >= 0 && dias <= 30 && c.etapaFunil !== "Encerrado/Churn") {
    const totalFech = soma(v, (x) => x.fechados);
    const totalRec = soma(v, (x) => x.receita);
    if (totalFech > 0) {
      out.push({
        tom: "positivo",
        titulo: `Case pronto para pitch de renovação (renova em ${dias}d)`,
        detalhe: `Nos últimos 2 meses o cliente fechou ${totalFech} contratos e ${Number(totalRec).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} em receita — usar como argumento comercial.`,
      });
    } else {
      out.push({
        tom: "risco",
        titulo: `Renovação em ${dias}d sem resultados para mostrar`,
        detalhe: "Sem fechamentos no período. Alta chance de churn — trazer plano de correção antes da conversa.",
      });
    }
  }

  return out.slice(0, 6);
}

export function insightsResumoTexto(c: Cliente, insights: Insight[]): string {
  const linhas = insights.map((i, idx) => `${idx + 1}. [${i.tom.toUpperCase()}] ${i.titulo}\n   ${i.detalhe}`);
  return `Pauta automática — ${c.nome}\n\n${linhas.join("\n\n")}`;
}

/* ---------------------------------------------------------------------------
 * Resumos consolidados de campanha e vendas — alimentam os cartões da ficha.
 * ------------------------------------------------------------------------- */

export interface ResumoCampanha {
  gastoTotal: number;
  leadsTotal: number;
  cplMedio: number;
  ctrMedio: number;
  deltaCplPct: number; // positivo = CPL piorou
  deltaLeadsPct: number;
}

export function resumoCampanha(c: Cliente): ResumoCampanha {
  const m = c.metricasCampanha;
  if (!m.length) {
    return { gastoTotal: 0, leadsTotal: 0, cplMedio: 0, ctrMedio: 0, deltaCplPct: 0, deltaLeadsPct: 0 };
  }
  const gastoTotal = soma(m, (x) => x.gasto);
  const leadsTotal = soma(m, (x) => x.leads);
  const cplMedio = leadsTotal ? gastoTotal / leadsTotal : 0;
  const ctrMedio = soma(m, (x) => x.ctr) / m.length;

  const ini = m.slice(0, 3);
  const fim = m.slice(-3);
  const media = (arr: typeof m, f: (x: (typeof m)[number]) => number) =>
    arr.length ? soma(arr, f) / arr.length : 0;
  const cplIni = media(ini, (x) => x.cpl);
  const cplFim = media(fim, (x) => x.cpl);
  const leadsIni = media(ini, (x) => x.leads);
  const leadsFim = media(fim, (x) => x.leads);
  const deltaCplPct = cplIni ? ((cplFim - cplIni) / cplIni) * 100 : 0;
  const deltaLeadsPct = leadsIni ? ((leadsFim - leadsIni) / leadsIni) * 100 : 0;

  return { gastoTotal, leadsTotal, cplMedio, ctrMedio, deltaCplPct, deltaLeadsPct };
}

export interface ResumoVendas {
  receitaTotal: number;
  fechadosTotal: number;
  propostasTotal: number;
  reunioesTotal: number;
  leadsTotal: number;
  ticketMedio: number;
  conversao: number; // fechados / leads %
  taxaProposta: number; // propostas / leads %
  roas: number; // receita do cliente / gasto de mídia
  cac: number; // gasto de mídia / contratos fechados
}

export function resumoVendas(c: Cliente): ResumoVendas {
  const v = c.vendasCliente;
  const gasto = soma(c.metricasCampanha, (x) => x.gasto);
  if (!v.length) {
    return { receitaTotal: 0, fechadosTotal: 0, propostasTotal: 0, reunioesTotal: 0, leadsTotal: 0, ticketMedio: 0, conversao: 0, taxaProposta: 0, roas: 0, cac: 0 };
  }
  const receitaTotal = soma(v, (x) => x.receita);
  const fechadosTotal = soma(v, (x) => x.fechados);
  const propostasTotal = soma(v, (x) => x.propostas);
  const reunioesTotal = soma(v, (x) => x.reunioes);
  const leadsTotal = soma(v, (x) => x.leads);
  const ticketMedio = fechadosTotal ? receitaTotal / fechadosTotal : 0;
  const conversao = leadsTotal ? (fechadosTotal / leadsTotal) * 100 : 0;
  const taxaProposta = leadsTotal ? (propostasTotal / leadsTotal) * 100 : 0;
  const roas = gasto ? receitaTotal / gasto : 0;
  const cac = fechadosTotal ? gasto / fechadosTotal : 0;
  return { receitaTotal, fechadosTotal, propostasTotal, reunioesTotal, leadsTotal, ticketMedio, conversao, taxaProposta, roas, cac };
}

/**
 * Recomendações estratégicas de melhoria para a conta como um todo —
 * combina mídia, funil comercial, entregas e ciclo de renovação em
 * próximos passos acionáveis. Reutiliza o tipo Insight para renderização.
 */
export function gerarRecomendacoes(c: Cliente, tarefas: Tarefa[]): Insight[] {
  const out: Insight[] = [];
  const rc = resumoCampanha(c);
  const rv = resumoVendas(c);
  const dias = diasAte(c.dataRenovacao);

  // Escala de verba com base no ROAS
  if (rv.roas >= 5) {
    out.push({
      tom: "positivo",
      titulo: `ROAS forte (${rv.roas.toFixed(1)}x) — espaço para escalar`,
      detalhe: `Cada R$ 1 investido retornou R$ ${rv.roas.toFixed(2)} para o cliente. Propor aumento de +20% no orçamento nos conjuntos de melhor CPA e duplicar o público vencedor.`,
    });
  } else if (rv.roas > 0 && rv.roas < 2) {
    out.push({
      tom: "risco",
      titulo: `ROAS baixo (${rv.roas.toFixed(1)}x) — corrigir antes de escalar`,
      detalhe: "Não aumentar verba ainda. Revisar oferta, segmentação e página de conversão; testar novo ângulo criativo antes de subir investimento.",
    });
  }

  // Gargalo comercial
  if (rv.conversao > 0 && rv.conversao < 10) {
    out.push({
      tom: "atencao",
      titulo: `Conversão lead→contrato em ${rv.conversao.toFixed(1)}%`,
      detalhe: `Gargalo está no comercial, não na mídia (${rv.leadsTotal} leads gerados). Implementar cadência de follow-up (24h / 3d / 7d) e script de qualificação.`,
    });
  }

  // Propostas paradas
  if (rv.propostasTotal > 0 && rv.fechadosTotal / Math.max(rv.propostasTotal, 1) < 0.4) {
    out.push({
      tom: "atencao",
      titulo: "Muitas propostas, poucos fechamentos",
      detalhe: "Trabalhar quebra de objeções e senso de urgência (datas limitadas). Sugerir prova social e depoimentos no momento da proposta.",
    });
  }

  // Ticket premium → upsell
  if (rv.ticketMedio >= 12000) {
    out.push({
      tom: "positivo",
      titulo: `Ticket médio alto (${fmtBRL(rv.ticketMedio)})`,
      detalhe: "Público qualificado paga mais — reforçar pacotes premium e upsell na campanha e no atendimento para elevar ainda mais o ticket.",
    });
  }

  // CPL em alta
  if (rc.deltaCplPct > 15) {
    out.push({
      tom: "atencao",
      titulo: `CPL subiu ${rc.deltaCplPct.toFixed(0)}% no período`,
      detalhe: "Sinal de fadiga de criativo. Renovar 2–3 criativos por semana e testar novos formatos (reels/depoimento) para reoxigenar a entrega.",
    });
  }

  // Renovação
  if (dias >= 0 && dias <= 45 && c.etapaFunil !== "Encerrado/Churn") {
    out.push({
      tom: rv.fechadosTotal > 0 ? "positivo" : "risco",
      titulo: `Renovação em ${dias}d — preparar o pitch`,
      detalhe:
        rv.fechadosTotal > 0
          ? `Montar case com ${rv.fechadosTotal} contratos e ${fmtBRL(rv.receitaTotal)} gerados. Levar proposta de continuidade com meta de crescimento.`
          : "Sem resultados fortes para mostrar. Trazer plano de correção e metas claras antes da conversa de renovação.",
    });
  }

  // Cadência de criativos travada
  const criativosAbertos = tarefas.filter(
    (t) => t.clienteId === c.id && t.tipo === "Criativo" && t.status !== "Concluída",
  ).length;
  if (criativosAbertos === 0 && c.etapaFunil === "Operação Ativa") {
    out.push({
      tom: "atencao",
      titulo: "Sem criativos em produção",
      detalhe: "Nenhuma peça nova na fila. Programar próxima leva de criativos para evitar estagnação da campanha nas próximas semanas.",
    });
  }

  return out.slice(0, 6);
}
