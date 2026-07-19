/**
 * Envio dos formulários de lead (home e contato).
 *
 * Substitui o antigo fetchAPI.js. Diferenças que importam:
 *  - sem atraso artificial antes do fetch;
 *  - checa response.ok (antes, um erro 500 exibia "Sucesso!");
 *  - erro de validação aponta o campo, em vez de sumir em 3 segundos;
 *  - se o envio falhar, oferece o WhatsApp para o lead não se perder.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://tbv-backend.onrender.com/send-email/";
  var WHATSAPP = "https://contate.me/travelbuenavista";

  // O backend hiberna (plano free) e pode levar ~30s para acordar no primeiro
  // envio do dia. Avisamos o usuário em vez de deixar a tela parada.
  var AVISO_DEMORA_MS = 6000;
  var TIMEOUT_MS = 45000;

  var CAMPOS = [
    { id: "nome", label: "seu nome" },
    { id: "email", label: "seu e-mail", email: true },
    { id: "zap", label: "seu WhatsApp" },
    { id: "destination", label: "o destino de interesse" },
    { id: "quest", label: "sua mensagem" }
  ];

  function getModal() {
    var modal = document.getElementById("loadingModal");
    if (modal) return modal;

    // contact.html não tem a marcação do modal; criamos sob demanda para não
    // duplicar o HTML em duas páginas.
    modal = document.createElement("div");
    modal.id = "loadingModal";
    modal.className = "loading-modal";
    modal.style.display = "none";
    modal.innerHTML =
      '<div class="loading-modal-content">' +
      '<div id="loaderIcon" class="loader-circle"></div>' +
      '<h2 id="modalTitle"></h2>' +
      '<p id="modalMessage"></p>' +
      "</div>";
    document.body.appendChild(modal);
    return modal;
  }

  function Modal() {
    var raiz = getModal();
    return {
      mostrar: function (classe, icone, titulo, msg) {
        raiz.querySelector("#loaderIcon").className = classe;
        raiz.querySelector("#loaderIcon").innerHTML = icone;
        raiz.querySelector("#modalTitle").innerText = titulo;
        raiz.querySelector("#modalMessage").innerHTML = msg;
        raiz.style.display = "flex";
      },
      esconder: function () {
        raiz.style.display = "none";
      }
    };
  }

  function marcarErro(campo, mensagem) {
    campo.classList.add("is-invalid");
    var aviso = campo.parentNode.querySelector(".help-block");
    if (aviso) aviso.innerText = mensagem;
    campo.focus();
  }

  function limparErros(form) {
    Array.prototype.forEach.call(form.querySelectorAll(".is-invalid"), function (el) {
      el.classList.remove("is-invalid");
    });
    Array.prototype.forEach.call(form.querySelectorAll(".help-block"), function (el) {
      el.innerText = "";
    });
  }

  function coletar(form) {
    var dados = {};
    var erro = null;

    CAMPOS.forEach(function (campo) {
      if (erro) return;
      var el = form.querySelector("#" + campo.id);
      if (!el) return;

      var valor = el.value.trim();
      if (!valor) {
        erro = { el: el, msg: "Por favor, informe " + campo.label + "." };
        return;
      }
      if (campo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        erro = { el: el, msg: "Esse e-mail parece incompleto." };
        return;
      }
      dados[campo.id] = valor;
    });

    return { dados: dados, erro: erro };
  }

  function enviar(form) {
    var modal = Modal();
    var botao = form.querySelector('[type="submit"]');
    var textoOriginal = botao ? botao.innerHTML : null;

    limparErros(form);
    var resultado = coletar(form);

    if (resultado.erro) {
      marcarErro(resultado.erro.el, resultado.erro.msg);
      return;
    }

    if (botao) {
      botao.disabled = true;
      botao.innerHTML = "Enviando...";
    }

    modal.mostrar(
      "loader-circle",
      "",
      "Enviando...",
      "Estamos registrando sua solicitação."
    );

    var avisoDemora = setTimeout(function () {
      var texto = document.getElementById("modalMessage");
      if (texto) {
        texto.innerText = "Quase lá — o servidor está acordando. Só mais um instante.";
      }
    }, AVISO_DEMORA_MS);

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var expirou = setTimeout(function () {
      if (controller) controller.abort();
    }, TIMEOUT_MS);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultado.dados),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        // O código antigo não checava isso: um 500 caía no .then e o usuário
        // via "Sucesso!" com o e-mail nunca entregue.
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.text();
      })
      .then(function () {
        modal.mostrar(
          "success-icon",
          "&#10004;",
          "Recebemos seu contato!",
          "Em breve nossa equipe fala com você."
        );
        form.reset();
        setTimeout(modal.esconder, 4000);
      })
      .catch(function (erro) {
        console.error("Falha ao enviar formulario:", erro);
        modal.mostrar(
          "error-icon",
          "&#10006;",
          "Não conseguimos enviar",
          'Tente novamente ou fale direto no <a href="' +
            WHATSAPP +
            '" target="_blank" rel="noopener">WhatsApp</a>.'
        );
        // Sem auto-hide no erro: o usuario precisa ver o link do WhatsApp.
      })
      .finally(function () {
        clearTimeout(avisoDemora);
        clearTimeout(expirou);
        if (botao) {
          botao.disabled = false;
          botao.innerHTML = textoOriginal;
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      enviar(form);
    });

    // Fecha o modal ao clicar fora dele.
    var modal = document.getElementById("loadingModal");
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) modal.style.display = "none";
      });
    }
  });
})();
