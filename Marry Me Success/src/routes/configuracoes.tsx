import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Settings, Users, UserCog } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfigLayout,
});

const abas = [
  { to: "/configuracoes/clientes", label: "Clientes", icon: Users },
  { to: "/configuracoes/usuarios", label: "Usuários & Acessos", icon: UserCog },
] as const;

function ConfigLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="mx-auto max-w-[1300px] px-6 py-8">
      <header className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25"><Settings className="h-4 w-4" /></span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Clientes e usuários do sistema</p>
        </div>
      </header>
      <nav className="mb-8 flex flex-wrap gap-1 border-b">
        {abas.map((a) => {
          const Icon = a.icon;
          const active = pathname.startsWith(a.to);
          return (
            <Link key={a.to} to={a.to}
              className={"-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " + (active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
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
