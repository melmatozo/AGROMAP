
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const currentYear = document.getElementById("currentYear");

  // Atualizar o ano do rodapé automaticamente
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Abrir e fechar o menu para celulares
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      const aberto = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(aberto));
      menuToggle.setAttribute(
        "aria-label",
        aberto ? "Fechar menu" : "Abrir menu"
      );

      menuToggle.textContent = aberto ? "×" : "☰";
    });

    // Fechar o menu quando uma opção for selecionada
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
        menuToggle.textContent = "☰";
      });
    });

    // Fechar o menu ao voltar para o layout de computador
    window.addEventListener("resize", function () {
      if (window.innerWidth > 780) {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
        menuToggle.textContent = "☰";
      }
    });
  }

  // Rolagem suave para as seções da página
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const destino = link.getAttribute("href");

      if (!destino || destino === "#") {
        return;
      }

      const secao = document.querySelector(destino);

      if (secao) {
        event.preventDefault();

        const movimentoReduzido = window.agromapSemMovimento
          ? window.agromapSemMovimento()
          : window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        secao.scrollIntoView({
          behavior: movimentoReduzido ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });

  // Tentar outra foto caso uma imagem dos cartões não carregue
  const fotosAlternativas = [
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
  ];

  document.querySelectorAll(
    ".feature-card img, .about-image img"
  ).forEach(function (imagem, indice) {
    imagem.addEventListener("error", function () {
      if (imagem.dataset.tentouAlternativa === "sim") {
        imagem.style.visibility = "hidden";
        return;
      }

      imagem.dataset.tentouAlternativa = "sim";
      imagem.src = fotosAlternativas[indice % fotosAlternativas.length];
    });
  });
});
