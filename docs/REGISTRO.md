# TravelBuenaVista — registro do trabalho

Documento de acompanhamento da reforma do site. Última atualização: 24/07/2026.

---

## Onde paramos

**A reforma foi publicada.** O que está no ar em
<https://travel-buena-vista.vercel.app/> é a `main`, que a Vercel publica a cada
push. A branch `melhorias-2026` cumpriu o papel e não é mais a fonte da verdade.

As pendências no fim deste documento continuam valendo — publicar não resolveu
nenhuma delas.

### ⚠️ Este registro tem um buraco

A linha do tempo abaixo documenta em detalhe os commits **1 a 10** (até
`6268d93`) e o **11** (`e4dd5cb`). Os seis do meio entraram sem registro aqui:

```
70e7351  chore: consolida ajustes de conteudo e CSS que estavam sem commit
5d3cc1b  feat: redesign imersivo da home (awwwards-kit)
8921fc6  chore: ignora artefatos do Vercel e tira dev do deploy
7d15b57  perf: leva as fotos novas para destinos/pacotes e otimiza tudo em WebP
0caac57  copy: reescreve o bloco "Quem somos"
e699f38  copy: tira excursoes e a narrativa de guia acompanhante
```

O `5d3cc1b` é o mais importante do lote: é ele que traz o hero em WebGL da home
(`css/experiencia.css` + `js/experiencia.js`), que o commit 11 conserta. Quem
retomar o projeto e precisar do contexto dessas seis mudanças vai ter que ler o
diff — não está escrito em lugar nenhum.

### Trabalho que estava solto, e entrou em `70e7351`

O que segue estava na árvore de trabalho sem commit quando este documento foi
escrito. **Já está commitado** — o relato fica porque explica *por quê* de cada
decisão, e isso o diff não conta.

| Arquivo | Situação naquele momento |
|---|---|
| `img/thiago-guia.jpeg` | novo (não rastreado) |
| `img/thiago-guia.webp` | **apagado** |
| `img/ceu-floresta.webp` | modificado (imagem nova, mesmo caminho) |
| `js/revelar.js` | novo (não rastreado) |
| `js/form.js` | modificado |
| `css/redesign.css` | modificado |
| as 9 páginas `.html` | modificadas |

O que foi feito, em três frentes:

**1. Foto do guia trocada.** A foto antiga (só o Thiago) saiu; entrou uma foto
de família fornecida pela agência, movida da raiz do repo para
`img/thiago-guia.jpeg`. Referências atualizadas em `about.html`, `guide.html` e
`blog.html`. Dois ajustes de enquadramento foram necessários:

- `object-position: 50% 40%` no `.person-media img` — o card é 1:1 e a foto é
  3:4, e o corte central cortava o rosto de quem está no topo;
- `max-width: 340px` + `margin-inline: auto` no `.person` — o `.grid-3` usa
  `repeat(auto-fit, minmax(280px, 1fr))`, então **com um guia só a coluna virava
  a largura inteira da página** e a foto ficava gigante. Era um problema
  pré-existente, que a foto nova só tornou visível.

**2. Animações.** Não havia nenhuma — verificado que a versão pré-redesign
(`21ec485^`) também não tinha, então não foi regressão.

- `js/revelar.js` (novo): entrada ao rolar via `IntersectionObserver`, nas 9
  páginas. Sobe 18px + fade de 0,55s, com 90ms de escalonamento entre cards da
  mesma fileira. Revela uma vez e solta o elemento.
- Entrada do hero em cascata no carregamento, em CSS puro (`@keyframes
  hero-entrada`). Separado do scroll reveal de propósito: o hero já está na tela
  quando a página abre, então nunca dispararia por scroll.

  **Decisão que vale preservar:** a classe `.revelar` é aplicada pelo JS, nunca
  escrita no HTML. O padrão comum — esconder tudo no CSS e o JS revelar — faz a
  página inteira sumir se o script falhar. Do jeito atual, falha custa só a
  animação. Esse caso está coberto por teste.

**3. Seção Serviços — visual e copy** (`index.html` + `service.html`, bloco
duplicado nos dois).

