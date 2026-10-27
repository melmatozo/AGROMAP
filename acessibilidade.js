/* ==========================================
   AGROMAP — ACESSIBILIDADE
   Painel de configurações (tamanho do texto, alto contraste,
   fonte, espaçamento, menos animações e destaque de links).
   As escolhas ficam salvas no navegador e valem para todas as páginas.
========================================== */
(function () {
  "use strict";

  var CHAVE = "agromapAcessibilidade";
  var ROOT = document.documentElement;

  // Escala do texto (em % do tamanho padrão do navegador)
  var NIVEIS_TEXTO = [85, 100, 115, 130, 150, 175, 200];

  var PADRAO = {
    texto: 100,       // tamanho do texto
    contraste: false, // alto contraste
    fonte: "padrao",  // padrao | atkinson | dyslexic
    espaco: 0,        // 0 | 1 | 2
    semMovimento: false,
    links: false
  };

  var FONTES_EXTERNAS = {
    atkinson: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap",
    dyslexic: "https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic/index.css"
  };

  /* ---------- armazenamento (com proteção contra bloqueio) ---------- */

  function ler() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) return Object.assign({}, PADRAO);
      return Object.assign({}, PADRAO, JSON.parse(bruto));
    } catch (e) {
      return Object.assign({}, PADRAO);
    }
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (e) { /* ignora */ }
  }

  var cfg = ler();

  /* ---------- aplicar no site ---------- */

  function carregarFonte(nome) {
    var url = FONTES_EXTERNAS[nome];
    if (!url || document.getElementById("a11y-font-" + nome)) return;
    var link = document.createElement("link");
    link.id = "a11y-font-" + nome;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  function aplicar() {
    ROOT.style.fontSize = cfg.texto + "%";

    ROOT.classList.toggle("a11y-contrast", !!cfg.contraste);
    ROOT.classList.toggle("a11y-no-motion", !!cfg.semMovimento);
    ROOT.classList.toggle("a11y-links", !!cfg.links);

    ROOT.classList.remove("a11y-font-atkinson", "a11y-font-dyslexic");
    if (cfg.fonte === "atkinson" || cfg.fonte === "dyslexic") {
      carregarFonte(cfg.fonte);
      ROOT.classList.add("a11y-font-" + cfg.fonte);
    }

    ROOT.classList.remove("a11y-space-1", "a11y-space-2");
    if (cfg.espaco > 0) ROOT.classList.add("a11y-space-" + cfg.espaco);
  }

  // aplica já no <head>, antes de a página aparecer
  aplicar();

  /* ---------- interface ---------- */

  var painel, overlay, botao, ultimoFoco;

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html) n.innerHTML = html;
    return n;
  }

  function construir() {
    botao = el("button", {
      type: "button",
      "class": "a11y-fab",
      id: "a11yAbrir",
      "aria-label": "Abrir configurações de acessibilidade",
      "aria-haspopup": "dialog",
      "aria-controls": "a11yPainel",
      "aria-expanded": "false",
      title: "Acessibilidade"
    }, '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="1.8" fill="currentColor"/><path d="M5 8.6l7 .9 7-.9M12 9.5v5M12 14.5l-3.5 6M12 14.5l3.5 6"/></svg>');

    overlay = el("div", { "class": "a11y-overlay", id: "a11yFundo" });

    painel = el("aside", {
      "class": "a11y-panel",
      id: "a11yPainel",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "a11yTitulo",
      tabindex: "-1"
    });

    painel.innerHTML =
      '<div class="a11y-head">' +
        '<h2 id="a11yTitulo">Configurações de acessibilidade</h2>' +
        '<button type="button" class="a11y-close" id="a11yFechar" aria-label="Fechar configurações">×</button>' +
      '</div>' +
      '<div class="a11y-body">' +

        '<section class="a11y-group" aria-labelledby="g-tema">' +
          '<h3 id="g-tema">Tema escuro</h3>' +
          '<p>Fundo verde escuro com detalhes em amarelo, mais confortável em ambientes com pouca luz.</p>' +
          '<button type="button" class="a11y-switch" id="a11yTema" aria-pressed="false">' +
            '<span>Ativar tema escuro</span><span class="knob" aria-hidden="true"></span>' +
          '</button>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-texto">' +
          '<h3 id="g-texto">Tamanho do texto</h3>' +
          '<p>Aumenta ou diminui o texto do site todo.</p>' +
          '<div class="a11y-size">' +
            '<button type="button" class="a11y-btn a-minus" id="a11yMenos" aria-label="Diminuir o texto">A−</button>' +
            '<output id="a11yTextoValor" aria-live="polite"></output>' +
            '<button type="button" class="a11y-btn a-plus" id="a11yMais" aria-label="Aumentar o texto">A+</button>' +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-contraste">' +
          '<h3 id="g-contraste">Alto contraste</h3>' +
          '<p>Cores bem fortes (fundo preto, texto branco e links amarelos), para quem tem baixa visão.</p>' +
          '<button type="button" class="a11y-switch" data-chave="contraste" aria-pressed="false">' +
            '<span>Ativar alto contraste</span><span class="knob" aria-hidden="true"></span>' +
          '</button>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-fonte">' +
          '<h3 id="g-fonte">Fonte</h3>' +
          '<p>Escolha uma letra mais fácil de ler.</p>' +
          '<div class="a11y-options" role="radiogroup" aria-labelledby="g-fonte">' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="fonte" data-valor="padrao" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>Padrão do site</span></button>' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="fonte" data-valor="atkinson" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>Atkinson Hyperlegible<small>Pensada para baixa visão</small></span></button>' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="fonte" data-valor="dyslexic" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>OpenDyslexic<small>Pensada para dislexia</small></span></button>' +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-espaco">' +
          '<h3 id="g-espaco">Espaçamento</h3>' +
          '<p>Mais espaço entre letras, palavras e linhas.</p>' +
          '<div class="a11y-options" role="radiogroup" aria-labelledby="g-espaco">' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="espaco" data-valor="0" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>Normal</span></button>' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="espaco" data-valor="1" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>Médio</span></button>' +
            '<button type="button" class="a11y-option" role="radio" data-grupo="espaco" data-valor="2" aria-checked="false"><span class="dot" aria-hidden="true"></span><span>Grande</span></button>' +
          '</div>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-movimento">' +
          '<h3 id="g-movimento">Menos animações</h3>' +
          '<p>Desliga os efeitos de movimento (cards subindo, zoom nas imagens, rolagem suave).</p>' +
          '<button type="button" class="a11y-switch" data-chave="semMovimento" aria-pressed="false">' +
            '<span>Reduzir animações</span><span class="knob" aria-hidden="true"></span>' +
          '</button>' +
        '</section>' +

        '<section class="a11y-group" aria-labelledby="g-links">' +
          '<h3 id="g-links">Destacar links</h3>' +
          '<p>Sublinha todos os links e aumenta o cursor do mouse.</p>' +
          '<button type="button" class="a11y-switch" data-chave="links" aria-pressed="false">' +
            '<span>Destacar links e cursor</span><span class="knob" aria-hidden="true"></span>' +
          '</button>' +
        '</section>' +

        '<section class="a11y-group">' +
          '<button type="button" class="a11y-btn a11y-reset" id="a11yRestaurar">Restaurar configurações padrão</button>' +
        '</section>' +

      '</div>';

    document.body.appendChild(botao);
    document.body.appendChild(overlay);
    document.body.appendChild(painel);

    // eventos
    botao.addEventListener("click", abrir);
    overlay.addEventListener("click", fechar);
    document.getElementById("a11yFechar").addEventListener("click", fechar);

    document.getElementById("a11yMenos").addEventListener("click", function () { mudarTexto(-1); });
    document.getElementById("a11yMais").addEventListener("click", function () { mudarTexto(1); });

    painel.querySelectorAll(".a11y-switch[data-chave]").forEach(function (b) {
      b.addEventListener("click", function () {
        var chave = b.getAttribute("data-chave");
        cfg[chave] = !cfg[chave];
        atualizar();
      });
    });

    painel.querySelectorAll(".a11y-option").forEach(function (b) {
      b.addEventListener("click", function () {
        var grupo = b.getAttribute("data-grupo");
        var valor = b.getAttribute("data-valor");
        cfg[grupo] = grupo === "espaco" ? Number(valor) : valor;
        atualizar();
      });
    });

    document.getElementById("a11yTema").addEventListener("click", function () {
      if (window.agromapTema) window.agromapTema.alternar();
      atualizar();
    });
    document.addEventListener("agromap:tema", atualizar);

    document.getElementById("a11yRestaurar").addEventListener("click", function () {
      cfg = Object.assign({}, PADRAO);
      atualizar();
    });

    document.addEventListener("keydown", teclado);
    atualizar();
  }

  function indiceTexto() {
    var i = NIVEIS_TEXTO.indexOf(cfg.texto);
    if (i >= 0) return i;
    // valor salvo fora da lista: usa o nível mais próximo
    var melhor = 0;
    NIVEIS_TEXTO.forEach(function (n, k) {
      if (Math.abs(n - cfg.texto) < Math.abs(NIVEIS_TEXTO[melhor] - cfg.texto)) melhor = k;
    });
    return melhor;
  }

  function mudarTexto(passo) {
    var i = Math.min(NIVEIS_TEXTO.length - 1, Math.max(0, indiceTexto() + passo));
    cfg.texto = NIVEIS_TEXTO[i];
    atualizar();
  }

  function atualizar() {
    aplicar();
    salvar();

    var i = indiceTexto();
    document.getElementById("a11yTextoValor").textContent = cfg.texto + "%";
    document.getElementById("a11yMenos").disabled = i === 0;
    document.getElementById("a11yMais").disabled = i === NIVEIS_TEXTO.length - 1;

    painel.querySelectorAll(".a11y-switch[data-chave]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(!!cfg[b.getAttribute("data-chave")]));
    });

    document.getElementById("a11yTema").setAttribute(
      "aria-pressed", String(!!(window.agromapTema && window.agromapTema.escuro()))
    );

    painel.querySelectorAll(".a11y-option").forEach(function (b) {
      var atual = String(cfg[b.getAttribute("data-grupo")]);
      b.setAttribute("aria-checked", String(atual === b.getAttribute("data-valor")));
    });
  }

  /* ---------- abrir / fechar / teclado ---------- */

  function abrir() {
    ultimoFoco = document.activeElement;
    painel.classList.add("is-open");
    overlay.classList.add("is-open");
    botao.setAttribute("aria-expanded", "true");
    document.getElementById("a11yFechar").focus();
  }

  function fechar() {
    painel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    botao.setAttribute("aria-expanded", "false");
    (ultimoFoco && ultimoFoco.focus ? ultimoFoco : botao).focus();
  }

  function teclado(ev) {
    if (!painel.classList.contains("is-open")) return;

    if (ev.key === "Escape") {
      ev.preventDefault();
      fechar();
      return;
    }

    // mantém o foco dentro do painel enquanto ele está aberto
    if (ev.key === "Tab") {
      var itens = painel.querySelectorAll("button:not([disabled])");
      if (!itens.length) return;
      var primeiro = itens[0];
      var ultimo = itens[itens.length - 1];

      if (ev.shiftKey && document.activeElement === primeiro) {
        ev.preventDefault();
        ultimo.focus();
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault();
        primeiro.focus();
      }
    }
  }

  // outras partes do site (ex.: rolagem suave) podem consultar isto
  window.agromapSemMovimento = function () {
    return !!cfg.semMovimento ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", construir);
  } else {
    construir();
  }
})();
