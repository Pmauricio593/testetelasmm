import type { Cliente, Nicho, Tarefa } from "./cs-types";
import {
  gerarInsights,
  gerarRecomendacoes,
  resumoCampanha,
  resumoVendas,
} from "./cs-insights";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toFixed(1)}%`;
const proximoAno = () => new Date().getFullYear() + 1;

const linha = "─────────────────────────────────────────────";

/* Inteligência por nicho — alimenta ganchos, hashtags e direção de criativo. */
interface NichoInfo {
  substantivo: string;
  hashtags: string[];
  criativo: string;
  prova: string;
}
const NICHO_INFO: Record<Nicho, NichoInfo> = {
  Músico: {
    substantivo: "músico",
    hashtags: ["#musicaparacasamento", "#musicodecasamento", "#casamento", "#noivas2026", "#cerimonia"],
    criativo: "Trecho tocando ao vivo com emoção + reação dos noivos nos primeiros 2s.",
    prova: "vídeos tocando em casamentos reais",
  },
  Banda: {
    substantivo: "banda",
    hashtags: ["#bandadecasamento", "#casamento", "#musicaaovivo", "#noivas2026", "#festadecasamento"],
    criativo: "Corte de pista lotada + refrão conhecido nos primeiros 2s. Mostrar reação dos convidados.",
    prova: "trechos de festas reais com a pista cheia",
  },
  DJ: {
    substantivo: "DJ",
    hashtags: ["#djcasamento", "#casamento", "#pistadedanca", "#noivas2026", "#festaperfeita"],
    criativo: "Transição de música + drop com a pista explodindo. Texto na tela com o nome dos noivos.",
    prova: "vídeos da pista no auge da festa",
  },
  Celebrante: {
    substantivo: "celebrante",
    hashtags: ["#celebrante", "#cerimonia", "#votos", "#casamento", "#noivos2026"],
    criativo: "Close no casal emocionado durante os votos + fala marcante da cerimônia.",
    prova: "reações emocionadas de casais e convidados",
  },
  Cerimonialista: {
    substantivo: "cerimonial",
    hashtags: ["#cerimonialista", "#assessoriadecasamento", "#casamento", "#noivas2026", "#weddingplanner"],
    criativo: "Timelapse da montagem + o resultado final impecável. Bastidores da organização.",
    prova: "antes e depois da produção do evento",
  },
  Fotógrafo: {
    substantivo: "estúdio de fotografia",
    hashtags: ["#fotografiadecasamento", "#fotografodecasamento", "#casamento", "#noivas2026", "#ensaio"],
    criativo: "Sequência das melhores fotos + making of do ensaio. Luz e emoção em destaque.",
    prova: "portfólio de casamentos reais",
  },
  Cinegrafista: {
    substantivo: "filmagem",
    hashtags: ["#filmagemdecasamento", "#videodecasamento", "#casamento", "#noivas2026", "#weddingfilm"],
    criativo: "Trailer cinematográfico de 6s com a melhor cena do filme + trilha emocional.",
    prova: "trechos de filmes de casamento entregues",
  },
};

const ctxCliente = (c: Cliente) => ({
  publico: c.contextoMarca.publicoAlvo || "casais que vão se casar",
  tom: c.contextoMarca.tomDeVoz || "sofisticado e emocional",
  dif: c.contextoMarca.diferenciais || "atendimento premiado e portfólio de alto padrão",
  sazon: c.contextoMarca.sazonalidade || "temporada de casamentos",
});

/* =========================================================================
 * 1) COPY PARA ANÚNCIO
 * ======================================================================= */

export const COPY_OBJETIVOS = ["Geração de leads", "Mensagens (DM)", "Agendamentos", "Reconhecimento"] as const;
export const COPY_PLATAFORMAS = ["Instagram", "Facebook", "Instagram + Facebook"] as const;
export const COPY_FORMATOS = ["Feed (imagem única)", "Stories", "Reels", "Carrossel"] as const;
export const COPY_FRAMEWORKS = ["AIDA", "PAS (Problema-Agitação-Solução)", "Antes-Depois-Ponte", "PASTOR", "4 Cs"] as const;
export const COPY_GATILHOS = ["Urgência de datas", "Escassez de vagas", "Prova social", "Autoridade", "Exclusividade"] as const;
export const COPY_TAMANHOS = ["Curta", "Média", "Longa"] as const;

export interface CopyParams {
  objetivo: string;
  plataforma: string;
  formato: string;
  framework: string;
  gatilho: string;
  tamanho: string;
  nVariacoes: number;
  emojis: boolean;
  dor: string;
  desejo: string;
  oferta: string;
  cta: string;
}

export const copyParamsPadrao: CopyParams = {
  objetivo: "Geração de leads",
  plataforma: "Instagram + Facebook",
  formato: "Feed (imagem única)",
  framework: "AIDA",
  gatilho: "Urgência de datas",
  tamanho: "Média",
  nVariacoes: 2,
  emojis: true,
  dor: "",
  desejo: "",
  oferta: "",
  cta: "Chame no direct para ver a disponibilidade",
};

type Ctx = ReturnType<typeof ctxCliente>;

interface Angulo {
  nome: string;
  hookBase: (c: Cliente, ctx: Ctx, info: NichoInfo) => string[];
}

const ANGULOS: Angulo[] = [
  {
    nome: "Urgência de datas",
    hookBase: (_c, ctx, info) => [
      `As melhores datas de ${proximoAno()} fecham primeiro — e as agendas de ${ctx.publico} não esperam.`,
      `Faltam poucas datas livres para a temporada ${proximoAno()}.`,
      `Você já garantiu ${info.substantivo} para o grande dia?`,
    ],
  },
  {
    nome: "Prova social / autoridade",
    hookBase: (c, ctx) => [
      `Centenas de casais já confiaram — e a pergunta é: por que ${ctx.publico} escolhem ${c.nome}?`,
      `Não é sorte. É método, portfólio e ${ctx.dif}.`,
      `O tipo de resultado que vira indicação entre noivas.`,
    ],
  },
  {
    nome: "Transformação (antes → depois)",
    hookBase: () => [
      `Do "não sei por onde começar" ao casamento dos sonhos.`,
      `Imagine o dia mais importante da sua vida saindo exatamente como você sonhou.`,
      `A diferença entre um casamento bom e um inesquecível está nos detalhes.`,
    ],
  },
  {
    nome: "Dor evitada",
    hookBase: () => [
      `O maior arrependimento de quem casa? Escolher fornecedor pelo preço, não pela entrega.`,
      `Não deixe o dia mais importante nas mãos de quem improvisa.`,
      `Casamento não tem segunda chance. Escolha quem já provou que entrega.`,
    ],
  },
];

function anguloParaGatilho(gatilho: string): Angulo {
  const map: Record<string, string> = {
    "Urgência de datas": "Urgência de datas",
    "Escassez de vagas": "Urgência de datas",
    "Prova social": "Prova social / autoridade",
    Autoridade: "Prova social / autoridade",
    Exclusividade: "Transformação (antes → depois)",
  };
  const alvo = map[gatilho] ?? "Urgência de datas";
  return ANGULOS.find((a) => a.nome === alvo) ?? ANGULOS[0];
}

function corpoFramework(
  c: Cliente,
  ctx: ReturnType<typeof ctxCliente>,
  p: CopyParams,
  info: NichoInfo,
): string {
  const dor = p.dor.trim() || `o medo de contratar ${info.substantivo} e o resultado não ser à altura do grande dia`;
  const desejo = p.desejo.trim() || `um casamento inesquecível, sem preocupação e com ${ctx.dif}`;
  const oferta = p.oferta.trim();
  const nome = c.nome;

  switch (p.framework) {
    case "PAS (Problema-Agitação-Solução)":
      return (
        `Você sabe qual é o maior risco ao contratar ${info.substantivo}? ${cap(dor)}.\n` +
        `E o pior: é um erro que só aparece no dia — quando não dá mais para voltar atrás.\n` +
        `A ${nome} resolve isso com ${ctx.dif}, garantindo ${desejo}.` +
        (oferta ? `\n${oferta}` : "")
      );
    case "Antes-Depois-Ponte":
      return (
        `ANTES: ${cap(dor)}.\n` +
        `DEPOIS: ${cap(desejo)}.\n` +
        `A PONTE: ${nome} — ${ctx.dif}. É o caminho mais seguro entre o sonho e a realidade.` +
        (oferta ? `\n${oferta}` : "")
      );
    case "PASTOR":
      return (
        `Problema: ${cap(dor)}.\n` +
        `Amplificação: um casamento acontece uma vez — improviso custa caro e não se recupera.\n` +
        `História: cada casal atendido pela ${nome} tem os ${info.prova} como prova.\n` +
        `Transformação: ${cap(desejo)}.\n` +
        `Oferta: ${oferta || `condições especiais para reservas da temporada ${proximoAno()}`}.\n` +
        `Resposta: ${p.cta}.`
      );
    case "4 Cs":
      return (
        `${nome}: ${ctx.dif}.\n` +
        `Claro e direto — ${info.substantivo} de alto padrão para ${ctx.publico}.\n` +
        `A credibilidade está nos ${info.prova}. O desejo, em ${desejo}.`
      );
    case "AIDA":
    default:
      return (
        `${cap(desejo)} começa por uma escolha certa.\n` +
        `A ${nome} entrega ${ctx.dif} para ${ctx.publico} — e é isso que separa um casamento comum de um inesquecível.\n` +
        `Com ${info.prova}, você tem a segurança de que o dia mais importante está em boas mãos.` +
        (oferta ? `\n${oferta}` : "")
      );
  }
}

function ajustaTamanho(corpo: string, tamanho: string): string {
  if (tamanho === "Curta") {
    return corpo.split("\n").slice(0, 2).join("\n");
  }
  if (tamanho === "Longa") {
    return corpo + `\n\nÉ mais do que um serviço — é a tranquilidade de saber que cada detalhe foi pensado para você.`;
  }
  return corpo;
}

function headlines(c: Cliente, info: NichoInfo, p: CopyParams): string[] {
  const base = [
    `${c.nome}: garanta sua data de ${proximoAno()}`,
    `${cap(info.substantivo)} de alto padrão para o seu casamento`,
    `${p.gatilho.includes("vagas") ? "Últimas vagas" : "Agenda abrindo"} para ${proximoAno()}`,
  ];
  return base;
}

export function gerarCopyAnuncio(c: Cliente, p: CopyParams): string {
  const ctx = ctxCliente(c);
  const info = NICHO_INFO[c.nicho];
  const e = p.emojis;
  const anguloPrincipal = anguloParaGatilho(p.gatilho);
  const outros = ANGULOS.filter((a) => a.nome !== anguloPrincipal.nome);
  const angulos = [anguloPrincipal, ...outros].slice(0, Math.max(1, Math.min(3, p.nVariacoes)));

  const cab =
    `${linha}\n${e ? "📣 " : ""}COPY PARA ANÚNCIO · ${c.nome}\n${linha}\n` +
    `${c.nicho} · ${p.plataforma} · ${p.formato}\n` +
    `Objetivo: ${p.objetivo} · Framework: ${p.framework} · Gatilho: ${p.gatilho}\n\n` +
    `${e ? "🎯 " : ""}CONTEXTO\n` +
    `Público: ${ctx.publico}\n` +
    `Tom de voz: ${ctx.tom}\n` +
    `Diferenciais: ${ctx.dif}\n`;

  const blocos = angulos.map((ang, i) => {
    const hooks = ang.hookBase(c, ctx, info);
    const corpo = ajustaTamanho(corpoFramework(c, ctx, p, info), p.tamanho);
    const hs = headlines(c, info, p);
    return (
      `\n${linha}\n${e ? "✳️ " : ""}VARIAÇÃO ${i + 1} · Ângulo: ${ang.nome}\n${linha}\n\n` +
      `${e ? "🎣 " : ""}GANCHOS (escolha 1 para abrir o anúncio):\n` +
      hooks.map((h, idx) => `  ${idx + 1}. ${h}`).join("\n") +
      `\n\n${e ? "📝 " : ""}TEXTO PRIMÁRIO:\n${corpo}\n\n` +
      `${e ? "🏷️ " : ""}TÍTULOS (headline):\n` +
      hs.map((h) => `  • ${h}`).join("\n") +
      `\n\n${e ? "📄 " : ""}DESCRIÇÃO:\n  ${ctx.dif}. ${p.cta}.\n\n` +
      `${e ? "🔘 " : ""}CTA (botão): ${ctaBotao(p.objetivo)}\n` +
      `${e ? "➡️ " : ""}CTA (texto): ${p.cta}\n\n` +
      `${e ? "🎨 " : ""}SUGESTÃO DE CRIATIVO (${p.formato}):\n  ${info.criativo}\n\n` +
      `${e ? "#️⃣ " : ""}HASHTAGS: ${info.hashtags.join(" ")}`
    );
  });

  return cab + blocos.join("\n");
}

function ctaBotao(objetivo: string): string {
  switch (objetivo) {
    case "Mensagens (DM)":
      return "Enviar mensagem";
    case "Agendamentos":
      return "Reservar / Agendar";
    case "Reconhecimento":
      return "Saiba mais";
    default:
      return "Saiba mais / Cadastre-se";
  }
}

/* =========================================================================
 * 2) ROTEIROS
 * ======================================================================= */

export const ROTEIRO_TIPOS_VIDEO = [
  "Reels (viral)",
  "Anúncio (VSL curta)",
  "Vídeo de apresentação",
  "Depoimento de casal",
  "Bastidores",
  "Tutorial / dica rápida",
] as const;

export const ROTEIRO_DURACOES = ["15s", "30s", "45s", "60s", "90s"] as const;
export const ROTEIRO_TRILHAS = ["Emocional / cinematográfica", "Animada / dançante", "Trend do momento", "Instrumental suave"] as const;

export interface RoteiroParams {
  tipo: string;
  duracao: string;
  angulo: string;
  cta: string;
  trilha: string;
  emojis: boolean;
}

export const roteiroParamsPadrao: RoteiroParams = {
  tipo: "Reels (viral)",
  duracao: "30s",
  angulo: "Transformação (antes → depois)",
  cta: "Chame no direct para ver a disponibilidade",
  trilha: "Emocional / cinematográfica",
  emojis: true,
};

interface Cena {
  tempo: string;
  imagem: string;
  fala: string;
  tela: string;
}

function cenasPorTipo(c: Cliente, p: RoteiroParams, info: NichoInfo, ctx: ReturnType<typeof ctxCliente>): Cena[] {
  const nome = c.nome;
  switch (p.tipo) {
    case "Depoimento de casal":
      return [
        { tempo: "0–3s", imagem: "Casal olhando para a câmera, sorrindo", fala: `"A gente tinha medo de errar na escolha..."`, tela: "O depoimento que toda noiva precisa ouvir" },
        { tempo: "3–12s", imagem: "Cortes do casamento real", fala: `"...aí conhecemos a ${nome} e mudou tudo."`, tela: ctx.dif },
        { tempo: "12–24s", imagem: `${info.prova}`, fala: `"No dia, foi melhor do que a gente imaginava."`, tela: "Resultado real" },
        { tempo: `24–${p.duracao}`, imagem: "Logo + contato", fala: p.cta, tela: p.cta },
      ];
    case "Bastidores":
      return [
        { tempo: "0–3s", imagem: "Bastidor da preparação, movimento rápido", fala: "O que ninguém vê antes do grande dia", tela: "BASTIDORES" },
        { tempo: "3–15s", imagem: "Equipe trabalhando, detalhes sendo montados", fala: `Cada detalhe da ${nome} é pensado para você`, tela: ctx.dif },
        { tempo: `15–${p.duracao}`, imagem: "Resultado final impecável + logo", fala: p.cta, tela: p.cta },
      ];
    case "Tutorial / dica rápida":
      return [
        { tempo: "0–3s", imagem: "Rosto falando direto pra câmera", fala: `3 erros ao contratar ${info.substantivo} para o casamento`, tela: "SALVE ESSE VÍDEO" },
        { tempo: "3–20s", imagem: "Textos animados listando os erros", fala: "1) escolher só pelo preço · 2) não ver portfólio real · 3) deixar pra última hora", tela: "Erros comuns" },
        { tempo: `20–${p.duracao}`, imagem: "Chamada para a marca", fala: `A ${nome} resolve os três. ${p.cta}`, tela: p.cta },
      ];
    case "Anúncio (VSL curta)":
      return [
        { tempo: "0–3s", imagem: "Gancho visual forte (pista/cena marcante)", fala: `Se você vai casar em ${proximoAno()}, precisa ver isso.`, tela: "Atenção, noivas!" },
        { tempo: "3–10s", imagem: "Problema + agitação", fala: `Contratar ${info.substantivo} errado arruína o dia mais importante da sua vida.`, tela: "O erro que custa caro" },
        { tempo: "10–22s", imagem: `Solução: ${info.prova}`, fala: `A ${nome} entrega ${ctx.dif}.`, tela: ctx.dif },
        { tempo: `22–${p.duracao}`, imagem: "Oferta + CTA", fala: p.cta, tela: `Agenda ${proximoAno()} abrindo` },
      ];
    case "Vídeo de apresentação":
      return [
        { tempo: "0–4s", imagem: "Abertura com logo e assinatura visual", fala: `${nome} — ${ctx.dif}`, tela: nome },
        { tempo: "4–18s", imagem: `${info.prova}`, fala: `Nós existimos para transformar ${ctx.publico} em casais realizados.`, tela: "Quem somos" },
        { tempo: "18–30s", imagem: "Método / como trabalhamos", fala: "Do primeiro contato ao grande dia, cuidamos de cada detalhe.", tela: "Como trabalhamos" },
        { tempo: `30–${p.duracao}`, imagem: "CTA final", fala: p.cta, tela: p.cta },
      ];
    case "Reels (viral)":
    default:
      return [
        { tempo: "0–2s", imagem: `Gancho: ${info.criativo.split(".")[0]}`, fala: ganchoAngulo(p.angulo, c, ctx), tela: "👀 assista até o fim" },
        { tempo: "2–8s", imagem: "3 cortes rápidos no ritmo da trilha", fala: `Por que ${ctx.publico} escolhem a ${nome}?`, tela: ctx.dif },
        { tempo: `8–${p.duracao}`, imagem: `${info.prova} + logo`, fala: p.cta, tela: p.cta },
      ];
  }
}

function ganchoAngulo(angulo: string, c: Cliente, ctx: ReturnType<typeof ctxCliente>): string {
  if (angulo.includes("Urg")) return `As datas de ${proximoAno()} estão fechando rápido.`;
  if (angulo.includes("Prova")) return `Isso é o que acontece quando você escolhe a ${c.nome}.`;
  if (angulo.includes("Dor")) return `Não cometa o erro que arruína o casamento dos seus sonhos.`;
  return `Do sonho à realidade: veja como ${ctx.publico} vivem o grande dia.`;
}

export function gerarRoteiro(c: Cliente, p: RoteiroParams): string {
  const ctx = ctxCliente(c);
  const info = NICHO_INFO[c.nicho];
  const e = p.emojis;
  const cenas = cenasPorTipo(c, p, info, ctx);

  const cab =
    `${linha}\n${e ? "🎬 " : ""}ROTEIRO · ${p.tipo} · ${p.duracao}\n${linha}\n` +
    `Cliente: ${c.nome} (${c.nicho})\n` +
    `Ângulo: ${p.angulo} · Trilha: ${p.trilha}\n` +
    `Público: ${ctx.publico} · Tom: ${ctx.tom}\n\n`;

  const roteiro = cenas
    .map(
      (cena) =>
        `${e ? "⏱️ " : ""}[${cena.tempo}]\n` +
        `  ${e ? "🎥 " : ""}Imagem/Ação: ${cena.imagem}\n` +
        `  ${e ? "🎙️ " : ""}Narração/Fala: ${cena.fala}\n` +
        `  ${e ? "💬 " : ""}Texto na tela: ${cena.tela}`,
    )
    .join("\n\n");

  const legenda =
    `\n\n${linha}\n${e ? "✍️ " : ""}LEGENDA SUGERIDA:\n` +
    `${ganchoAngulo(p.angulo, c, ctx)} ${ctx.dif}. ${p.cta} ${e ? "💍" : ""}\n\n` +
    `${e ? "#️⃣ " : ""}${info.hashtags.join(" ")}`;

  const dicas =
    `\n\n${linha}\n${e ? "📌 " : ""}DIREÇÃO:\n` +
    `  • Trilha: ${p.trilha}\n` +
    `  • B-roll: ${info.criativo}\n` +
    `  • CTA fixado no primeiro comentário: ${p.cta}\n` +
    `  • Duração alvo: ${p.duracao} — cortes a cada 2–3s para reter atenção.`;

  return cab + roteiro + legenda + dicas;
}

/* =========================================================================
 * 3) REUNIÃO DE RESULTADOS (relatório robusto)
 * ======================================================================= */

export const REUNIAO_PERIODOS = ["Últimas 4 semanas", "Últimas 8 semanas", "Mês atual", "Ciclo completo"] as const;

export interface ReuniaoParams {
  periodo: string;
  incluirResumoExecutivo: boolean;
  incluirAnaliseFunil: boolean;
  incluirInsights: boolean;
  incluirRecomendacoes: boolean;
  incluirPlanoAcao: boolean;
  responsavel: string;
}

export const reuniaoParamsPadrao: ReuniaoParams = {
  periodo: "Últimas 8 semanas",
  incluirResumoExecutivo: true,
  incluirAnaliseFunil: true,
  incluirInsights: true,
  incluirRecomendacoes: true,
  incluirPlanoAcao: true,
  responsavel: "",
};

export function gerarRelatorioReuniao(c: Cliente, tarefas: Tarefa[], p: ReuniaoParams): string {
  const rc = resumoCampanha(c);
  const rv = resumoVendas(c);
  const insights = gerarInsights(c, tarefas);
  const recs = gerarRecomendacoes(c, tarefas);
  const resp = p.responsavel || c.responsavel;
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  let out =
    `${linha}\n📊 REUNIÃO DE RESULTADOS · ${c.nome}\n${linha}\n` +
    `${c.nicho} · Plano ${c.plano} · Responsável: ${resp}\n` +
    `Período: ${p.periodo} · Emitido em: ${hoje}\n\n` +
    `Pauta:\n` +
    [
      p.incluirResumoExecutivo && "1. Resumo executivo (KPIs)",
      p.incluirAnaliseFunil && "2. Análise do funil: mídia → comercial",
      p.incluirInsights && "3. Insights do período",
      p.incluirRecomendacoes && "4. Recomendações de melhoria",
      p.incluirPlanoAcao && "5. Plano de ação e próximos passos",
    ]
      .filter(Boolean)
      .map((s) => `  ${s}`)
      .join("\n");

  if (p.incluirResumoExecutivo) {
    out +=
      `\n\n${linha}\n1) RESUMO EXECUTIVO\n${linha}\n` +
      `MÍDIA (Meta Ads)\n` +
      `  • Investimento total: ${brl(rc.gastoTotal)}\n` +
      `  • Leads gerados: ${rc.leadsTotal}\n` +
      `  • CPL real: ${brl(rc.cplMedio)}  (${rc.deltaCplPct >= 0 ? "▲" : "▼"} ${Math.abs(rc.deltaCplPct).toFixed(0)}% no período)\n` +
      `  • CTR médio: ${pct(rc.ctrMedio)}\n\n` +
      `COMERCIAL (funil do cliente)\n` +
      `  • Receita gerada: ${brl(rv.receitaTotal)}\n` +
      `  • ROAS (retorno s/ mídia): ${rv.roas.toFixed(1)}x\n` +
      `  • Contratos fechados: ${rv.fechadosTotal}  ·  Ticket médio: ${brl(rv.ticketMedio)}\n` +
      `  • Conversão lead→contrato: ${pct(rv.conversao)}\n` +
      `  • CAC (mídia): ${rv.cac ? brl(rv.cac) : "—"}\n\n` +
      `LEITURA RÁPIDA: ${leituraRapida(rv, rc)}`;
  }

  if (p.incluirAnaliseFunil) {
    out +=
      `\n\n${linha}\n2) ANÁLISE DO FUNIL\n${linha}\n` +
      `  Leads (${rv.leadsTotal}) → Reuniões (${rv.reunioesTotal}) → Propostas (${rv.propostasTotal}) → Fechados (${rv.fechadosTotal})\n` +
      `  • Taxa de proposta: ${pct(rv.taxaProposta)} dos leads viraram proposta\n` +
      `  • Onde está o gargalo: ${gargalo(rv)}`;
  }

  if (p.incluirInsights) {
    out +=
      `\n\n${linha}\n3) INSIGHTS DO PERÍODO\n${linha}\n` +
      (insights.length
        ? insights.map((i, idx) => `  ${idx + 1}. [${i.tom.toUpperCase()}] ${i.titulo}\n     ${i.detalhe}`).join("\n\n")
        : "  Sem sinais relevantes no período.");
  }

  if (p.incluirRecomendacoes) {
    out +=
      `\n\n${linha}\n4) RECOMENDAÇÕES DE MELHORIA\n${linha}\n` +
      (recs.length
        ? recs.map((i, idx) => `  ${idx + 1}. ${i.titulo}\n     → ${i.detalhe}`).join("\n\n")
        : "  Conta saudável — manter o ritmo atual.");
  }

  if (p.incluirPlanoAcao) {
    out +=
      `\n\n${linha}\n5) PLANO DE AÇÃO E PRÓXIMOS PASSOS\n${linha}\n` +
      planoAcao(c, rv, rc, resp).map((a) => `  ☐ ${a}`).join("\n") +
      `\n\nPróximo passo definido: ${c.proximoPasso}`;
  }

  return out;
}

function leituraRapida(rv: ReturnType<typeof resumoVendas>, rc: ReturnType<typeof resumoCampanha>): string {
  if (rv.roas >= 5) return `Conta performando acima da média (ROAS ${rv.roas.toFixed(1)}x). Momento de escalar com segurança.`;
  if (rv.roas > 0 && rv.roas < 2) return `Retorno abaixo do ideal (ROAS ${rv.roas.toFixed(1)}x). Prioridade é corrigir oferta/conversão antes de investir mais.`;
  if (rc.deltaCplPct > 15) return `Leads chegando, mas CPL em alta (${rc.deltaCplPct.toFixed(0)}%). Renovar criativos é prioridade.`;
  return `Conta estável. Foco em otimização incremental e manutenção da cadência.`;
}

function gargalo(rv: ReturnType<typeof resumoVendas>): string {
  if (rv.leadsTotal > 0 && rv.conversao < 10) return "comercial — leads chegam, mas a conversão está baixa. Revisar follow-up e script.";
  if (rv.leadsTotal === 0) return "topo de funil — sem volume de leads. Revisar mídia, verba e segmentação.";
  if (rv.taxaProposta < 30) return "qualificação — poucos leads viram proposta. Melhorar atendimento inicial.";
  return "sem gargalo evidente — funil equilibrado.";
}

function planoAcao(
  c: Cliente,
  rv: ReturnType<typeof resumoVendas>,
  rc: ReturnType<typeof resumoCampanha>,
  resp: string,
): string[] {
  const acoes: string[] = [];
  if (rv.roas >= 5) acoes.push(`Escalar +20% de verba nos melhores conjuntos (resp: ${resp}) — prazo 3 dias`);
  if (rv.conversao > 0 && rv.conversao < 10) acoes.push(`Implantar cadência de follow-up 24h/3d/7d com o comercial do cliente — prazo 7 dias`);
  if (rc.deltaCplPct > 15) acoes.push(`Produzir 3 criativos novos (reels + depoimento) para reoxigenar a entrega — prazo 5 dias`);
  if (c.etapaFunil === "Janela de Renovação") acoes.push(`Montar case de resultados e proposta de renovação — prazo 2 dias`);
  acoes.push(`Revisar métricas na próxima reunião semanal (resp: ${resp})`);
  return acoes;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
