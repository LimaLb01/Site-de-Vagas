# Achou Vaga — prompts para o Stitch

Seguem a documentação do Stitch: primeiro prompt na fórmula
**[Ideia] [Tema] [Conteúdo]**, depois **uma tela por vez** e **uma mudança por
prompt**. Cores, fontes e tamanhos ficam no `DESIGN.md`; os prompts não repetem
códigos de cor nem nome de fonte, para não brigar com ele.

## 0. Preparar o projeto

1. Novo projeto → **App** (celular primeiro).
2. Modo de design: **Thinking with 3 Pro** (o recomendado para a versão de produção).
3. Carregue o `DESIGN.md` como design system do projeto. Se não achar onde colar,
   mande como primeira mensagem do chat:

```
Use o DESIGN.md abaixo como design system deste projeto em todas as telas.
[cole aqui o conteúdo do DESIGN.md]
```

## 1. Tela inicial

```
[Ideia] Tela inicial do "Achou Vaga", um site de vagas de emprego para todo o Brasil, usado por jovens, adultos e pessoas que usam pouco a internet. A pessoa diz o que procura e o site mostra só as vagas que combinam com ela.

[Tema] Minimalista, calmo e muito claro, seguindo o DESIGN.md do projeto. Muito espaço em branco, texto grande, uma única cor de ação. Sem fotos de banco de imagem, sem ilustração 3D, sem gradiente: só ícones simples de traço.

[Conteúdo] Todo o texto em português do Brasil. No topo, o nome "Achou Vaga" à esquerda e um botão "A+ Texto maior" à direita. Título grande: "Encontre a vaga certa para você". Subtítulo: "Diga o que procura. A gente mostra só o que combina com você." Formulário com rótulo sempre visível acima de cada campo: "Qual trabalho você procura?" (exemplo dentro do campo: Auxiliar administrativo) e "Em qual cidade?" (exemplo: Canoas, RS), mais um interruptor "Aceito trabalhar de casa (remoto)". Botão principal de largura total: "Ver vagas". Abaixo, três benefícios curtos, cada um com ícone e uma frase: "Vagas de vários sites num lugar só", "Veja se você tem chance antes de se candidatar", "Receba vagas novas no seu e-mail". Barra de navegação inferior fixa com ícone e texto: Início, Vagas, Salvas, Perfil.
```

Dica da documentação: rode o mesmo prompt também no modo **2.5 Pro** para comparar
duas interpretações antes de seguir.

## 2. Ajustes (um por prompt)

Cite a tela e o elemento, diga o que mudar e como. Exemplos:

```
Na tela inicial, aumente o espaço entre o subtítulo e o formulário.
```

```
Na tela inicial, deixe os três benefícios em uma lista vertical, com o ícone à esquerda de cada frase.
```

Mudança de cor, fonte, cantos ou modo claro/escuro: use **Generate → Edit Theme**
em vez de prompt — é a ferramenta da própria documentação para isso.

## 3. Próximas telas (uma de cada vez, no mesmo projeto)

### Lista de vagas

```
[Ideia] Nova tela do Achou Vaga: a lista de vagas que combinam com a busca da pessoa, seguindo o mesmo DESIGN.md da tela inicial.

[Conteúdo] Todo o texto em português do Brasil. No topo, a busca atual em uma linha: "Auxiliar administrativo em Canoas" com um link "Mudar". Abaixo: "38 vagas para você". Uma linha de filtros em pílula: "Trabalho de casa", "Sem inglês", "Com salário", "Mais filtros". Lista de cartões de vaga; cada cartão mostra o título da vaga em destaque, a empresa, a cidade, o salário quando houver, "Publicada há 2 dias" e um selo de compatibilidade com ícone e texto: verde "Combina muito", âmbar "Combina em parte" ou cinza "Pouco provável". Entre o terceiro e o quarto cartão, um cartão de anúncio no mesmo formato, com a palavra "Patrocinado" bem visível. Barra de navegação inferior igual à da tela inicial, com "Vagas" ativo.
```

