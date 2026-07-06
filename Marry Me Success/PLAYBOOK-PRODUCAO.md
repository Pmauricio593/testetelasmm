# 💎 Marry Me · Playbook de Produção

Guia de layouts, páginas, funções e estrutura do **sistema geral da Marry Me** (Comercial + Customer Success + Financeiro + Planejamento + Configurações).
Referência para o dev levar o protótipo (dados mock/manuais) para produção (dados reais).

> **Status:** protótipo funcional em TanStack Start (React 19). Toda a camada de dados é **mock em memória** (`src/lib/*`). Nada persiste — ao recarregar, volta ao seed. O foco desta fase foi validar **layout, fluxo, identidade visual e regras de acesso**.

> **Princípio de entrega (definido pelo cliente):** só camada visual + funcionalidade básica. **Nenhuma integração externa agora** (sem Asaas, Meta Ads, Google Calendar, API do Crescer, WhatsApp). Onde o dado viria de fora → **entrada manual ou mock**, com a tela preparada para conectar depois. Cada tela mockada traz a marca **"conectar fonte depois"**.

---

## 1. Identidade visual (Marry Me)

Extraída da apresentação de vendas oficial. Tokens em `src/styles.css` (formato `oklch`).

| Token | Cor | Uso |
| --- | --- | --- |
| Rosa principal | `#D17BAB` | `--primary` · botões, links, destaques |
| Rosa claro | `#E8A4C9` | `--gold` · acento secundário, gráficos |
| Rosa muito claro | `#FAEAF1` | `--accent` · fundos de destaque |
| Grafite | `#1A1A1A` | `--foreground`, sidebar |
| Teal | `#2D5F5F` | `--chart-3` |

- **Fontes:** `Barlow` (títulos) + `Nunito` (corpo), via `<link>` em `src/routes/__root.tsx`.
- **Logo:** oficial em `public/marry-me-logo.png`, no topo da sidebar (container claro).
- **Saúde (semáforo):** `--saude-saudavel/atencao/risco/critico`. Dark mode configurado.

**✅ Produção — identidade**
- [ ] Validar contraste/acessibilidade (WCAG AA).
- [ ] Self-host das fontes (hoje via Google Fonts).

---

## 2. Stack e execução

- **Framework:** TanStack Start + Router (roteamento por arquivo em `src/routes/`).
- **UI:** React 19, Tailwind v4, Radix UI, `lucide-react`, `recharts`, `sonner`.
- **Gerenciador:** `bun`. Local: `bun install && bun run dev`.
- **Conectado ao Lovable** (`AGENTS.md`) — não reescrever histórico do git.

**✅ Produção — infra**
- [ ] Trocar o **estado em memória** (`CSProvider` em `src/lib/cs-store.tsx`) por backend + banco.
- [ ] Autenticação real (hoje o "usuário logado" é um seletor em memória).
- [ ] Integrações: **Asaas** (financeiro/cobrança), **ClickUp** (tarefas), **Meta Ads** (campanha), **Crescer** (CRM/vendas), **WhatsApp**, **Google Calendar** (se aplicável).

---

## 3. Permissões e usuários (RBAC)

Controle de acesso **em memória** (`cs-store` + `cs-types.PermKey`). Cada usuário tem uma lista de `permissoes`; o menu **esconde os módulos** que o usuário não pode ver.

- Seletor **"Acessando como"** no rodapé da sidebar troca o usuário atual → o menu muda na hora.
- Permissões (módulos): `painel, vendas, planejamento, clientes, health, tarefas, agenda, renovacoes, ferramentas, financeiro, configuracoes`.
- Gestão em **Configurações › Usuários** (CRUD + toggles de acesso).
- Usuários seed: Paulo (Admin, tudo), Kauê (Head CS — sem Vendas/Financeiro/Planejamento/Config), Giovanni (Vendas), Marina (CS Júnior).

**✅ Produção — RBAC**
- [ ] Ligar a auth/SSO real; papéis e permissões no backend.
- [ ] Guardas de rota (hoje só o menu é escondido; a URL direta ainda renderiza).

---

## 4. Navegação por áreas (sidebar)

`src/components/cs/AppShell.tsx` — áreas **expansíveis (accordion)**, filtradas por permissão.

