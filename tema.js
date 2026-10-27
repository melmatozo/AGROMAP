/* ==========================================
   AGROMAP — TEMA (claro / escuro)
   Carregado no <head> de todas as páginas, antes do conteúdo aparecer,
   para não "piscar" branco quando o tema escuro está salvo.
   A escolha fica salva no navegador (chave "agromapTema": "dark" ou "light").
========================================== */
(function () {
  "use strict";

  var CHAVE = "agromapTema";
  var CLASSE = "tema-escuro";
  var ROOT = document.documentElement;
  var COR_BARRA = { dark: "#0b1c12", light: null };

  function lerSalvo() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }

  function escuroAtivo() {
    return ROOT.classList.contains(CLASSE);
  }

  // cor da barra do navegador (celular) acompanha o tema
  function corDaBarra(escuro) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    if (!meta.hasAttribute("data-original")) meta.setAttribute("data-original", meta.getAttribute("content") || "");
    meta.setAttribute("content", escuro ? COR_BARRA.dark : meta.getAttribute("data-original"));
  }

  function aplicar(escuro) {
    ROOT.classList.toggle(CLASSE, !!escuro);
    if (document.head) corDaBarra(!!escuro);
  }

  function definir(escuro) {
    aplicar(escuro);
    try { localStorage.setItem(CHAVE, escuro ? "dark" : "light"); } catch (e) { /* ignora */ }
    document.dispatchEvent(new CustomEvent("agromap:tema", { detail: { escuro: !!escuro } }));
  }

  // aplica já: só usa o tema escuro se a pessoa escolheu (ou se o aparelho pede e nada foi salvo)
  var salvo = lerSalvo();
  var escuroInicial = salvo === "dark" ||
    (salvo === null && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  aplicar(escuroInicial);

  // a <meta theme-color> ainda pode não existir neste ponto: ajusta quando a página carregar
  document.addEventListener("DOMContentLoaded", function () { corDaBarra(escuroAtivo()); });

  // outras partes do site (painel de acessibilidade) usam isto
  window.agromapTema = {
    escuro: escuroAtivo,
    definir: definir,
    alternar: function () { definir(!escuroAtivo()); }
  };
})();
