import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Wand2, Sparkles, FileStack, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/ferramentas")({
  component: FerramentasLayout,
});

const abas = [
  { to: "/ferramentas/gerador", label: "Gerador de Prompt", icon: Sparkles },
  { to: "/ferramentas/pautas", label: "Gerenciar Pautas", icon: FileStack },
  { to: "/ferramentas/whatsapp", label: "Supervisor de WhatsApp", icon: MessageCircle },
] as const;

function FerramentasLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
          <Wand2 className="h-4 w-4" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ferramentas</h1>
          <p className="text-sm text-muted-foreground">Pautas de IA e supervisão · o operador roda o modelo por fora</p>
        </div>
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
                (active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")
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
