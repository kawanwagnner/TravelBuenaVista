/**
 * Carrossel genérico: autoplay, loop e bolinhas de navegação.
 *
 * Substitui o owl.carousel + jQuery (~250KB) do site antigo. O deslize é
 * scroll-snap nativo do CSS, então arrastar no touch, roda do mouse e
 * navegação por teclado funcionam sem código nenhum aqui.
 *
 * Uso no HTML:
 *
 *   <div class="quotes" data-carrossel data-dots="quotesDots"> ...itens... </div>
 *   <div class="quotes-dots" id="quotesDots"></div>
 *
 * data-intervalo (ms) é opcional; o padrão é 5000. Qualquer elemento com
 * [data-carrossel] é inicializado sozinho.
 */
(function () {
  "use strict";

  function iniciar(trilho) {
    var dots = document.getElementById(trilho.dataset.dots);
    if (!dots) return;

    var INTERVALO = Number(trilho.dataset.intervalo) || 5000;
    var timer = null;
    var paginas = 1;
    var semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A última página costuma ser parcial (ex.: 4 cards, 3 por vez), então
    // rolar de largura em largura estoura o fim e trava. Distribuímos as
    // páginas sobre o scroll realmente disponível.
    function maxScroll() {
      return trilho.scrollWidth - trilho.clientWidth;
    }
    function totalPaginas() {
      return Math.max(1, Math.ceil(trilho.scrollWidth / trilho.clientWidth - 0.02));
    }
    function paginaAtual() {
      var max = maxScroll();
      if (max <= 0) return 0;
      return Math.round((trilho.scrollLeft / max) * (paginas - 1));
    }
    function irPara(i, suave) {
      var destino = paginas > 1 ? (i / (paginas - 1)) * maxScroll() : 0;
      trilho.scrollTo({
        left: destino,
        behavior: suave && !semAnimacao ? "smooth" : "auto"
      });
    }

    function marcar() {
      var atual = paginaAtual();
      Array.prototype.forEach.call(dots.children, function (b, i) {
        b.setAttribute("aria-current", i === atual ? "true" : "false");
      });
    }

    function montarDots() {
      paginas = totalPaginas();
      dots.innerHTML = "";
      for (var i = 0; i < paginas; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Ir para o slide " + (i + 1));
        b.dataset.i = i;
        dots.appendChild(b);
      }
      // Uma bolinha só não navega nada: melhor não exibir.
      dots.hidden = paginas < 2;
      marcar();
    }

    function avancar() {
      var proxima = paginaAtual() + 1;
      irPara(proxima >= paginas ? 0 : proxima, true); // loop
    }
    function tocar() {
      if (semAnimacao || timer || paginas < 2) return;
      timer = setInterval(avancar, INTERVALO);
    }
    function pausar() {
      clearInterval(timer);
      timer = null;
    }

    dots.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) irPara(Number(b.dataset.i), true);
    });

    // Não roda sozinho enquanto a pessoa está lendo ou interagindo...
    ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach(function (ev) {
      trilho.addEventListener(ev, pausar, { passive: true });
    });
    ["mouseleave", "focusout"].forEach(function (ev) {
      trilho.addEventListener(ev, tocar, { passive: true });
    });
    // ...nem com a aba em segundo plano.
    document.addEventListener("visibilitychange", function () {
      document.hidden ? pausar() : tocar();
    });

    trilho.addEventListener("scroll", marcar, { passive: true });
    window.addEventListener("resize", function () {
      montarDots();
      irPara(paginaAtual(), false);
    });

    montarDots();
    tocar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-carrossel]"), iniciar);
  });
})();
