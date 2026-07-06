import type { Plano } from "./cs-types";

/** Item de onboarding instanciado por cliente (editável). */
export interface OnbItem {
  id: string;
  label: string;
  done: boolean;
}

const BASE = [
  "Criar grupo no WhatsApp",
  "Contrato assinado",
  "Enviar checklist de informações",
  "Coletar materiais e portfólio",
  "Reunião de kickoff",
];

/** Pré-seleção por plano (ilustrativa — ajustável na ficha). */
const TEMPLATES: Record<Plano, string[]> = {
  Essencial: [...BASE, "Aprovar primeiros criativos"],
  Growth: [
    ...BASE,
    "Acesso ao Meta Ads / BM",
    "Conta de anúncios criada",
    "Configurar pixel e rastreamento",
    "Aprovar primeiros criativos",
  ],
  "Estruturação Comercial": [
    ...BASE,
    "Mapear processo comercial atual",
    "Definir metas de vendas",
    "Estruturar cadência de follow-up",
  ],
};

export function templateOnboarding(plano: Plano): OnbItem[] {
  return (TEMPLATES[plano] ?? BASE).map((label, i) => ({ id: `o${i}`, label, done: false }));
}
