## Contexto do que muda

Hoje temos duas fontes de números por cliente: `metricasCampanha` (Meta Ads) e sinais de renovação/pagamento. Não temos as **vendas do próprio fornecedor** (quantos casais ele fechou por semana, ticket médio, funil comercial dele). Sem isso, a dimensão "Vendas" no drawer é ambígua — hoje ela mistura inadimplência + renovação do contrato conosco, que é outra coisa.

Este plano separa claramente:

- **Campanhas** = performance da mídia paga que rodamos (CPL, CTR, leads).
- **Vendas do cliente** = funil comercial dele (leads → reuniões → propostas → contratos, ticket médio, receita gerada).
- **Renovação do contrato Marry Me** = continua vivendo em "Vendas / Renovação" só para efeito de score de saúde interna, mas no drawer e na Ficha passa a ser exibida separada, sem se misturar com as vendas do cliente.

---

## 1. Modelo de dados: nova série `vendasCliente`

Em `src/lib/cs-types.ts`, adicionar:

```ts
export interface VendaSemana {
  semana: string;         // "S1"..."S8", alinhada com metricasCampanha
  leads: number;          // leads que chegaram ao comercial dele
  reunioes: number;       // reuniões/visitas realizadas
  propostas: number;      // propostas enviadas
  fechados: number;       // contratos fechados
  receita: number;        // R$ fechado na semana
  ticketMedio: number;    // receita/fechados (0 se não teve)
}
```
E `vendasCliente: VendaSemana[]` no `Cliente`. Popular em `cs-mock.ts` com 8 semanas por cliente, coerentes com a tendência da campanha (up/flat/down) para gerar cenários interessantes (ex.: campanha bem, vendas mal → gargalo comercial → insight).

Renomear a dimensão interna: `SaudeCalculada.vendas` continua existindo (renovação/pagamento), mas ganha uma **nova dimensão** `vendasCliente: DimensaoSaude` calculada a partir da conversão do funil (queda de taxa lead→fechado, queda de ticket médio, sem fechados por 3+ semanas). Total: 4 dimensões — Entregas, Campanhas, Vendas do Cliente, Renovação. O drawer, a Ficha e o Health engine passam a expor as 4.

## 2. Drawer com mini-gráficos

Em `src/components/cs/HealthBreakdown.tsx` (ou novo `HealthBreakdownCharts.tsx` usado só no drawer), cada uma das 4 dimensões vira um card com:

- badge de nível (Saudável/Atenção/Risco/Crítico) — como já é hoje;
- um **sparkline** de 8 semanas com a métrica-chave da dimensão:
  - Entregas: barras de tarefas atrasadas por semana.
  - Campanhas: linha de CPL (barras de leads no fundo em cinza).
  - Vendas do Cliente: linha de contratos fechados/semana.
  - Renovação: barrinha horizontal "dias até renovar" + tag confiança.
- 1-2 fatores em texto abaixo (versão condensada dos atuais).

Layout do drawer permanece o mesmo (largura `max-w-md`), só troca o corpo do breakdown.

## 3. Corrigir "Abrir ficha completa"

O clique já chama `nav({ to: "/clientes/$id", params })`, mas o backdrop do drawer captura pointer events em telas menores e a rota não estava rolando para o topo. Correções:

- Trocar o handler por um `<Link to="/clientes/$id" params={{ id }}>` real dentro do footer do drawer (dispensa `useNavigate`, garante prefetch e funciona no mobile).
- Fechar o drawer no `onClick` do Link antes da navegação para não deixar overlay preso.
- Fazer o mesmo tratamento nos outros pontos que já usavam `nav()` para a ficha (Home, Kanban row, Daily) — auditar num único passe e padronizar em `<Link>`.

## 4. Nova Ficha do Cliente (`/clientes/$id`) — dashboard único

Substituir as 4 abas atuais (Visão / Contexto / Performance / IA) por **uma página única, rolável, dividida em blocos claros** — é a "visão geral de cada cliente" que o usuário pediu. Mantém aba de "Contexto de Marca" só como acordeão, pois é campo de edição.

Estrutura da página (topo → base):

