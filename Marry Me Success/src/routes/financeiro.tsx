import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Wallet, ArrowDownCircle, ArrowUpCircle, LayoutDashboard, MessageSquare, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  component: FinanceiroLayout,
});

const abas = [
  { to: "/financeiro/visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/financeiro/fluxo", label: "Fluxo Semanal", icon: CalendarRange },
  { to: "/financeiro/a-receber", label: "A Receber", icon: ArrowDownCircle },
  { to: "/financeiro/a-pagar", label: "A Pagar", icon: ArrowUpCircle },
  { to: "/financeiro/regua", label: "Régua de Cobrança", icon: MessageSquare },
] as const;

function FinanceiroLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
            <Wallet className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Recebimentos e contas a pagar · <span className="font-medium text-foreground">Julho 2026</span>
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-1 border-b">
        {abas.map((a) => {
          const Icon = a.icon;
          const active = pathname.startsWith(a.to);
          return (
            <Link
              key={a.to}
              to={a.to}
              className={
                "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
                (active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