| Nível | Item | Rota |
| --- | --- | --- |
| Topo | Início | `/` |
| Topo | Planejamento | `/planejamento` |
| Área | **Vendas** ▸ | Leads Quentes · Propostas · Metas & Resultados |
| Área | **Customer Success** ▸ | Clientes · Health Score · Tarefas · Agenda · Renovações · **Ferramentas** (Gerador · Pautas · Supervisor WhatsApp) |
| Área | **Financeiro** ▸ | Visão Geral · Fluxo Semanal · A Receber · A Pagar · Régua de Cobrança |
| Base | Configurações | `/configuracoes` (Clientes · Usuários) |

---

## 5. Checklist por página

### 5.1 Início · `index.tsx` — Dashboard geral da empresa
KPIs macro (ARR run-rate, clientes ativos, resultado do mês, meta ARR) + **cards por área** (Comercial, Financeiro, Customer Success, Planejamento) **respeitando permissões** + lista "Precisa de atenção hoje".
- [ ] Ligar cada card às fontes reais das respectivas áreas.

### 5.2 Planejamento · `planejamento.tsx` — Área própria (top-level)
Cenário selecionável (**Pé no Chão / Meta / Sonho** — da planilha). **Navegação mês a mês** (‹ ›). Gráfico **Meta × Projeção** (projeção no ritmo de crescimento atual vs meta). Seções por área: Crescimento de clientes, Receita (MRR bruto/líquido/ARR), Capacidade CS (unidades + alerta), Unit economics. Dados em `cs-planejamento.ts`.
- [ ] `receitaAcum` está zerado no seed; recalcular se necessário.
- [ ] Alerta de capacidade CS é derivado (clientes fim vs. capacidade).

### 5.3 Vendas
Área comercial. **O funil/pipeline completo vive no Crescer** — aqui só o que o software usa. Dados: `cs-vendas.ts` (CRM real: 4.067 leads, 433 avançados).
- **Leads Quentes** · `vendas.leads.tsx`: negócios ativos + filtros; **clique 1 a 1 abre painel** com discussão + **devolutiva BANT** (autoridade, necessidade, prazo, próximos passos, quem atendeu — editável em memória).
- **Propostas** · `vendas.propostas.tsx`: **métricas de conversão** (enviadas, aceitas, taxa) + gráfico por status + tabela.
- **Metas & Resultados** · `vendas.metas.tsx`: meta do mês (puxada do Planejamento, **editável com cascata proporcional** p/ meses seguintes), realizado × meta no ano; **drill-down mês a mês** (clique no mês → fechamentos e fontes). Por origem.
- [ ] ⚠️ Sem coluna de **vendedor** na planilha → comissões por pessoa não calculadas.
- [ ] Conectar ao **Crescer** (funil completo, base fria, atribuição por vendedor).

### 5.4 Customer Success

**Clientes** · `clientes.index.tsx` (+ `clientes.$id.tsx`, `clientes.tsx`)
- **Carrossel** de clientes + Kanban/Tabela + filtros. Card abre **painel lateral** (prazo de entrega, campanha, renovação de contrato, vendas do cliente).
- **Ficha** (`clientes.$id`): header + etapa do funil; **para clientes em Onboarding** → checklist de progresso da etapa (**editável**: adicionar/remover tarefas, **pré-seleção por plano**; blocos de campanha/vendas/saúde **ocultos** até a ativação); para os demais → Saúde por dimensão, Insights, Campanhas (Meta Ads), Vendas do cliente (ROAS/CAC), Recomendações de melhoria, Tarefas (**filtráveis por responsável e prazo**), Reuniões (agendadas + histórico), Próximo passo, Contexto de marca.
- [ ] Métricas de campanha/vendas são **sintéticas** — conectar Meta Ads / CRM do fornecedor.
- [ ] Onboarding: `cs-onboarding.ts` traz templates por plano (ilustrativos).

**Health Score** · `health-score.tsx`
- **Pontuação numérica 0–100** por cliente, com **pesos editáveis** (Entregas / Vendas / Campanha / Renovação). Score médio, críticos, MRR em risco. Clique → **ficha lateral** com composição do score.
- [ ] No futuro cruzar meta + planilha + grupos (WhatsApp) reais.

**Tarefas** · `tarefas.tsx` — daily, agrupada por responsável/prazo. [ ] Integrar ClickUp.