```text
┌──────────────────────────────────────────────────────────────────┐
│ Header: nome, nicho, plano, responsável, etapa, saúde geral      │
│         + 4 KPIs: CPL médio · Leads/sem · Fechados/sem · Ticket  │
└──────────────────────────────────────────────────────────────────┘
┌───────────────────────────────┬──────────────────────────────────┐
│ Saúde por dimensão (4 cards)  │ Insights automáticos (bullets)   │
│ com sparklines                │ Gerados pelo cruzamento          │
│                               │ campanha × vendas × entregas     │
└───────────────────────────────┴──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Campanhas (Meta Ads) — gráfico linha CPL/CTR/Leads (8 sem)       │
│ + tabela semanal compacta                                        │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Vendas do Cliente — funil semanal + linha de fechados/receita    │
│ + taxa de conversão lead→fechado                                 │
└──────────────────────────────────────────────────────────────────┘
┌───────────────────────────────┬──────────────────────────────────┐
│ Tarefas do cliente (mesmas    │ Reuniões (histórico + registrar) │
│ da Central de Tarefas)        │                                  │
└───────────────────────────────┴──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Estúdio de IA (bloco maior, dividido em duas colunas)            │
│  Esquerda: seletor de tipo (anúncio / vídeo apresentação / reel  │
│  / pauta de reunião / insight) + parâmetros                      │
│  Direita: editor do roteiro gerado, botões "Regenerar",          │
│  "Salvar rascunho", "Enviar para o ClickUp" (cria Tarefa)        │
│  Lista de "Roteiros salvos" abaixo (mock, persistido no store)   │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Contexto de Marca (acordeão colapsado por padrão)                │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Bloco "Insights automáticos" (o coração da reunião semanal)

Novo utilitário `src/lib/cs-insights.ts` que gera 3-6 bullets a partir das séries do cliente. Regras determinísticas (sem IA real), por exemplo:

- Campanha subiu leads +X% mas vendas fechadas caíram → "gargalo comercial: leads chegam, não convertem".
- CPL subiu mas ticket médio subiu junto → "vale o custo, priorizar retenção do público atual".
- Tarefas atrasadas concentradas em Criativo → "produção travada; risco de campanha estagnar".
- Semana sem propostas enviadas → "follow-up comercial parou; sugerir cadência".
- Renovação em <30d + saúde de vendas do cliente ok → "case pronto para pitch de renovação".

Esses bullets viram a "pauta pronta" da reunião semanal e alimentam também o gerador de IA (botão "Usar insights como base do roteiro").

### 4.2 Estúdio de IA

Hoje já existe `gerarIA()` com 3 templates. Reformular:

- Tipos disponíveis: **Roteiro de anúncio**, **Vídeo de apresentação**, **Reels**, **Pauta de reunião semanal**, **Insight de otimização**.
- Parâmetros por tipo (duração, ângulo, CTA) — inputs simples.
- Prompt-base construído com: contexto de marca + últimos KPIs de campanha + últimos KPIs de vendas do cliente + insights.
- Saída em `<textarea>` editável.
- Ações: **Regenerar**, **Salvar rascunho** (novo objeto `RoteiroIA` no store, listado abaixo), **Enviar para o ClickUp** (cria `Tarefa` tipo Criativo, como já faz hoje).
- `RoteiroIA` fica na Ficha como fonte única — se um dia surgir uma tela "Central de Criativos", ela lê do mesmo store.

## 5. Arquivos afetados

- `src/lib/cs-types.ts` — `VendaSemana`, `vendasCliente`, `RoteiroIA`, 4ª dimensão em `SaudeCalculada`.
- `src/lib/cs-mock.ts` — series de vendas por cliente, alguns rascunhos de roteiro.
- `src/lib/cs-store.tsx` — `calcVendasCliente`, `addRoteiro`, `roteirosDoCliente`.
- `src/lib/cs-insights.ts` — novo, gerador determinístico de bullets.
- `src/components/cs/HealthBreakdown.tsx` — variante com sparklines para o drawer.
- `src/components/cs/AiStudio.tsx` — novo bloco de estúdio de IA.
- `src/routes/clientes.tsx` — drawer com mini-charts + Link corrigido.
- `src/routes/clientes.$id.tsx` — refatoração para dashboard único.
- `src/routes/index.tsx` e `src/routes/tarefas.tsx` — padronizar navegação para ficha via `<Link>`.

## Premissas que estou adotando (posso ajustar se preferir)

1. Vendas do cliente são registradas semanalmente no mesmo eixo (S1–S8) que a campanha — facilita cruzamento visual. Não vou modelar cada proposta individual agora; é mock de série.
2. "Renovação do contrato Marry Me" continua sendo uma dimensão de saúde separada, mas rotulada como **Renovação** no drawer (não como "Vendas"), para não confundir com as vendas do cliente.
3. Roteiros de IA continuam gerados por template determinístico no mock (sem chamada real a IA agora). O botão "Enviar para o ClickUp" continua criando `Tarefa` — fonte única mantida.
4. A Ficha vira página única rolável em vez de abas — é o formato que melhor casa com "reunião semanal com o cliente aberta na tela".

Se algum destes 4 pontos não bater com o que você quer, me diga qual mudar antes de eu implementar.
