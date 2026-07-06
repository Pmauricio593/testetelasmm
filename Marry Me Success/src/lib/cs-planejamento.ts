/**
 * Planejamento Anual 2026 — 3 cenários (Pé no Chão / Meta / Sonho).
 * Fonte: planilha "Planejamento Anual 2026 — Projeção MRR". Mai/26 → Dez/26.
 */

export type CenarioId = "PNC" | "META" | "SONHO";

export interface MesPlano {
  mes: string; ym: string;
  clientesInicio: number; churn: number; novosInbound: number; novosOutbound: number; clientesFim: number;
  taxaChurn: number; ticket: number; mrrBruto: number; inadimplencia: number; mrrLiquido: number;
  arr: number; receitaAcum: number; capacidadeCS: number; unidadesCS: number;
  novos: number; metaNovoMRR: number;
}

export const CENARIOS: { id: CenarioId; nome: string; alvo: string; alvoARR: number; clientesFinal: number; mrrBrutoFinal: number }[] = [
  { id: "PNC", nome: "Pé no Chão", alvo: "R$ 1,0MM ARR", alvoARR: 1009720, clientesFinal: 105, mrrBrutoFinal: 84143 },
  { id: "META", nome: "Meta", alvo: "R$ 1,5MM ARR", alvoARR: 1510936, clientesFinal: 157, mrrBrutoFinal: 125911 },
  { id: "SONHO", nome: "Sonho", alvo: "R$ 2,0MM ARR", alvoARR: 2065295, clientesFinal: 191, mrrBrutoFinal: 172108 },
];