**Agenda** · `agenda.tsx` — agenda nativa; calendário mensal, KPIs, clientes sem reunião, agendar/editar. [ ] Eventos repetíveis (pendente). [ ] Sync externo se necessário.

**Renovações** · `renovacoes.tsx` — carteira por proximidade de renovação. [ ] Dados reais.

**Ferramentas** · `ferramentas.tsx` (layout com abas) — sistema de pautas de IA (**o operador roda o modelo por fora**).
- **Gerador de Prompt** · `ferramentas.gerador.tsx`: escolhe pauta → cliente (contexto auto da ficha) → objetivo/briefing/observações/anexos → **monta o prompt pronto para copiar**; mostra anexos necessários / exige planilha; **variações A/B/C**.
- **Gerenciar Pautas** · `ferramentas.pautas.tsx`: CRUD de pautas (nome, anexos, exige planilha, suporta variações, **prompt template** com placeholders). Dados em `cs-pautas.ts`.
- **Supervisor de WhatsApp** · `ferramentas.whatsapp.tsx`: tempo de resposta + risco por grupo (**mock**).
- [ ] Plugar **LLM real** na geração; integrar **WhatsApp** no supervisor.

### 5.5 Financeiro · `financeiro.tsx` (layout com abas)
Snapshot **Julho/2026** (`cs-financeiro.ts`). Régua ancorada em 02/07/2026.
- **Visão Geral** · comparativo objetivo Entradas × Saídas + composição.
- **Fluxo Semanal** · `financeiro.fluxo.tsx`: a receber/recebido/a pagar **semana a semana**, saldo acumulado, **alerta de quebra de caixa**, **lançamento manual** (em memória).
- **A Receber** / **A Pagar** · detalhados (KPIs, gráficos, tabelas). Contas a pagar só de Julho.
- **Régua de Cobrança** · `financeiro.regua.tsx`: 10 etapas (A vencer → D+30 Negativação), cliente por etapa + **mensagem pronta para copiar** (templates da planilha).
- [ ] Ligar **Asaas** (recebimentos, status, boleto/Pix) e o controle de contas a pagar.

### 5.6 Configurações · `configuracoes.tsx` (layout com abas)
- **Clientes** · `configuracoes.clientes.tsx`: datas de contrato, plano, valor, responsável, **acessos das redes** (Instagram, Meta Ads/BM, Drive), **meta comercial** do cliente, override de saúde.
- **Usuários & Acessos** · `configuracoes.usuarios.tsx`: CRUD de usuários + **permissões que escondem módulos** + "acessar como".

---

## 6. Estrutura técnica (camada de dados)

| Arquivo | Papel |
| --- | --- |
| `lib/cs-types.ts` | Tipos: Cliente, Nicho, Plano, Tarefa, Agendamento, RoteiroIA, **Usuario/PermKey**, RedesCliente, PLANO_MRR, RESPONSAVEIS. |
| `lib/cs-store.tsx` | `CSProvider` + `useCS` — **estado em memória**: clientes, tarefas, roteiros, agendamentos, pautas, onboarding, **usuários/permissões**. Cálculo de saúde. |
| `lib/cs-mock.ts` | Seed dos **54 clientes reais** + tarefas + agendamentos + métricas sintéticas. |
| `lib/cs-vendas.ts` | Dados reais do CRM (Vendas): funil, 433 negociações, propostas, fechamentos/mês, por origem. |
| `lib/cs-financeiro.ts` | Recebimentos (Julho + atrasados Junho) + régua/templates + contas a pagar Julho. |
| `lib/cs-planejamento.ts` | 3 cenários (PNC/Meta/Sonho) mês a mês + unit economics. |
| `lib/cs-pautas.ts` | Pautas + montagem de prompt. |
| `lib/cs-onboarding.ts` | Templates de onboarding por plano. |
| `lib/cs-insights.ts` | Insights, recomendações, resumo de campanha/vendas (ROAS/CAC). |
| `lib/cs-gerador.ts` | (legado das antigas ferramentas — sem uso; pode remover). |
| `components/cs/*` | UI compartilhada por área (AppShell, badges, agenda-ui, ferramentas-ui, financeiro-ui, vendas-ui, InsightsPanel, HealthBreakdown, tarefas-ui). |

**Equipe (RESPONSAVEIS):** Kauê, Giovanni, Paulo. **Planos:** Essencial / Growth / Estruturação Comercial. **MRR = `Cliente.valorMensal`** (valor real da planilha).

