/**
 * Envio dos formulários de lead (home, contato e preview).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ MODO DE ENVIO — mude só a constante MODO abaixo.                     │
 * │                                                                      │
 * │   "whatsapp"  (atual) monta uma mensagem com o que a pessoa digitou  │
 * │               e abre o WhatsApp da agência já preenchido.            │
 * │   "backend"   volta a enviar por e-mail via API.                     │
 * │                                                                      │
 * │ O caminho do backend continua inteiro e testado logo abaixo: trocar  │
 * │ a constante é tudo o que precisa para religá-lo.                     │
 * │                                                                      │
 * │ Por que está em "whatsapp": a API roda em plano gratuito que hiberna │
 * │ e leva ~30s para acordar no primeiro envio do dia. Pelo WhatsApp a   │
 * │ conversa começa na hora, e o lead não depende de servidor no ar.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
(function () {
  "use strict";

  var MODO = "whatsapp"; // "whatsapp" | "backend"

  // Número que recebe os leads, no formato internacional, só dígitos.
  var WHATSAPP_NUMERO = "5511976732628"; // (11) 97673-2628
  var WHATSAPP_LINK = "https://contate.me/travelbuenavista";

  var ENDPOINT = "https://tbv-backend.onrender.com/send-email/";
  var AVISO_DEMORA_MS = 6000;
  var TIMEOUT_MS = 45000;

  var CAMPOS = [
    { id: "nome", rotulo: "Nome", label: "seu nome" },
    { id: "email", rotulo: "E-mail", label: "seu e-mail", email: true },
    { id: "zap", rotulo: "WhatsApp", label: "seu WhatsApp" },
    { id: "destination", rotulo: "Destino de interesse", label: "o destino de interesse" },
    { id: "quest", rotulo: "Mensagem", label: "sua mensagem" }
  ];

  /* ---------------------------------------------------------------- modal */

  function getModal() {
    var modal = document.getElementById("loadingModal");
    if (modal) return modal;

    // contact.html não tem a marcação do modal; criamos sob demanda para não
    // duplicar o HTML em várias páginas.
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

  /* ----------------------------------------------------------- validação */

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

  /* ------------------------------------------------------ modo: whatsapp */

  // O WhatsApp entende *asteriscos* como negrito.
  function montarMensagem(dados) {
    var linhas = ["Olá! Vim pelo site da TravelBuenaVista 👋", ""];

    CAMPOS.forEach(function (campo) {
      var valor = dados[campo.id];
      if (valor) linhas.push("*" + campo.rotulo + ":* " + valor);
    });

    return linhas.join("\n");
  }

  function enviarPeloWhatsapp(form, dados, modal, restaurar) {
    var url =
      "https://wa.me/" +
      WHATSAPP_NUMERO +
      "?text=" +
      encodeURIComponent(montarMensagem(dados));

    // Abrir na mesma ação do clique evita bloqueio de pop-up.
    var aba = window.open(url, "_blank", "noopener");

    if (aba) {
      modal.mostrar(
        "success-icon",
        "&#10004;",
        "Abrindo o WhatsApp...",
        'Sua mensagem já vai preenchida. Se a aba não abrir, ' +
          '<a href="' + url + '" target="_blank" rel="noopener">toque aqui</a>.'
      );
      form.reset();
      setTimeout(modal.esconder, 5000);
    } else {
      // Pop-up bloqueado: não perdemos o lead, damos o link para clicar.
      modal.mostrar(
        "error-icon",
        "&#10006;",
        "Seu navegador bloqueou a janela",
        '<a href="' + url + '" target="_blank" rel="noopener">Toque aqui para abrir o WhatsApp</a> ' +
          "com sua mensagem pronta."
      );
    }

    restaurar();
  }

  /* ------------------------------------------------------- modo: backend */

  function enviarPeloBackend(form, dados, modal, restaurar) {
    modal.mostrar("loader-circle", "", "Enviando...", "Estamos registrando sua solicitação.");

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
      body: JSON.stringify(dados),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        // O código antigo não checava isso: um 500 caía no .then e o usuário
        // via "Sucesso!" com o e-mail nunca entregue.
        if (!response.ok) throw new Error("HTTP " + response.status);
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
        console.error("Falha ao enviar formulário:", erro);
        modal.mostrar(
          "error-icon",
          "&#10006;",
          "Não conseguimos enviar",
          'Tente novamente ou fale direto no <a href="' +
            WHATSAPP_LINK +
            '" target="_blank" rel="noopener">WhatsApp</a>.'
        );
        // Sem auto-hide no erro: o usuário precisa ver o link do WhatsApp.
      })
      .finally(function () {
        clearTimeout(avisoDemora);
        clearTimeout(expirou);
        restaurar();
      });
  }

  /* ------------------------------------------------------------- ligação */

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var modal = Modal();
      var botao = form.querySelector('[type="submit"]');
      var textoOriginal = botao ? botao.innerHTML : null;

      limparErros(form);

      // Valida ANTES de desabilitar o botão. Fazer o contrário deixava o
      // botão travado para sempre quando um campo estava faltando.
      var resultado = coletar(form);
      if (resultado.erro) {
        marcarErro(resultado.erro.el, resultado.erro.msg);
        return;
      }

      function restaurar() {
        if (!botao) return;
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
      }

      if (botao) {
        botao.disabled = true;
        botao.innerHTML = "Enviando...";
      }

      if (MODO === "whatsapp") {
        enviarPeloWhatsapp(form, resultado.dados, modal, restaurar);
      } else {
        enviarPeloBackend(form, resultado.dados, modal, restaurar);
      }
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