export const PLANOS: Record<CenarioId, MesPlano[]> = {
  PNC: [
  { mes: "Mai/26", ym: "2026-05", clientesInicio: 43, churn: 3, novosInbound: 4, novosOutbound: 2, clientesFim: 47, taxaChurn: 0, ticket: 740, mrrBruto: 34636, inadimplencia: 19, mrrLiquido: 28055, arr: 415632, receitaAcum: 0, capacidadeCS: 35, unidadesCS: 1.0, novos: 6, metaNovoMRR: 4440 },
  { mes: "Jun/26", ym: "2026-06", clientesInicio: 47, churn: 3, novosInbound: 4, novosOutbound: 2, clientesFim: 50, taxaChurn: 0, ticket: 750, mrrBruto: 37498, inadimplencia: 18, mrrLiquido: 30748, arr: 449974, receitaAcum: 0, capacidadeCS: 53, unidadesCS: 2.0, novos: 6, metaNovoMRR: 4500 },
  { mes: "Jul/26", ym: "2026-07", clientesInicio: 50, churn: 3, novosInbound: 6, novosOutbound: 2, clientesFim: 54, taxaChurn: 0, ticket: 760, mrrBruto: 41418, inadimplencia: 16, mrrLiquido: 34791, arr: 497015, receitaAcum: 0, capacidadeCS: 53, unidadesCS: 2.0, novos: 8, metaNovoMRR: 6080 },
  { mes: "Ago/26", ym: "2026-08", clientesInicio: 54, churn: 3, novosInbound: 10, novosOutbound: 2, clientesFim: 64, taxaChurn: 0, ticket: 770, mrrBruto: 49105, inadimplencia: 14, mrrLiquido: 42230, arr: 589257, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 12, metaNovoMRR: 9240 },
  { mes: "Set/26", ym: "2026-09", clientesInicio: 64, churn: 3, novosInbound: 16, novosOutbound: 2, clientesFim: 79, taxaChurn: 0, ticket: 785, mrrBruto: 61939, inadimplencia: 12, mrrLiquido: 54506, arr: 743263, receitaAcum: 0, capacidadeCS: 88, unidadesCS: 3.0, novos: 18, metaNovoMRR: 14130 },
  { mes: "Out/26", ym: "2026-10", clientesInicio: 79, churn: 4, novosInbound: 14, novosOutbound: 2, clientesFim: 91, taxaChurn: 0, ticket: 790, mrrBruto: 72168, inadimplencia: 11, mrrLiquido: 64230, arr: 866017, receitaAcum: 0, capacidadeCS: 105, unidadesCS: 3.0, novos: 16, metaNovoMRR: 12640 },
  { mes: "Nov/26", ym: "2026-11", clientesInicio: 91, churn: 4, novosInbound: 12, novosOutbound: 2, clientesFim: 101, taxaChurn: 0, ticket: 795, mrrBruto: 80487, inadimplencia: 10, mrrLiquido: 72438, arr: 965841, receitaAcum: 0, capacidadeCS: 105, unidadesCS: 3.0, novos: 14, metaNovoMRR: 11130 },
  { mes: "Dez/26", ym: "2026-12", clientesInicio: 101, churn: 5, novosInbound: 7, novosOutbound: 2, clientesFim: 105, taxaChurn: 0, ticket: 800, mrrBruto: 84143, inadimplencia: 10, mrrLiquido: 75729, arr: 1009720, receitaAcum: 0, capacidadeCS: 105, unidadesCS: 3.0, novos: 9, metaNovoMRR: 7200 },
  ],
  META: [
  { mes: "Mai/26", ym: "2026-05", clientesInicio: 39, churn: 2, novosInbound: 6, novosOutbound: 2, clientesFim: 44, taxaChurn: 0, ticket: 745, mrrBruto: 32936, inadimplencia: 17, mrrLiquido: 27337, arr: 395227, receitaAcum: 0, capacidadeCS: 35, unidadesCS: 1.0, novos: 8, metaNovoMRR: 5960 },
  { mes: "Jun/26", ym: "2026-06", clientesInicio: 44, churn: 2, novosInbound: 5, novosOutbound: 2, clientesFim: 49, taxaChurn: 0, ticket: 755, mrrBruto: 36994, inadimplencia: 15, mrrLiquido: 31445, arr: 443925, receitaAcum: 0, capacidadeCS: 35, unidadesCS: 1.0, novos: 7, metaNovoMRR: 5285 },
  { mes: "Jul/26", ym: "2026-07", clientesInicio: 49, churn: 3, novosInbound: 11, novosOutbound: 3, clientesFim: 60, taxaChurn: 0, ticket: 765, mrrBruto: 45945, inadimplencia: 12, mrrLiquido: 40431, arr: 551337, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 14, metaNovoMRR: 10710 },
  { mes: "Ago/26", ym: "2026-08", clientesInicio: 60, churn: 3, novosInbound: 16, novosOutbound: 3, clientesFim: 76, taxaChurn: 0, ticket: 775, mrrBruto: 59176, inadimplencia: 11, mrrLiquido: 52666, arr: 710109, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 19, metaNovoMRR: 14725 },
  { mes: "Set/26", ym: "2026-09", clientesInicio: 76, churn: 3, novosInbound: 28, novosOutbound: 3, clientesFim: 104, taxaChurn: 0, ticket: 785, mrrBruto: 81877, inadimplencia: 9, mrrLiquido: 74508, arr: 982521, receitaAcum: 0, capacidadeCS: 88, unidadesCS: 2.5, novos: 31, metaNovoMRR: 24335 },
  { mes: "Out/26", ym: "2026-10", clientesInicio: 104, churn: 4, novosInbound: 25, novosOutbound: 3, clientesFim: 128, taxaChurn: 0, ticket: 790, mrrBruto: 101222, inadimplencia: 9, mrrLiquido: 92112, arr: 1214668, receitaAcum: 0, capacidadeCS: 105, unidadesCS: 3.0, novos: 28, metaNovoMRR: 22120 },
  { mes: "Nov/26", ym: "2026-11", clientesInicio: 128, churn: 5, novosInbound: 21, novosOutbound: 3, clientesFim: 147, taxaChurn: 0, ticket: 795, mrrBruto: 116868, inadimplencia: 8, mrrLiquido: 107519, arr: 1402421, receitaAcum: 0, capacidadeCS: 123, unidadesCS: 3.5, novos: 24, metaNovoMRR: 19080 },
  { mes: "Dez/26", ym: "2026-12", clientesInicio: 147, churn: 7, novosInbound: 14, novosOutbound: 3, clientesFim: 157, taxaChurn: 0, ticket: 800, mrrBruto: 125911, inadimplencia: 8, mrrLiquido: 115838, arr: 1510936, receitaAcum: 0, capacidadeCS: 140, unidadesCS: 4.0, novos: 17, metaNovoMRR: 13600 },
  ],
  SONHO: [
  { mes: "Mai/26", ym: "2026-05", clientesInicio: 38, churn: 2, novosInbound: 6, novosOutbound: 2, clientesFim: 44, taxaChurn: 0, ticket: 760, mrrBruto: 33249, inadimplencia: 15, mrrLiquido: 28262, arr: 398986, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 8, metaNovoMRR: 6080 },
  { mes: "Jun/26", ym: "2026-06", clientesInicio: 44, churn: 2, novosInbound: 5, novosOutbound: 2, clientesFim: 49, taxaChurn: 0, ticket: 775, mrrBruto: 37974, inadimplencia: 12, mrrLiquido: 33417, arr: 455687, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 7, metaNovoMRR: 5425 },
  { mes: "Jul/26", ym: "2026-07", clientesInicio: 49, churn: 3, novosInbound: 14, novosOutbound: 5, clientesFim: 65, taxaChurn: 0, ticket: 785, mrrBruto: 50686, inadimplencia: 10, mrrLiquido: 45618, arr: 608237, receitaAcum: 0, capacidadeCS: 70, unidadesCS: 2.0, novos: 19, metaNovoMRR: 14915 },
  { mes: "Ago/26", ym: "2026-08", clientesInicio: 65, churn: 5, novosInbound: 19, novosOutbound: 5, clientesFim: 84, taxaChurn: 0, ticket: 800, mrrBruto: 67239, inadimplencia: 8, mrrLiquido: 61860, arr: 806869, receitaAcum: 0, capacidadeCS: 88, unidadesCS: 3.0, novos: 24, metaNovoMRR: 19200 },
  { mes: "Set/26", ym: "2026-09", clientesInicio: 84, churn: 4, novosInbound: 38, novosOutbound: 5, clientesFim: 123, taxaChurn: 0, ticket: 825, mrrBruto: 101348, inadimplencia: 7, mrrLiquido: 94254, arr: 1216179, receitaAcum: 0, capacidadeCS: 105, unidadesCS: 3.0, novos: 43, metaNovoMRR: 35475 },
  { mes: "Out/26", ym: "2026-10", clientesInicio: 123, churn: 6, novosInbound: 33, novosOutbound: 5, clientesFim: 155, taxaChurn: 0, ticket: 850, mrrBruto: 131498, inadimplencia: 7, mrrLiquido: 122294, arr: 1577982, receitaAcum: 0, capacidadeCS: 140, unidadesCS: 4.0, novos: 38, metaNovoMRR: 32300 },
  { mes: "Nov/26", ym: "2026-11", clientesInicio: 155, churn: 8, novosInbound: 30, novosOutbound: 5, clientesFim: 182, taxaChurn: 0, ticket: 875, mrrBruto: 159223, inadimplencia: 7, mrrLiquido: 148077, arr: 1910673, receitaAcum: 0, capacidadeCS: 175, unidadesCS: 5.0, novos: 35, metaNovoMRR: 30625 },
  { mes: "Dez/26", ym: "2026-12", clientesInicio: 182, churn: 13, novosInbound: 17, novosOutbound: 5, clientesFim: 191, taxaChurn: 0, ticket: 900, mrrBruto: 172108, inadimplencia: 8, mrrLiquido: 158339, arr: 2065295, receitaAcum: 0, capacidadeCS: 193, unidadesCS: 6.0, novos: 22, metaNovoMRR: 19800 },
  ],
};

