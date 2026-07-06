import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  TrendingUp,
  HeartHandshake,
  Wallet,
  Flame,
  FileText,
  Target,
  Users,
  ListChecks,
  CalendarDays,
  CalendarClock,
  HeartPulse,
  Wand2,
  CalendarRange,
  Settings,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  MessageSquare,
  ChevronDown,
  UserCircle2,
} from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useCS } from "@/lib/cs-store";
import type { PermKey } from "@/lib/cs-types";

type IconType = ComponentType<{ className?: string }>;
type LinkItem = { to: string; label: string; icon?: IconType; perm: PermKey };
type SubGroup = { group: string; icon: IconType; perm: PermKey; items: { to: string; label: string }[] };
type AreaChild = LinkItem | SubGroup;
type Area = { label: string; icon: IconType; children: AreaChild[] };

const topLinks: LinkItem[] = [
  { to: "/", label: "Início", icon: Home, perm: "painel" },
  { to: "/planejamento", label: "Planejamento", icon: CalendarRange, perm: "planejamento" },
];

const areas: Area[] = [
  {
    label: "Vendas",
    icon: TrendingUp,
    children: [
      { to: "/vendas/leads", label: "Leads Quentes", icon: Flame, perm: "vendas" },
      { to: "/vendas/propostas", label: "Propostas", icon: FileText, perm: "vendas" },
      { to: "/vendas/metas", label: "Metas & Resultados", icon: Target, perm: "vendas" },
    ],
  },
  {
    label: "Customer Success",
    icon: HeartHandshake,
    children: [
      { to: "/clientes", label: "Clientes", icon: Users, perm: "clientes" },
      { to: "/health-score", label: "Health Score", icon: HeartPulse, perm: "health" },
      { to: "/tarefas", label: "Tarefas", icon: ListChecks, perm: "tarefas" },
      { to: "/agenda", label: "Agenda", icon: CalendarDays, perm: "agenda" },
      { to: "/renovacoes", label: "Renovações", icon: CalendarClock, perm: "renovacoes" },
      {
        group: "Ferramentas",
        icon: Wand2,
        perm: "ferramentas",
        items: [
          { to: "/ferramentas/gerador", label: "Gerador de Prompt" },
          { to: "/ferramentas/pautas", label: "Gerenciar Pautas" },
          { to: "/ferramentas/whatsapp", label: "Supervisor WhatsApp" },
        ],
      },
    ],
  },
  {
    label: "Financeiro",
    icon: Wallet,
    children: [
      { to: "/financeiro/visao-geral", label: "Visão Geral", icon: LayoutDashboard, perm: "financeiro" },
      { to: "/financeiro/fluxo", label: "Fluxo Semanal", icon: CalendarRange, perm: "financeiro" },
      { to: "/financeiro/a-receber", label: "A Receber", icon: ArrowDownCircle, perm: "financeiro" },
      { to: "/financeiro/a-pagar", label: "A Pagar", icon: ArrowUpCircle, perm: "financeiro" },
      { to: "/financeiro/regua", label: "Régua de Cobrança", icon: MessageSquare, perm: "financeiro" },
    ],
  },
];

const configLink: LinkItem = { to: "/configuracoes", label: "Configurações", icon: Settings, perm: "configuracoes" };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { usuarios, usuarioAtual, setUsuarioAtual, hasPermissao } = useCS();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const areasVisiveis = areas
    .map((a) => ({
      ...a,
      children: a.children.filter((c) => hasPermissao(c.perm)),
    }))
    .filter((a) => a.children.length > 0);

  const areaPaths = (a: { children: AreaChild[] }): string[] =>
    a.children.flatMap((c) => ("items" in c ? c.items.map((i) => i.to) : [c.to]));
  const activeArea = areasVisiveis.find((a) => areaPaths(a).some((p) => isActive(p)))?.label;

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    activeArea ? { [activeArea]: true } : { Vendas: true },
  );
  useEffect(() => {
    if (activeArea) setOpen((o) => ({ ...o, [activeArea]: true }));
  }, [activeArea]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="rounded-lg bg-white px-3 py-2.5 flex items-center justify-center">
            <img src="/marry-me-logo.png" alt="Marry Me" className="h-9 w-auto object-contain" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {topLinks.filter((l) => hasPermissao(l.perm)).map((l) => (
            <NavLinkItem key={l.to} item={l} active={isActive(l.to)} />
          ))}

          {areasVisiveis.map((a) => {
            const AreaIcon = a.icon;
            const aberto = !!open[a.label];
            const areaAtiva = a.label === activeArea;
            return (
              <div key={a.label} className="pt-1">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [a.label]: !o[a.label] }))}
                  className={
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors " +
                    (areaAtiva ? "text-primary" : "text-sidebar-foreground/55 hover:text-sidebar-foreground")
                  }
                >
                  <AreaIcon className={"h-4 w-4 " + (areaAtiva ? "text-primary" : "")} />
                  <span className="flex-1 text-left">{a.label}</span>
                  <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (aberto ? "rotate-180" : "")} />
                </button>
                {aberto && (
                  <div className="mt-0.5 space-y-0.5 pl-2">
                    {a.children.map((c) =>
                      "items" in c ? (
                        <SubGroupBlock key={c.group} sub={c} isActive={isActive} />
                      ) : (
                        <NavLinkItem key={c.to} item={c} active={isActive(c.to)} indent />
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {hasPermissao(configLink.perm) && (
            <div className="pt-1">
              <NavLinkItem item={configLink} active={isActive(configLink.to)} />
            </div>
          )}
        </nav>

        {/* Usuário atual (troca de acesso) */}
        <div className="border-t border-sidebar-border p-3">
          <label className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            <UserCircle2 className="h-3.5 w-3.5" /> Acessando como
          </label>
          <select
            value={usuarioAtual.id}
            onChange={(e) => setUsuarioAtual(e.target.value)}
            className="w-full rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2 py-1.5 text-xs text-sidebar-foreground outline-none"
          >
            {usuarios.map((u) => (
              <option key={u.id} value={u.id} className="text-foreground">
                {u.nome} · {u.papel}
              </option>
            ))}
          </select>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavLinkItem({ item, active, indent }: { item: LinkItem; active: boolean; indent?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors " +
        (indent ? "pl-3.5 " : "") +
        (active
          ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60")
      }
    >
      {Icon && <Icon className={"h-4 w-4 " + (active ? "text-primary" : "opacity-80")} />}
      {item.label}
    </Link>
  );
}

function SubGroupBlock({ sub, isActive }: { sub: SubGroup; isActive: (to: string) => boolean }) {
  const Icon = sub.icon;
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
        <Icon className="h-3.5 w-3.5" />
        {sub.group}
      </div>
      <div className="space-y-0.5 border-l border-sidebar-border/60 pl-2 ml-3">
        {sub.items.map((i) => {
          const active = isActive(i.to);
          return (
            <Link
              key={i.to}
              to={i.to}
              className={
                "block rounded-md px-3 py-1.5 text-[13px] transition-colors " +
                (active
                  ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60")
              }
            >
              {i.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
