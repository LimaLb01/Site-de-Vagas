---
version: alpha
name: Achou Vaga - Claro e Acolhedor
description: Site de vagas para todas as idades, de quem nasceu no celular a quem usa pouco a internet. Mobile primeiro, leitura fácil, uma ação principal por tela.
colors:
  primary: "#0E5A7A"
  primary-hover: "#0A4760"
  primary-soft: "#E3F0F5"
  ink: "#16181A"
  ink-muted: "#4A5058"
  surface: "#FFFFFF"
  background: "#F6F7F5"
  border: "#DDE1E4"
  border-strong: "#8A9099"
  match-high: "#1F7A3A"
  match-high-soft: "#E4F3E8"
  match-mid: "#8A5A00"
  match-mid-soft: "#FFF4D6"
  match-low: "#5B616B"
  match-low-soft: "#EEF0F2"
  error: "#B3261E"
typography:
  display:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 56px
    padding: 16px 24px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    borderWidth: 2px
    rounded: "{rounded.md}"
    height: 56px
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border-strong}"
    borderWidth: 2px
    rounded: "{rounded.md}"
    height: 56px
    typography: "{typography.body-lg}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    padding: 20px
  chip:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.full}"
    height: 44px
    typography: "{typography.label}"
  chip-selected:
    backgroundColor: "{colors.primary-soft}"
    borderColor: "{colors.primary}"
    textColor: "{colors.primary}"
  bottom-nav:
    backgroundColor: "{colors.surface}"
    height: 72px
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.ink-muted}"
---

# Achou Vaga

## Overview

Site de vagas que mostra só o que combina com a pessoa e diz, antes dela se
candidatar, se ela tem chance. O público vai do jovem que procura o primeiro
estágio ao adulto de 60 anos que usa pouco a internet. Por isso a regra que
manda em tudo é: **qualquer pessoa entende a tela na primeira olhada.**

Sensação desejada: calmo, confiável, direto. Nada de painel cheio de números,
nada de visual "de startup". Parece um balcão de atendimento bem organizado,
não um aplicativo de banco.

## Colors

Fundo branco e cinza muito claro, texto quase preto, e uma única cor de ação.

- **Primary — Azul-petróleo (#0E5A7A):** botões principais, links, item ativo do
  menu. Contraste 7,6:1 sobre branco. É a única cor que pede ação.
- **Ink (#16181A):** todo texto principal.
- **Ink muted (#4A5058):** texto secundário. Nunca usar cinza mais claro que este
  para texto: quem enxerga menos não lê cinza claro.
- **Background (#F6F7F5) e Surface (#FFFFFF):** fundo da página e dos cartões.
- **Semáforo de compatibilidade:** verde (#1F7A3A) "Combina muito", âmbar
  (#8A5A00) "Combina em parte", cinza (#5B616B) "Pouco provável". Sempre com
  ícone e texto junto: a cor nunca é a única informação.

## Typography

Uma família só: **Atkinson Hyperlegible Next**, desenhada para leitura de quem
tem baixa visão — letras que não se confundem (I, l, 1; O, 0). Serve ao jovem e
ao idoso sem parecer "fonte de acessibilidade".

- Texto normal em **18px** (body-lg). 16px só em texto de apoio; 14px só em
  rótulos curtos como data. Nada abaixo de 14px.
- Entrelinha generosa (1,5 a 1,6).
- Negrito só em título e no que a pessoa precisa decidir.

## Layout

- **Mobile primeiro.** A maioria acessa pelo celular, inclusive o público mais
  velho. Desktop é a mesma tela com mais respiro, não mais informação.
- Grade de 8px. Margem lateral de 20px no celular.
- **Uma ação principal por tela**, sempre no mesmo lugar e grande.
- Menu inferior fixo com 4 itens, ícone **e** texto: Início, Vagas, Salvas, Perfil.
- Filtros avançados ficam atrás de "Mais filtros". O padrão mostra só 3 ou 4.

## Elevation & Depth

Quase plano. Cartões separados por borda de 1px e fundo, sem sombra pesada.
Sombra suave só em elementos que flutuam (menu inferior, avisos).

## Shapes

Cantos de 12px em botões e campos, 16px em cartões, totalmente arredondado em
chips. Mesma regra em todas as telas.

## Components

- **Botão principal:** 56px de altura, largura total no celular, texto com verbo
  ("Ver vagas", "Ver se eu tenho chance").
- **Botão secundário:** contorno de 2px na cor primária.
- **Campo de texto:** 56px, rótulo sempre visível em cima (nunca só placeholder),
  borda de 2px, foco com anel de 3px na cor primária.
- **Cartão de vaga:** título da vaga grande, empresa, cidade, salário quando
  houver, há quanto tempo foi publicada, e o selo do semáforo.
- **Selo de compatibilidade:** pílula com ícone + texto ("✓ Combina muito").
- **Anúncio:** cartão com a palavra "Patrocinado" bem visível, mesmo formato do
  cartão de vaga, no máximo um a cada seis vagas.

## Movimento

Animação serve para mostrar o que mudou, nunca para enfeitar.

- Duração entre 150 e 250 ms, saída suave (ease-out).
- Só desvanecer e deslocar 8px. Sem quicar, sem parallax, sem carrossel automático.
- Botão afunda levemente ao tocar (escala 0,98).
- Carregamento com blocos cinza no formato do conteúdo, não com roda girando.
- Respeitar "reduzir movimento" do aparelho: aí nada se mexe.

## Acessibilidade e faixas etárias

- Área de toque mínima de 48px em tudo que é clicável.
- Botão "A+ Texto maior" no topo: aumenta o texto base para 20px.
- Nunca ícone sozinho: todo ícone tem palavra junto.
- Linguagem simples: "Trabalho de casa (remoto)", não só "Remoto"; "Já me
  candidatei", não "Aplicada".
- Nada escondido em gesto (arrastar, segurar) ou em passar o mouse.
- Ações que apagam algo pedem confirmação.
- Contraste mínimo de 4,5:1 em todo texto (o projeto mira 7:1 no texto normal).

## Do's and Don'ts

- Do: uma decisão por tela, com o botão principal sempre visível.
- Do: dizer o que vai acontecer no texto do botão.
- Do: mostrar o salário quando existir; é o que todo mundo procura primeiro.
- Don't: gradiente roxo, vidro fosco, neon, ilustrações 3D genéricas.
- Don't: texto todo em maiúsculas, nem rótulos em letra pequena e espaçada.
- Don't: mais de uma cor chamando ação na mesma tela.
- Don't: tabela ou painel com muitos números; transforme em frase ("Você tem boas chances").