O diagnóstico do visual: na home, essa seção fica **entre duas seções cheias de
foto** (grade de destinos acima, "Sobre" abaixo). Era a única parede de caixas
brancas no meio disso — lia como genérica por falta de contraste com a
vizinhança, não por causa do card em si. Encher de foto também resolveria
errado: viraria sopa de imagem, sem respiro.

Virou **faixa escura com bento**: fundo azul-marca profundo, cards em vidro
translúcido, e dois cards largos (Pacotes e Excursões) ocupando 2 das 4 colunas.
Nesses dois o ícone fica ao lado do texto em vez de em cima — empilhado, o texto
curto deixava um vazio grande no rodapé, já que o card estica até a altura da
fileira.

Tudo escopado em `.servicos`: a classe `.card` também é usada em `about.html` e
`destination.html` e não podia mudar.

> **Registrado porque quase deu errado:** o acervo em `img/travelBuena-photos/`
> parece uma mina de fotos reais, mas não serve para layout. `Cancun.webp` é um
> print de grade do Instagram, com logo; `Cruzeiro.webp` é um snapshot escuro e
> desfocado. Só `img/pacotes/` tem qualidade de publicação. Um layout com foto
> grande usando aquela pasta ficaria **pior** que os cards brancos.

A copy dos seis cards também foi reescrita (a pedido, numa rodada anterior):
descreviam categorias que qualquer agência publicaria igual. Agora têm
especificidade ancorada no que o site já afirma — o `<h2>` do blog é "Destinos
que já levamos gente", então Cancún, Londres e Grécia são viagens reais.

**4. Faixa escura no CTA e fusão de dois campos do formulário.**

O `.cta` passou a usar o mesmo fundo escuro da seção de serviços. **A definição
está numa regra só** (`.faixa-escura, .servicos, .cta`) — duas cópias do mesmo
gradiente divergem com o tempo, que é exatamente como o site acabou com dois
telefones diferentes.

Os campos "Para onde você quer ir?" (input) e "Conte um pouco mais" (textarea)
viraram **um único textarea** `#quest`, nas 9 páginas: pedir destino e detalhes
em caixas separadas fazia a pessoa repetir a mesma informação. O formulário foi
de 5 para 4 campos.

> **Dívida criada:** o payload do backend **não tem mais a chave
> `destination`**. Está comentado no topo de `js/form.js`, junto da constante
> `MODO`. Se alguém religar `MODO = "backend"` sem ler isso, e a API exigir o
> campo, o envio quebra. Hoje não afeta ninguém porque o modo é `"whatsapp"`.

**5. Imagem do hero das páginas internas trocada.** Entrou uma foto de barco
em rio entre falésias, no lugar da anterior. Convertida de PNG para webp:
**2.950 KB → 259 KB** (91% menor, e menor que os 280 KB da imagem antiga).

Salva em `img/ceu-floresta.webp`, o mesmo caminho de antes — as 8 páginas
internas referenciam esse nome em `style="background-image: ..."` e voltaram a
funcionar sem edição. Isso corrigiu um problema que existia no meio do caminho:
com o `.webp` renomeado à mão e só o `.png` na pasta, **o hero das 8 páginas
estava quebrado**.

O enquadramento precisou de ajuste (`css/redesign.css`, `.page-hero`): o hero é
uma faixa de ~250px, então o `cover` mostra só uma banda estreita da foto.
Centralizado sobrava a parte escura do meio, e a água e o barco ficavam fora do
corte — passou a `center 72%`.

Os arquivos `img/ceu-floresta.png` (2,9 MB) e `img/ceu-floresta-.webp` foram
apagados a pedido. Nada se perdeu: o segundo era a imagem antiga renomeada, e
foi confirmado por `git hash-object` que é byte a byte idêntica à versão em
`HEAD` — recuperável com `git checkout HEAD -- img/ceu-floresta.webp`.

