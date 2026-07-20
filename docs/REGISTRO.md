# TravelBuenaVista — registro do trabalho

Documento de acompanhamento da reforma do site. Última atualização: 20/07/2026.

---

## Onde paramos

Toda a reforma está na branch **`melhorias-2026`**, com 10 commits.
**Nada foi publicado** — o que está no ar em <https://travel-buena-vista.vercel.app/>
ainda é a versão antiga.

Falta decidir: publicar (via preview da Vercel primeiro) e resolver as
pendências listadas no fim deste documento.

```
141 arquivos alterados · 3.657 linhas adicionadas · 7.762 removidas
```

---

## O site hoje (na branch)

**9 páginas:** `index`, `about`, `service`, `package`, `destination`,
`guide`, `blog`, `testimonial`, `contact`.

**Front-end sem framework.** Bootstrap, jQuery, owl.carousel e easing foram
removidos. O que roda é:

| Arquivo | O que faz |
|---|---|
| `css/redesign.css` | Design system inteiro (~15KB) |
| `js/carrossel.js` | Carrossel genérico (hero + depoimentos) |
| `js/form.js` | Formulário de lead |
| inline (~15 linhas) | Menu mobile |

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

- [ ] **Dados reais dos pacotes** (nome, duração, preço). Hoje os cards são uma
      vitrine visual que leva ao orçamento, sem metadado nenhum — porque o site
      original também não tem. Com os dados reais, viram cards de produto.
- [ ] **Métricas para a barra de confiança**, se houver (anos de atuação, nº de
      clientes). Hoje são quatro afirmações sem número.

### Decisões suas

- [ ] **Publicar.** Sugestão: subir a branch para a Vercel gerar uma URL de
      preview, testar no celular, mandar para o cliente, e só então promover
      para produção.
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

---

## Como verificar

Servidor local:

```bash
python -m http.server 8899 --bind 127.0.0.1
```

A verificação foi feita com Puppeteer, cobrindo:

| Suíte | O que checa |
|---|---|
| Páginas | erro de console, 404, `alt` faltando, preloader, peso |
| Links | links internos quebrados, âncoras mortas, telefone/e-mail únicos |
| Formulário | validação, payload, mensagem gerada, botão reabilitando (54 casos) |
| Carrosséis | autoplay, loop, bolinhas, clicabilidade, integridade dos textos |
| Contraste | razão WCAG em cada ponto de texto |

Estado na última execução: **todas passando.**

> Nota: os testes de formulário rodam com a rede interceptada — nenhum e-mail é
> enviado para a agência durante a verificação. O envio real de ponta a ponta
> nunca foi exercitado.