### Detalhe da vaga

```
[Ideia] Nova tela do Achou Vaga: o detalhe de uma vaga, seguindo o mesmo DESIGN.md.

[Conteúdo] Todo o texto em português do Brasil. Título "Auxiliar Administrativo", empresa "Supermercado Bom Preço", cidade "Canoas, RS". Uma linha de informações com ícone e texto: "R$ 2.100", "Presencial", "Não pede inglês". Botão principal grande: "Ver se eu tenho chance". Botão secundário com contorno: "Ir para a vaga no site da empresa". Duas seções com texto curto em lista: "O que você vai fazer" e "O que pedem". Botão com ícone de coração e a palavra "Salvar" perto do título.
```

### Resultado da análise do currículo

```
[Ideia] Nova tela do Achou Vaga: o resultado da comparação entre o currículo da pessoa e uma vaga, seguindo o mesmo DESIGN.md. Tem que ser entendido em segundos, sem números nem gráficos.

[Conteúdo] Todo o texto em português do Brasil. No topo, um resultado grande com ícone verde e a frase "Você tem boas chances nesta vaga". Seção "O que você já tem" com 3 itens marcados com ✓. Seção "O que falta" com 2 itens, cada um com uma dica curta de como resolver. Cartão "Como melhorar" sugerindo um curso de Excel, com botão "Ver curso". Botão principal: "Candidatar-me agora". No rodapé, em texto menor: "Você ainda tem 2 análises grátis este mês" e o link "Conhecer o plano Pro".
```

### Planos

```
[Ideia] Nova tela do Achou Vaga: comparação de planos, seguindo o mesmo DESIGN.md.

[Conteúdo] Todo o texto em português do Brasil. Título: "Escolha seu plano". Dois cartões empilhados. Cartão "Grátis — R$ 0": ver todas as vagas, filtros, 3 análises de currículo por mês, alerta diário por e-mail; botão com contorno "Começar grátis". Cartão "Pro — R$ 14,90 por mês", com o selo discreto "Mais escolhido": análises ilimitadas, alerta na hora, currículo ajustado para cada vaga, sem anúncios; botão principal "Assinar o Pro". Abaixo dos cartões, uma linha simples: "Cancele quando quiser. Pagamento por Pix ou cartão."
```

## 4. Explorar alternativas (Variations)

Para polir sem mudar a estrutura — Creative Range **Refined**:

```
Varie apenas espaçamentos, pesos dos títulos e tamanho dos cartões. Mantenha a estrutura, a cor de ação e o texto.
```

Para ver caminhos bem diferentes da tela inicial — Creative Range **Creative**
(a documentação diz que variações são o lugar das mudanças grandes):

```
Na tela inicial, explore layouts diferentes para o formulário de busca: um só campo grande com sugestões, ou os campos em etapas, uma pergunta por vez. Mantenha o visual minimalista e a única cor de ação.
```

Gostou da estrutura de uma e da cor de outra? Selecione a melhor, volte para
**Refined** e peça para trazer o detalhe que faltou.

## 5. Testar

**Generate → Prototype** em cada tela: clique, digite nos campos, veja se o texto
cabe e se os botões são fáceis de achar.

## 6. Versão para computador

Crie um projeto novo em modo **Web** e use a imagem baixada da tela do celular
como referência (o caminho que a documentação recomenda para "traduzir", não
redimensionar):

```
Converta este design de celular do Achou Vaga em um site para computador.
[Navegação] Troque a barra inferior por uma barra de navegação no topo com Início, Vagas, Salvas e Perfil.
[Destaque] Na tela inicial, coloque o título e o formulário de busca à esquerda e os três benefícios à direita.
[Grade] Na lista de vagas, use duas colunas de cartões.
Mantenha o mesmo visual calmo, a mesma fonte e a única cor de ação.
```

Se parte da página parecer cortada, aumente a altura do quadro: o Stitch
costuma gerar o resto e esconder.

## 7. Me mandar

Selecione as telas → **Download** (zip com imagens e HTML) ou mande os prints.