> **Como converter imagem neste repo.** Não há `cwebp` nem ImageMagick nesta
> máquina. A conversão foi feita pelo encoder WebP do próprio Chromium, via
> Playwright: carrega a imagem, desenha num `<canvas>` e exporta com
> `canvas.toDataURL('image/webp', qualidade)`. Foram testadas as qualidades
> 0,72 / 0,80 / 0,85 / 0,90 e escolhida a **0,72** — indistinguível do original
> na escala em que a imagem é exibida, ainda mais por ser fundo atrás de
> sobreposição escura. O encoder do Chromium rende menos que o `cwebp`, então
> quem tiver `cwebp` à mão consegue arquivo menor com a mesma qualidade.

> **Duas frases foram inferidas e precisam de confirmação da agência antes de
> publicar** — estão detalhadas em Pendências. É o mesmo tipo de erro
> registrado nos commits `5a644d3` e `21ec485`: conteúdo plausível que ninguém
> da agência disse.

---

## O site hoje (em produção)

**9 páginas:** `index`, `about`, `service`, `package`, `destination`,
`guide`, `blog`, `testimonial`, `contact`.

**Front-end sem framework** — com uma exceção, a home. Bootstrap, jQuery,
owl.carousel e easing foram removidos. O que roda nas páginas internas:

| Arquivo | O que faz |
|---|---|
| `css/redesign.css` | Design system inteiro (~15KB) |
| `js/carrossel.js` | Carrossel genérico (hero + depoimentos) |
| `js/revelar.js` | Entrada ao rolar |
| `js/form.js` | Formulário de lead |
| inline (~15 linhas) | Menu mobile |

**A home e a `experiencia.html` são o caso à parte.** Desde o `5d3cc1b` elas
usam outra pilha, carregada de CDN: GSAP + ScrollTrigger, Lenis e SplitType,
mais `css/experiencia.css` e `js/experiencia.js`. É aqui que vive o hero em
WebGL. Vale saber de duas coisas antes de mexer:

- **Quatro dependências de CDN.** Se a `gsap` não carregar, o `experiencia.js`
  desiste logo na primeira linha (`if (!window.gsap) return`) e a home perde
  todo o movimento de uma vez. Nenhuma outra página depende de rede para
  funcionar.
- **O shader é o ponto frágil.** Ver commit 11 na linha do tempo: ele tem quatro
  caminhos de desistência e todos caem no mesmo degradê de CSS.

**Contatos padronizados:** um único telefone `(11) 97673-2628` e um único
e-mail `contato@tbvtagencia.com` em todas as páginas.

**Peso da home:** 1,56 MB → **0,63 MB**. Imagens do site: 23,9 MB → 4,1 MB.

---

## Linha do tempo

### 1. `0ed7ec8` — conserta formulários, imagens e SEO

O ponto de partida. Problemas que existiam há dois anos:

- **O formulário da página de Contato nunca funcionou.** O botão de envio era
  um `<a href="mailto:">` (nem era `submit`), e o destino era `mail/contact.php`
  — arquivo default do template, com `$to = "info@example.com"`, num site
  estático sem PHP. Todo lead dessa página evaporou.
- **Erro de servidor exibia "Sucesso!".** O código não checava `response.ok`,
  então um HTTP 500 caía no `.then()` e o usuário via confirmação de um e-mail
  que nunca foi entregue.
- **~33s de espera no envio.** O backend (Render, plano gratuito) hiberna:
  medi 31,5s de cold start. Em cima disso havia um `setTimeout` artificial de
  2s no código.
- **10,6 MB de imagem só na home**, com fotos salvas em PNG.
- **SEO era o placeholder do template:** `description` e `keywords` diziam
  literalmente "TravelBuenaVista Model" em todas as páginas. Zero tags
  Open Graph — link compartilhado no WhatsApp não gerava preview.
- **Preloader travado em 3s** por `setTimeout` fixo, mesmo com a página pronta.
- Favicon apontando para arquivo inexistente em 8 das 10 páginas.
- 3 imagens 404 e 16 imagens sem `alt`.
- jQuery 3.4.1, com XSS conhecido (CVE-2020-11022/11023).

### 2. `6871d4d` — preview do redesign da home

Página separada e `noindex`, para avaliação lado a lado. Design system próprio,
sem Bootstrap.

### 3. `dd8462b` — enquadramento da seção "Sobre" e `alt` errado

