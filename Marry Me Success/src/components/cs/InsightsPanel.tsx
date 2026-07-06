import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import type { Insight } from "@/lib/cs-insights";

const styleTom: Record<Insight["tom"], string> = {
  positivo: "border-saude-saudavel/40 bg-saude-saudavel/5",
  atencao: "border-saude-atencao/40 bg-saude-atencao/5",
  risco: "border-saude-risco/40 bg-saude-risco/5",
};

const iconTom: Record<Insight["tom"], React.ComponentType<{ className?: string }>> = {
  positivo: TrendingUp,
  atencao: Sparkles,
  risco: AlertTriangle,
};

const iconColor: Record<Insight["tom"], string> = {
  positivo: "text-saude-saudavel",
  atencao: "text-saude-atencao",
  risco: "text-saude-risco",
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (!insights.length)
    return (
      <p className="text-sm text-muted-foreground">
        Sem sinais suficientes para gerar insights ainda. Volte após 1–2 semanas de dados.
      </p>
    );
  return (
    <ul className="space-y-2.5">
      {insights.map((i, idx) => {
        const Icon = iconTom[i.tom];
        return (
          <li
            key={idx}
            className={"rounded-md border p-3 " + styleTom[i.tom]}
          >
            <div className="flex items-start gap-2">
              <Icon className={"h-4 w-4 mt-0.5 shrink-0 " + iconColor[i.tom]} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.titulo}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{i.detalhe}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
