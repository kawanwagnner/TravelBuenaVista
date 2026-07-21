# Backup do index original

`index-original.html` é a home que estava no ar antes de aplicarmos o
redesign imersivo (awwwards-kit). Guardado em 2026-07-21 02:08.

## Como reverter
Copie o arquivo de volta para a raiz:

```
Copy-Item _backup\index-original.html index.html -Force
```

Depois disso, a home volta a usar `js/carrossel.js` e `js/revelar.js`
e o carrossel do hero. Nenhum outro arquivo do site foi alterado —
`about.html`, `service.html`, `contact.html` etc. seguem intactos.

## O que foi PRESERVADO no index novo
- `<head>` completo: title, description, canonical, Open Graph, Twitter,
  theme-color e o **JSON-LD** (schema TravelAgency)
- O **formulário de orçamento** (`#contactForm`) e o modal de retorno
- O `<footer class="site-footer">` inteiro e o botão flutuante do WhatsApp
- `js/form.js`

## O que saiu
- `js/carrossel.js` — não há mais carrossel no hero (virou shader WebGL)
- `js/revelar.js` — os reveals passaram para `js/experiencia.js`
- O script inline do menu — `experiencia.js` já cuida disso