A arte de `about.webp` é um cartaz vertical 1000×1500 com texto embutido; o
recorte 4:3 cortava a composição. Também corrigiu um `alt` que eu havia escrito
sem ter visto a imagem: dizia "Equipe atendendo clientes", mas é um avião.

### 4. `5a644d3` — depoimentos e carrossel

**Alteração indevida de conteúdo, corrigida.** O site tem 4 depoimentos de
clientes reais; o preview trazia 3, e os textos haviam sido editados:

| Cliente | O que ela disse | O que eu havia publicado |
|---|---|---|
| Tati Torricelli | "Deu tudo certo, aproveitamos bastante." | + frase inventada "Organização impecável do começo ao fim" |
| Andreia | texto longo sobre a Grécia | parafraseado e encurtado |
| Vivi & Sueli | duas falas separadas | fundidas e reescritas |
| Andreia (2º) | depoimento inteiro | removido |

Todos voltaram transcritos na íntegra, com comentário no HTML pedindo que não
sejam editados. O carrossel também voltou (autoplay, loop, bolinhas).

### 5. `8e063f1` — contraste ilegível

O card do formulário é branco dentro de uma seção azul-escura. A regra `.cta p`
pintava o texto de azul-claro para o fundo escuro, e essa cor vazava para dentro
do card: **1,22:1 de contraste** (mínimo WCAG: 4,5:1). Mais 4 pontos de texto
tinham o mesmo problema.

### 6. `d4bff8b` — formulário vai para o WhatsApp

Em vez de depender do backend que hiberna, o formulário monta uma mensagem com
o que a pessoa digitou e abre o WhatsApp já preenchido.

Controlado por uma constante no topo de `js/form.js`:

```js
var MODO = "whatsapp";  // "whatsapp" | "backend"
```

O caminho do backend continua inteiro e testado — verificado nos dois sentidos.

**Bug corrigido junto:** o botão de envio era desabilitado *antes* da validação,
e o caminho de erro retornava sem reabilitar. Quem esquecesse um campo ficava
com o botão travado para sempre.

### 7. `21ec485` — redesign em todo o site

As 9 páginas passam a usar o design system. Bootstrap e jQuery saem do site
inteiro.

**Conteúdo inventado removido antes de replicar** (senão viraria ficção em 9
páginas):

- barra de confiança dizia "+10 anos", "7 continentes", "100% sob medida",
  "24h de suporte" — nenhum número veio da agência;
