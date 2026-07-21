/**
 * Revelação ao rolar: os blocos sobem e aparecem quando entram na tela.
 *
 * A classe .revelar é aplicada AQUI, nunca no HTML. Assim, se este arquivo
 * falhar ou o JS estiver desligado, nada fica escondido — a página só perde
 * a animação. Esconder conteúdo por CSS e depender do JS para mostrar é o
 * jeito mais comum de fazer isso, e também o jeito de sumir com a página
 * inteira quando um script quebra.
 *
 * Cada elemento é revelado uma vez só e o observer o solta em seguida: sem
 * animação de novo ao rolar para cima, sem trabalho acumulado.
 */
(function () {
  "use strict";

  // Blocos que ganham a entrada. Cartões e itens de grade escalonam entre si.
  var ALVOS = [
    ".section-head",
    ".card",
    ".dest",
    ".post",
    ".person",
    ".pack",
    ".trust-item",
    ".form-card",
    ".cta .wrap"
  ].join(",");

  // Áreas onde a animação atrapalha: cabeçalho/rodapé fixos, primeira dobra
  // e qualquer coisa dentro de um carrossel — ali os itens já entram e saem
  // da tela na horizontal, e piscariam a cada passagem.
  var FORA = [
    "[data-carrossel]",
    ".topbar",
    ".site-header",
    ".site-footer",
    ".hero-shell",
    ".page-hero"
  ].join(",");

  var ATRASO = 90;   // ms entre um irmão e o próximo
  var MAX_ATRASO = 4; // além disso o último card da fileira demora demais

  function revelavel(el) {
    if (el.closest(FORA)) return false;
    // Alvo dentro de outro alvo (o .form-card dentro do .cta .wrap, por
    // exemplo) animaria duas vezes, uma por cima da outra. Quem manda é o
    // bloco de fora.
    return !(el.parentElement && el.parentElement.closest(ALVOS));
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Quem pediu menos movimento no sistema não recebe nada disso.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var alvos = Array.prototype.filter.call(
      document.querySelectorAll(ALVOS),
      revelavel
    );
    if (!alvos.length) return;

    // Sem IntersectionObserver (navegador antigo), a página fica como está.
    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("revelado");
          observer.unobserve(entrada.target); // uma vez basta
        });
      },
      // Começa um pouco antes de encostar na borda de baixo, senão o bloco
      // só anima depois de já estar visível.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    alvos.forEach(function (el) {
      el.classList.add("revelar");

      // Escalonamento: a posição entre os irmãos que também vão animar.
      var irmaos = Array.prototype.filter.call(
        el.parentElement ? el.parentElement.children : [],
        function (n) { return n.matches(ALVOS) && revelavel(n); }
      );
      var i = Math.min(irmaos.indexOf(el), MAX_ATRASO);
      if (i > 0) el.style.setProperty("--revelar-atraso", i * ATRASO + "ms");

      observer.observe(el);
    });
  });
})();