export const UNIT_ECONOMICS: Record<CenarioId, { ltv: string; ltvCac: string; cac: string; churnMeta: string; nrr: string; quickRatio: string }> = {
  PNC: { ltv: "R$ 7.700", ltvCac: "35x", cac: "R$ 222", churnMeta: "5%", nrr: "72%", quickRatio: "1,8x" },
  META: { ltv: "R$ 13.000+", ltvCac: "60x", cac: "R$ 222", churnMeta: "5%", nrr: "97%", quickRatio: "2,6x" },
  SONHO: { ltv: "R$ 20k+", ltvCac: "~90x", cac: "R$ 222", churnMeta: "3,5%", nrr: "~110%", quickRatio: "3,0x" },
};

export function planoDoCenario(id: CenarioId): MesPlano[] {
  return PLANOS[id];
}

/** Mês do plano correspondente à data atual (clampado ao range Mai–Dez/26). */
export function mesAtualPlano(plano: MesPlano[], hoje = new Date()): MesPlano {
  const ym = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  return plano.find((m) => m.ym === ym) ?? (ym < plano[0].ym ? plano[0] : plano[plano.length - 1]);
}

export function alertaCapacidade(m: MesPlano): "OK" | "Atenção" | "Estourado" {
  if (m.clientesFim > m.capacidadeCS) return "Estourado";
  if (m.clientesFim > m.capacidadeCS * 0.85) return "Atenção";
  return "OK";
}

export const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const fmtBRLm = (n: number) => "R$ " + (n / 1_000_000).toFixed(2) + "MM";