- pacotes tinham nome, duração e nº de pessoas inventados ("Caribe & Cancún —
  7 diárias"). A `package.html` original **não tem nome nem duração em pacote
  nenhum**;
- selo "Novo — Roteiros personalizados para 2026".

`single.html` removida: era a página de post do template, com lorem ipsum,
navbar escrita "TRAVELER" e menu em inglês, pública há dois anos.

### 8. `6b5d838` — domínio correto

O domínio era chute meu a partir do e-mail (`www.tbvtagencia.com`). O real é
`travel-buena-vista.vercel.app`. Canonical apontando para domínio inexistente
faz o Google descartar a tag, e `og:image` quebrada tira o preview no WhatsApp.

Verificado que a Vercel está com `cleanUrls` desligado: `/about.html` responde
200 e `/about` dá 404 — então as canônicas seguem com `.html`.

### 9. `ea1cf42` — barra de contatos no mobile

Ocupava ~70px do topo em duas linhas para repetir informação que já está no
rodapé e no botão flutuante. Com ela fora, o `<h1>` sobe de ~233px para ~163px
e os dois CTAs cabem na primeira tela. O site antigo também a escondia
(`d-none d-lg-block`) — foi regressão minha.

### 10. `6268d93` — carrossel do hero

O hero antigo tinha **2 slides** e eu havia mantido só o primeiro:

1. `carosel1.webp` — "Vamos descobrir o mundo juntos"
2. `carosel2.webp` — "Descubra lugares incríveis conosco"

O sobretítulo "Passeios & viagens" também voltou. O JS do carrossel, que estava
copiado inline em 6 páginas, virou `js/carrossel.js`.

> Entre este commit e o próximo há **seis commits sem registro** — listados em
> "Onde paramos". O `5d3cc1b`, que trouxe o hero em WebGL, é o que dá contexto
> ao commit 11.

### 11. `e4dd5cb` — hero em WebGL quebrado no celular

**Sintoma:** no Chrome Android o hero da home mostrava um **ícone de imagem
quebrada** no canto superior esquerdo. No desktop, e até no emulador de
dispositivo do DevTools, estava perfeito — o que é a assinatura de um problema
de GPU, não de layout.

Não havia `<img>` nenhum ali. Era o `<canvas>` do shader: quando o WebGL não
sobe, o Chrome pinta o placeholder de imagem quebrada no lugar do canvas. O
código só fazia `return` e deixava o elemento morto no DOM.

**Conserto em duas camadas.** A primeira é desistir direito: toda saída agora
remove o canvas e marca o hero com `.xp-hero--liso`, um degradê estático na
paleta da marca. Cobre WebGL ausente, shader que não compila, link que falha e
contexto perdido.

A segunda é não precisar desistir. O shader estava dimensionado para desktop:

| O que estava errado | Por quê |
|---|---|
| `precision highp float` fixo | Muita GPU de Android não tem `highp` no fragment shader — nessas, o shader **não compila**. Agora pergunta com `getShaderPrecisionFormat` e cai para `mediump`. |
| Buffer em `devicePixelRatio` cheio | Num celular com dpr 3 são ~2,4 milhões de pixels por quadro. Limitado a 900px no lado maior; o CSS estica de volta e, sendo fluido borrado, não dá para ver. |
| `antialias`, `depth`, `stencil` ligados | Inúteis num quad de tela cheia, e cada um é memória de GPU. |
| 5 oitavas de `fbm` | Fill rate é o gargalo no celular. São 4 lá. |
| `resize` realocando a GPU | A barra de URL do Chrome Android dispara `resize` a cada scroll. Agora só realoca quando a **largura** muda. |
| Sem teto de frame rate | 30fps travados no celular. Menos quadro para desenhar sobra GPU para o scroll do Lenis. |

**A decisão que vale preservar:** em vez de adivinhar por user-agent quais
aparelhos aguentam, o loop **mede**. Passou de ~1s abaixo de 10fps, o shader sai
de cena e entra o degradê. Lista de user-agent envelhece e mente; medição, não.

Verificado num aparelho real: a fumaça roda e o scroll não trava.

---

## Bugs que só apareceram porque foram testados

Vale registrar: nenhum destes apareceria em captura de tela ou revisão visual.

- **Bolinhas do hero não clicáveis.** Ficavam atrás da barra de confiança, que
  sobe `-4.5rem` sobre o hero. Visíveis, mas `elementFromPoint` no centro delas
  retornava a barra.
- **Botão de envio travado.** Após erro de validação, ficava desabilitado para
  sempre.
- **HTTP 500 exibindo "Sucesso!"** — o lead sumia e ninguém sabia.
- **`url()` em custom property do CSS** resolve relativo ao arquivo `.css`, não
  ao HTML: o hero pedia `/css/img/carosel1.webp` e dava 404.
- **Gradiente de contraste com `z-index: -1`**, atrás da própria foto. O texto
  só era legível porque a imagem é escura.
- **Margem padrão de `<blockquote>`** (`margin: 1em 40px`) desalinhava o
  carrossel em 40px. O `scroll-snap` mascarava rolando para compensar.
- **`Math.round(1.33)` = 1** gerava uma única bolinha e o autoplay não tinha
  para onde ir.

### E um que nenhum teste pegaria

O hero quebrado do commit 11 é o contrário de todos os de cima: **passou por
toda a verificação automatizada e pelo emulador de dispositivo do DevTools**, e
só apareceu quando alguém abriu o site num celular de verdade.

O motivo é que a suíte inteira roda em Chrome de desktop, com GPU de desktop.
Emular viewport e user-agent não emula GPU: `highp`, limite de memória de
textura e a barra de URL que dispara `resize` a cada scroll não existem ali.
Nenhum teste headless razoável cobre isso.

Fica a régua: **animação que depende de GPU precisa de um olho em aparelho
real**, ou de um caminho de desistência tão bom que o pior caso não importe. O
commit 11 fez as duas coisas — mas a primeira falha só foi notada porque o
cliente abriu no celular dele, não porque a verificação avisou.

---

## Decisões de arquitetura

**Sem framework, sem build.** Avaliamos React: não resolve nenhum dos problemas
reais (peso, SEO, formulário quebrado) e custaria reescrever tudo. Tailwind via
CDN também foi descartado — a build de CDN não é para produção e manda ~400KB de
JIT para o browser.

**As 10 páginas foram geradas de um shell único**, executado uma vez. A saída
são `.html` normais, sem build em produção. O objetivo era garantir blocos
repetidos idênticos: foi a divergência entre cópias manuais que deixou **dois
telefones diferentes** espalhados pelo site.

**O formulário não depende de servidor.** Vai direto para o WhatsApp, com o
backend preservado atrás de uma flag.

---

## Pendências

### Precisam de informação da agência

- [ ] **Confirmar duas frases da nova copy de Serviços.** Ambas em `index.html`
      e `service.html`, e ambas inferidas — não vieram da agência:
      1. *"De resort em Cancún a hotel em Londres"* — o blog confirma que
         levaram gente aos dois destinos, mas **não** diz o tipo de hospedagem.
         O "resort" e o "hotel" são suposição.
      2. *"a mesma pessoa que montou o roteiro está no aeroporto com você"*
         (card Excursões) — deduzido do cargo do Thiago, "Guia e consultor de
         viagens". Se as excursões usam guia terceirizado, ou se há mais de um
         guia, a frase é falsa.

      A terceira afirmação nova — *"cliente no terceiro ano consecutivo"* — é
      citação direta do depoimento real da Andreia e está sólida.
- [ ] **Confirmar se a foto de família é mesmo a foto do card do guia.** O card
      diz "Thiago Ribeiro — Guia e consultor de viagens", mas a imagem mostra
      quatro pessoas. Se a intenção era só ele, o certo é recortar a foto.
- [ ] **Dados reais dos pacotes** (nome, duração, preço). Hoje os cards são uma
      vitrine visual que leva ao orçamento, sem metadado nenhum — porque o site
      original também não tem. Com os dados reais, viram cards de produto.
- [ ] **Métricas para a barra de confiança**, se houver (anos de atuação, nº de
      clientes). Hoje são quatro afirmações sem número.

### Decisões suas

- [x] ~~**Publicar.**~~ Feito. A `main` é o que está no ar, e a Vercel publica a
      cada push. Sem etapa de preview no meio — vale saber que **um push errado
      vai direto para produção**.
- [ ] **Apagar arquivos órfãos.** `js/main.js`, `css/style.css`, `lib/` e
      `scss/` não são referenciados por nenhuma página — ~800KB de peso morto.
      Não apaguei por conta própria.
- [ ] **Depoimentos no menu principal?** Hoje o menu tem 7 itens e Guias e
      Depoimentos ficaram no rodapé.
- [ ] **Auditoria antigo × novo, seção por seção.** Removi coisas por decisão de
      design sem avisar em três ocasiões (depoimentos, carrossel do hero,
      enquadramento da imagem) e você teve que perguntar. Vale uma comparação
      sistemática para achar o que ninguém notou ainda.
- [ ] **`single.html`.** Removida. Se o blog ganhar post individual, precisa
      voltar com conteúdo real.

### Técnicas, sem urgência

- [ ] **Converter `img/thiago-guia.jpeg` para webp.** Está com **152 KB**; a
      foto que ela substituiu tinha 25 KB. São 6× mais peso num card com
      `loading="lazy"`. **Já existe método pronto para isso** — o mesmo usado no
      `ceu-floresta` (encoder do Chromium via Playwright, descrito em "Onde
      paramos"). Depois é só trocar a extensão nas 3 referências
      (`about.html`, `guide.html`, `blog.html`). Ficou pendente só porque não
      foi pedido junto.
- [ ] **Manutenção do HTML repetido.** Cabeçalho e rodapé voltaram a estar
      duplicados em 9 arquivos — o gerador rodou uma vez e não está no repo.
      Trocar um item de menu hoje = editar 9 arquivos. Duas saídas: versionar o
      gerador em `tools/`, ou migrar para Astro (que resolve isso de vez e
      abriria espaço para Tailwind).
- [ ] **Scripts de verificação não estão versionados.** Rodam em pasta
      temporária e se perdem. Valeria versionar em `tools/` também.
- [ ] **Registro de leads por e-mail.** Como o site está na Vercel, seria uma
      Vercel Function no mesmo projeto — sem Render e sem cold start. Só faz
      sentido se quiserem histórico além do WhatsApp.
- [ ] **A home depende de 4 CDNs** (GSAP, ScrollTrigger, Lenis, SplitType). Se
      a `gsap` não responder, a home inteira perde o movimento — as outras 8
      páginas não dependem de rede para nada. Baixar para `js/lib/` resolveria,
      ao custo de manter as versões à mão.
- [ ] **A verificação não cobre a home nova.** As suítes de Puppeteer e
      Playwright são anteriores ao `5d3cc1b` e não sabem do scroll horizontal,
      do shader nem do Lenis. E, como registrado acima, teste headless não pega
      falha de GPU de qualquer jeito.
- [ ] **Documentar os seis commits sem registro** listados em "Onde paramos",
      enquanto alguém ainda lembra do porquê.

---

## Como verificar

Servidor local — use o `serve.py` do repo, não o `http.server` puro:

```bash
python serve.py            # porta 5599
```

Ele é um `http.server` que manda `no-store` em tudo. Sem isso o Chrome guarda o
`experiencia.js` em cache e você fica olhando para um bug já corrigido — que é
exatamente o tipo de perda de tempo que o commit 11 rendeu.

A verificação foi feita com Puppeteer, cobrindo:

| Suíte | O que checa |
|---|---|
| Páginas | erro de console, 404, `alt` faltando, preloader, peso |
| Links | links internos quebrados, âncoras mortas, telefone/e-mail únicos |
| Formulário | validação, payload, mensagem gerada, botão reabilitando (54 casos) |
| Carrosséis | autoplay, loop, bolinhas, clicabilidade, integridade dos textos |
| Contraste | razão WCAG em cada ponto de texto |

Estado na última execução: **todas passando.**

> ⚠️ **Essa execução é anterior ao `5d3cc1b`.** As suítes não conhecem a home
> nova — scroll horizontal, Lenis e shader não são exercitados por nenhuma
> delas, e não foram rodadas de novo desde então. Tratar o "todas passando"
> como válido para as 8 páginas internas, não para a home.

As animações (o lote que entrou em `70e7351`) foram verificadas com Playwright, não com
Puppeteer — o Puppeteer não tem emulação de `prefers-reduced-motion`. Quatro
cenários, todos passando:

| Cenário | Resultado |
|---|---|
| 9 páginas, rolagem até o fim | 0 elementos presos invisíveis, 0 erros de console |
| `prefers-reduced-motion: reduce` | 0 elementos animados |
| `revelar.js` bloqueado no carregamento | 6/6 cards visíveis — nada some |
| Carrossel | 0 elementos marcados dentro dele, bolinhas intactas |

E, para a fusão dos campos do formulário:

| Cenário | Resultado |
|---|---|
| Estrutura nas 9 páginas | 4 campos, sem `#destination`, 0 erros de console |
| Envio ponta a ponta | mensagem do WhatsApp sem campo duplicado (`*Viagem:*`) |
| Validação do campo novo | mensagem correta e **botão não trava** |
| Contraste do card branco sobre a faixa nova | overrides do `8e063f1` intactos |

O teste do botão travado existe porque esse bug já aconteceu neste projeto
(commit `d4bff8b`). Vale manter em qualquer mexida futura no formulário.

O terceiro cenário é o que importa preservar: ele prova que uma falha do script
não esconde conteúdo. Se alguém reescrever o reveal no futuro, esse teste é o
que impede a regressão.

> Nota: esses scripts também rodaram em pasta temporária e **não foram
> versionados** — mesma pendência já registrada acima.

> Nota: os testes de formulário rodam com a rede interceptada — nenhum e-mail é
> enviado para a agência durante a verificação. O envio real de ponta a ponta
> nunca foi exercitado.