**✅ Produção — dados**
- [ ] Migrar `CSProvider` → API + banco (React Query).
- [ ] Modelar: clientes/contratos, métricas, tarefas, agenda, cobranças, despesas, pautas, usuários/permissões, negociações.
- [ ] Remover `cs-gerador.ts` (legado sem uso).

---

## 7. Fontes de dados (planilhas usadas)

- **Cobranças 2026 (Página2)** → base de 54 clientes (nome, serviço, valor, datas).
- **Cobranças 2026 (Régua)** → recebimentos + régua + templates de mensagem.
- **Orçamento Real (Controle Financeiro)** → contas a pagar de Julho.
- **Vendas — Dados** → CRM (4.067 leads, funil, propostas, fechamentos).
- **Planejamento Anual 2026 (Projeção MRR)** → 3 cenários mês a mês + unit economics.

---

## 8. Todas as indicações do cliente (histórico)

1. Criar **Ferramentas** (Copy/Roteiros/Reunião) com seleção de clientes + aplicar **identidade visual** da apresentação. ✅
2. Remover IA da ficha (só nas Ferramentas); enriquecer campanha/vendas/insights; criar **Agenda** ligando reuniões (aba própria; quem tem/não tem reunião; ver agenda no sistema). ✅
3. Ferramentas com **lista suspensa** separando uma tela por ferramenta + mais robustez. ✅
4. Reconstruir a **base de clientes** pela planilha de cobranças; excluir fictícios; equipe **Kauê/Giovanni/Paulo**. ✅
5. Aba **Financeiro**: régua de cobrança + contas a pagar (só Julho). ✅
6. Dividir Financeiro em sub-abas (comparativo + A Receber + A Pagar + Régua). ✅
7. Atualizar **dados de Vendas** pela planilha do CRM. ✅
8. Puxar a **meta mensal** da planilha de planejamento e **mapear o ano** (Cenário Meta). ✅
9. **Objetivo de entrega:** visual + básico, **sem integrações**, mock/manual, pronto p/ conectar. + spec de 13 áreas. ✅ (parcial — ver §9)
10. Seguir com **Ferramentas** (sistema de pautas) + **Onboarding**. ✅
11. Refinamentos: onboarding na ficha; metas com cascata; **Health Score numérico**; **Planejamento como área própria**; **Configurações** (Clientes + Usuários com permissões que escondem módulos); **Leads clicáveis** com discussão/BANT. ✅
12. Decisões: pesos do Health **editáveis**; permissões **escondem módulos** (troca de usuário); meta **recalcula meses seguintes proporcionalmente**. ✅
13. Ajustes finais: onboarding com **progresso + checklist editável + pré-seleção por plano** (ocultar dados que não existem); Planejamento **navegável mês a mês** + gráfico **meta × projeção**; **Início** vira dashboard geral da empresa. ✅

---

## 9. Backlog restante (Média/Baixa — não implementado)

Do spec de 13 áreas, ainda faltam:
- **Agenda:** eventos **repetíveis**.
- **Painel do Gestor (CS):** visão consolidada de onboarding/suporte/contatos.
- **Reflexão Semanal:** cada responsável escreve 1x/semana por cliente (destaques, análise, comentário).
- **Formulário/Planilha de vendas:** repaginar visual.
- **Comercial / Crescer (só visualização):** gestão comercial (reflexão dos closers), estrutura de time (SDR + closers + qualificador), funil dos qualificadores/closers, devolutiva de reunião (BANT) — telas de visualização preparadas p/ conectar o Crescer.
- **Matchmaking / leads automáticos:** fora de escopo por ora.

---

## 10. Priorização para produção

**P0 — Fundacional:** backend + banco + auth (substitui estado em memória e o seletor de usuário); Asaas (financeiro/cobrança).
**P1 — Operação:** Crescer (vendas), ClickUp (tarefas), Meta Ads (campanha); persistência de agenda/tarefas/onboarding/configurações.
**P2 — Inteligência:** LLM real na geração de prompts; automação da régua (WhatsApp/Asaas); WhatsApp no supervisor.
**P3 — Polimento:** menu/responsividade mobile; guardas de rota por permissão; backlog §9; remover legado (`cs-gerador.ts`).

---

*Guia de layouts para produção — Marry Me · Sistema geral da empresa.*
