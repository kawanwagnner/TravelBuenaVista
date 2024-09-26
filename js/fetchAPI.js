document
  .getElementById("contactForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const zap = document.getElementById("zap").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const quest = document.getElementById("quest").value.trim();
    const loadingModal = document.getElementById("loadingModal");
    const loaderIcon = document.getElementById("loaderIcon");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");

    // Função para exibir o modal com o loader padrão
    function showLoadingModal() {
      modalTitle.innerText = "Enviando...";
      modalMessage.innerText =
        "Por favor, aguarde enquanto processamos sua inscrição.";
      loaderIcon.className = "loader-circle"; // Define o loader padrão (círculo girando)
      loaderIcon.innerHTML = ""; // Limpa qualquer ícone anterior
      loadingModal.style.display = "flex"; // Exibe o modal
    }

    // Função para atualizar o modal com sucesso
    function showSuccessModal() {
      modalTitle.innerText = "Sucesso!";
      modalMessage.innerText = "E-mail enviado com sucesso.";
      loaderIcon.className = "success-icon"; // Define o ícone de sucesso
      loaderIcon.innerHTML = "✔"; // Adiciona o ícone de sucesso
    }

    // Função para atualizar o modal com erro
    function showErrorModal() {
      modalTitle.innerText = "Erro!";
      modalMessage.innerText = "Ocorreu um erro ao enviar o e-mail.";
      loaderIcon.className = "error-icon"; // Define o ícone de erro
      loaderIcon.innerHTML = "✖"; // Adiciona o ícone de erro
    }

    // Função para esconder o modal
    function hideModal() {
      loadingModal.style.display = "none"; // Oculta o modal
    }

    // Validação do formulário
    function validateForm() {
      if (!nome) {
        showErrorModal("Erro", "Por favor, insira seu nome.");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showErrorModal("Erro", "Por favor, insira um e-mail válido.");
        return false;
      }

      if (!zap) {
        showErrorModal("Erro", "Por favor, insira seu WhatsApp.");
        return false;
      }

      if (!destination) {
        showErrorModal("Erro", "Por favor, insira o destino.");
        return false;
      }

      if (!quest) {
        showErrorModal(
          "Erro",
          "Por favor, insira a plataforma (por exemplo, Instagram)."
        );
        return false;
      }

      return true;
    }

    // Executa a validação do formulário
    if (!validateForm()) {
      return;
    }

    // Exibe o modal com mensagem de carregamento
    showLoadingModal();

    // Dados do formulário
    const formData = {
      nome,
      email,
      zap,
      destination,
      quest,
    };

    // Simula um atraso para o carregamento (exemplo de 2 segundos)
    setTimeout(() => {
      // Envia os dados para o servidor
      fetch("http://localhost:3000/send-email/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.text())
        .then((data) => {
          console.log(data);
          // Atualiza o modal com ícone de sucesso
          showSuccessModal();
          document.getElementById("contactForm").reset(); // Reseta o formulário
        })
        .catch((error) => {
          console.error("Error:", error);
          // Atualiza o modal com ícone de erro
          showErrorModal();
        })
        .finally(() => {
          // Oculta o modal após 3 segundos
          setTimeout(hideModal, 3000);
        });
    }, 2000);
  });
