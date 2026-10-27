/* ========= CONFIGURAÇÃO =========
   Cole aqui sua chave do Google Maps (Maps JavaScript API + Geocoding API).
   Sem chave, o mapa funciona em modo simples (Google Maps embutido, sem marcar pontos). */
const GOOGLE_MAPS_KEY = "";
 
const $ = (id) => document.getElementById(id);
const BRASIL = { lat: -14.235, lng: -51.925 };
const S = { clima: "", sim: "" };
let prop = null, mapa = null, marcador = null, pendente = null;
 
document.documentElement.style.visibility = "hidden";
const liberar = () => (document.documentElement.style.visibility = "");
const irLogin = () => window.location.replace("login.html");
window.addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });
 
function toast(t) {
  const el = $("toast"); el.textContent = t; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function preencher(id, v, padrao = "—") {
  const c = $(id); if (c) c.textContent = v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : padrao;
}
const ha = (v) => (!v || isNaN(v) ? "Não informado" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " ha");
 
/* ========= PERFIL ========= */
async function carregarPainel() {
  try {
    const r = await fetch("api.php?acao=perfil", { credentials: "same-origin", cache: "no-store" });
    let res; try { res = JSON.parse(await r.text()); } catch { return irLogin(); }
    if (r.status === 401 || !res || !res.sucesso) return irLogin();
    liberar();
 
    const u = res.usuario; prop = res.propriedade;
    preencher("nomeUsuario", u.nome.split(" ")[0], "produtor");
    preencher("emailUsuario", u.email);
    $("saudacaoData").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
 
    if (!prop) { preencher("detalhesPropriedade", "Ainda não há dados cadastrados para esta propriedade."); iniciarMapa(); return; }
 
    preencher("propriedadeUsuario", prop.nome, "Minha propriedade");
    preencher("areaTotal", ha(prop.area_total));
    preencher("areaPlantada", ha(prop.hectares_plantados));
    preencher("culturaPrincipal", prop.cultura_principal, "Não informada");
    preencher("localizacaoUsuario", prop.cidade, "Não informada");
    preencher("estadoUsuario", prop.estado);
 
    const t = parseFloat(prop.area_total), p = parseFloat(prop.hectares_plantados);
    if (t > 0 && p >= 0) {
      const pct = Math.min(100, Math.round((p / t) * 100));
      setTimeout(() => ($("barraPlantada").style.width = pct + "%"), 150);
      $("pctPlantada").textContent = pct + "% da área total";
    }
    if (prop.cultura_principal && [...$("selectCultura").options].some(o => o.text === prop.cultura_principal))
      { $("selectCultura").value = prop.cultura_principal; mostrarCultura(prop.cultura_principal); }
    if (p > 0) $("inputArea").value = p;
 
    $("detalhesPropriedade").textContent = [
      prop.endereco && "Endereço: " + prop.endereco,
      prop.outras_culturas && "Outras culturas: " + prop.outras_culturas,
      prop.epoca_plantio && "Época de plantio: " + prop.epoca_plantio,
      prop.irrigacao && "Irrigação: " + prop.irrigacao,
      prop.observacoes && "Observações: " + prop.observacoes
    ].filter(Boolean).join(" • ");
 
    iniciarMapa();
  } catch (e) { liberar(); console.error(e); }
}
 
/* ========= GOOGLE MAPS ========= */
function iniciarMapa() {
  const temCoord = prop && prop.latitude && prop.longitude;
  const consulta = prop ? [prop.endereco, prop.cidade, prop.estado, "Brasil"].filter(Boolean).join(", ") : "Brasil";
 
  if (!GOOGLE_MAPS_KEY) {                       // modo sem chave
    const q = temCoord ? `${prop.latitude},${prop.longitude}` : consulta;
    $("mapa").innerHTML = `<iframe title="Mapa da propriedade" loading="lazy" allowfullscreen
      src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=k&z=${temCoord ? 15 : 12}&output=embed"></iframe>`;
    $("infoMapa").textContent = "Mapa simples ativo. Adicione sua chave do Google Maps em dashboard.js para marcar e salvar o ponto exato.";
    $("btnGps").style.display = $("btnSalvarLoc").style.display = $("tipoMapa").style.display = "none";
    clima(temCoord ? +prop.latitude : null, temCoord ? +prop.longitude : null);
    return;
  }
  window.initMapa = () => montarMapa(temCoord, consulta);
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMapa&loading=async`;
  s.async = true; s.onerror = () => ($("infoMapa").textContent = "Não foi possível carregar o Google Maps. Confira a chave.");
  document.head.appendChild(s);
}
 
function montarMapa(temCoord, consulta) {
  const centro = temCoord ? { lat: +prop.latitude, lng: +prop.longitude } : BRASIL;
  mapa = new google.maps.Map($("mapa"), {
    center: centro, zoom: temCoord ? 15 : 4, mapTypeId: "satellite",
    streetViewControl: false, fullscreenControl: true
  });
  marcador = new google.maps.Marker({ map: mapa, position: temCoord ? centro : null, draggable: true, title: "Sua propriedade" });
 
  if (temCoord) { $("infoMapa").textContent = "Localização salva. Arraste o marcador para ajustar."; clima(centro.lat, centro.lng); }
  else {
    $("infoMapa").textContent = "Procurando sua cidade no mapa…";
    new google.maps.Geocoder().geocode({ address: consulta }, (r, st) => {
      if (st === "OK" && r[0]) {
        mapa.fitBounds(r[0].geometry.viewport);
        const l = r[0].geometry.location; clima(l.lat(), l.lng());
        $("infoMapa").textContent = "Clique no mapa para marcar o ponto exato da propriedade.";
      } else { $("infoMapa").textContent = "Clique no mapa para marcar sua propriedade."; clima(null, null); }
    });
  }
  mapa.addListener("click", (e) => definirPonto(e.latLng.lat(), e.latLng.lng()));
  marcador.addListener("dragend", (e) => definirPonto(e.latLng.lat(), e.latLng.lng(), true));
 
  document.querySelectorAll("#tipoMapa button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#tipoMapa button").forEach(x => x.classList.toggle("on", x === b));
    mapa.setMapTypeId(b.dataset.tipo);
  }));
  $("btnGps").addEventListener("click", () => {
    if (!navigator.geolocation) return toast("Seu navegador não permite localização.");
    navigator.geolocation.getCurrentPosition(
      (p) => { definirPonto(p.coords.latitude, p.coords.longitude); mapa.setZoom(16); },
      () => toast("Permita o acesso à localização no navegador."));
  });
  $("btnSalvarLoc").addEventListener("click", salvarLocalizacao);
}
 
function definirPonto(lat, lng, soMarcador) {
  pendente = { latitude: +lat.toFixed(7), longitude: +lng.toFixed(7) };
  marcador.setPosition({ lat, lng }); mapa.panTo({ lat, lng });
  $("btnSalvarLoc").disabled = false;
  $("infoMapa").textContent = `Ponto escolhido: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Clique em "Salvar localização".`;
}
 
async function salvarLocalizacao() {
  if (!pendente) return;
  try {
    const r = await fetch("api.php", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "salvar_localizacao", ...pendente }) });
    const res = await r.json();
    if (!res.sucesso) return toast(res.mensagem || "Não foi possível salvar.");
    toast("Localização salva!"); $("btnSalvarLoc").disabled = true;
    $("infoMapa").textContent = "Localização salva. Arraste o marcador para ajustar quando quiser.";
    clima(pendente.latitude, pendente.longitude); pendente = null;
  } catch { toast("Erro de conexão ao salvar."); }
}
 
/* ========= CLIMA (Open-Meteo, gratuito e sem chave) ========= */
const ICONES = [[0, "☀️", "Céu limpo"], [3, "⛅", "Parcialmente nublado"], [48, "🌫️", "Neblina"], [57, "🌦️", "Garoa"],
  [67, "🌧️", "Chuva"], [77, "❄️", "Neve"], [82, "🌧️", "Pancadas de chuva"], [99, "⛈️", "Tempestade"]];
const icone = (c) => ICONES.find(i => c <= i[0]) || ICONES[7];
 
async function clima(lat, lng) {
  const box = $("climaBox");
  try {
    if (lat == null && prop && prop.cidade) {
      const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(prop.cidade)}&count=1&country_code=BR&language=pt`)).json();
      if (g.results && g.results[0]) { lat = g.results[0].latitude; lng = g.results[0].longitude; }
    }
    if (lat == null) { box.innerHTML = '<p class="empty">Marque a localização da propriedade para ver o clima.</p>'; return; }
    const d = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`)).json();
    const c = d.current, ic = icone(c.weather_code);
    const dias = d.daily.time.map((t, i) => {
      const nome = new Date(t + "T12:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      return `<div class="w-day"><b>${i ? nome : "Hoje"}</b><span>${icone(d.daily.weather_code[i])[1]}</span>
        <strong>${Math.round(d.daily.temperature_2m_max[i])}° <small style="color:var(--muted)">${Math.round(d.daily.temperature_2m_min[i])}°</small></strong>
        <small>💧 ${d.daily.precipitation_probability_max[i] ?? 0}%</small></div>`;
    }).join("");
    box.innerHTML = `<div class="w-now"><span style="font-size:2.125rem">${ic[1]}</span><strong>${Math.round(c.temperature_2m)}°C</strong><p>${ic[2]}</p>
      <div class="w-extra"><span>Umidade ${c.relative_humidity_2m}%</span><span>Vento ${Math.round(c.wind_speed_10m)} km/h</span><span>Chuva ${c.precipitation} mm</span></div></div>
      <div class="w-days">${dias}</div>`;
    $("climaLocal").textContent = "Dados em tempo real para o local da propriedade (Open-Meteo).";
    S.clima = `${Math.round(c.temperature_2m)}°C, ${ic[2]}, umidade ${c.relative_humidity_2m}%, vento ${Math.round(c.wind_speed_10m)} km/h, chuva ${c.precipitation} mm; próximos dias: máx ${d.daily.temperature_2m_max.map(Math.round).join("/")}°C, prob. chuva ${d.daily.precipitation_probability_max.join("/")}%`;
    $("tClima").textContent = Math.round(c.temperature_2m) + "°C " + ic[1];
  } catch { box.innerHTML = '<p class="empty">Não foi possível carregar o clima agora. Tente novamente em instantes.</p>'; }
}
 
/* ========= SIMULADOR ========= */
const RENDIMENTO = { Soja: [60, "sacas"], Milho: [110, "sacas"], Feijão: [35, "sacas"], Café: [40, "sacas"] };
$("btnSimular").addEventListener("click", () => {
  const cultura = $("selectCultura").value, area = parseFloat($("inputArea").value);
  if (!area || area <= 0) { toast("Informe a área em hectares."); $("inputArea").focus(); return; }
  const perd = haPerdas(cultura), areaEf = Math.max(area - perd, 0);
  const esp = Math.round(RENDIMENTO[cultura][0] * areaEf);
  const cen = [["Otimista", Math.round(esp * 1.18), "f-o", 100], ["Esperado", esp, "f-e", 85], ["Pessimista", Math.round(esp * .75), "f-p", 64]];
  $("resSim").innerHTML = cen.map(c => `<div class="sc"><span>${c[0]}</span><div class="track"><div class="fill ${c[2]}" data-w="${c[3]}"></div></div>
    <strong>${c[1].toLocaleString("pt-BR")} sacas</strong></div>`).join("") +
    `<p class="sim-note">${cultura} em ${areaEf.toLocaleString("pt-BR")} ha${perd ? " (já descontados " + perd + " ha com perdas)" : ""}, com produtividade média de ${RENDIMENTO[cultura][0]} sacas/ha. O cenário otimista considera +18% e o pessimista −25%.</p>`;
  S.sim = `${cultura}, ${areaEf} ha efetivos: otimista ${cen[0][1]}, esperado ${esp}, pessimista ${cen[2][1]} sacas`;
  $("tSim").textContent = esp.toLocaleString("pt-BR") + " sacas";
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.querySelectorAll("#resSim .fill").forEach(f => (f.style.width = f.dataset.w + "%"))));
});
 
/* ========= CALENDÁRIO ========= */
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CAL = {
  Soja: { p: [8, 9, 10], c: [0, 1, 2], d: "Plantio de setembro a dezembro; colheita de janeiro a março." },
  Milho: { p: [8, 9, 10, 1, 2], c: [2, 3, 4, 5, 6], d: "1ª safra em set–nov; safrinha em fev–mar, colhida de maio a julho." },
  Feijão: { p: [1, 2, 7, 8, 9, 10], c: [4, 5, 10, 11], d: "Três épocas: águas, seca e inverno. Varia bastante conforme a região." },
  Café: { p: [9, 10, 11, 0], c: [4, 5, 6, 7], d: "Mudas plantadas no início das chuvas; colheita de maio a agosto." }
};
function mostrarCultura(nome) {
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.textContent === nome));
  $("meses").innerHTML = MESES.map((m, i) => `<div class="m ${CAL[nome].p.includes(i) ? "plant" : CAL[nome].c.includes(i) ? "harv" : ""}">${m}</div>`).join("");
  $("descCalendario").innerHTML = `<b style="color:var(--leaf)">■</b> plantio &nbsp; <b style="color:var(--gold)">■</b> colheita &nbsp; — ${CAL[nome].d}`;
}
$("chipsCultura").innerHTML = Object.keys(CAL).map(n => `<button class="chip" type="button">${n}</button>`).join("");
$("chipsCultura").addEventListener("click", (e) => e.target.classList.contains("chip") && mostrarCultura(e.target.textContent));
mostrarCultura("Soja");
 
/* ========= PERDAS ========= */
const chavePerdas = () => "agromap_perdas_" + $("emailUsuario").textContent;
const lerPerdas = () => { try { return JSON.parse(localStorage.getItem(chavePerdas())) || []; } catch { return []; } };
const haPerdas = (c) => lerPerdas().filter(p => p.cultura === c).reduce((t, p) => t + p.ha, 0);
function desenharPerdas() {
  const l = lerPerdas(), tot = l.reduce((t, p) => t + p.ha, 0);
  $("tPerdas").textContent = tot.toLocaleString("pt-BR") + " ha";
  $("totalPerdas").textContent = l.length ? `Total: ${tot.toLocaleString("pt-BR")} ha afetados em ${l.length} registro(s).` : "Nenhuma perda registrada nesta safra.";
  $("listaPerdas").innerHTML = l.map((p, i) => `<div class="loss"><div><b>${p.cultura}</b> · ${p.causa}<small>${new Date(p.data + "T12:00").toLocaleDateString("pt-BR")}</small></div>
    <span>${p.ha.toLocaleString("pt-BR")} ha</span><button type="button" data-del="${i}" aria-label="Remover registro">✕</button></div>`).join("");
}
$("pData").valueAsDate = new Date();
$("pCultura").innerHTML = $("selectCultura").innerHTML;
$("formPerda").addEventListener("submit", (e) => {
  e.preventDefault();
  const l = lerPerdas();
  l.unshift({ cultura: $("pCultura").value, causa: $("pCausa").value, ha: parseFloat($("pHa").value), data: $("pData").value });
  localStorage.setItem(chavePerdas(), JSON.stringify(l)); e.target.reset(); $("pData").valueAsDate = new Date();
  desenharPerdas(); toast("Perda registrada. A simulação já considera essa área.");
});
$("listaPerdas").addEventListener("click", (e) => {
  const i = e.target.dataset.del; if (i === undefined) return;
  const l = lerPerdas(); l.splice(+i, 1); localStorage.setItem(chavePerdas(), JSON.stringify(l)); desenharPerdas();
});
 
/* ========= ASSISTENTE IA ========= */
const hist = [];
const fmt = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^[-*] /gm, "• ").replace(/\n/g, "<br>");
function bolha(t, cls) {
  const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = fmt(t);
  $("chat").appendChild(d); $("chat").scrollTop = $("chat").scrollHeight; return d;
}
async function enviarIA(texto) {
  texto = texto.trim(); if (!texto) return;
  bolha(texto, "eu"); hist.push({ role: "user", content: texto });
  const espera = bolha("Analisando seus dados…", "ia pend");
  try {
    const r = await fetch("ia.php", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagens: hist.slice(-10), contexto: { propriedade: prop, clima: S.clima, simulacao: S.sim, perdas: lerPerdas() } }) });
    const res = await r.json();
    if (!res.sucesso) throw new Error(res.mensagem);
    espera.classList.remove("pend"); espera.innerHTML = fmt(res.resposta); hist.push({ role: "assistant", content: res.resposta });
  } catch (err) { espera.classList.remove("pend"); espera.classList.add("erro"); espera.textContent = err.message || "A IA não respondeu agora. Tente novamente."; hist.pop(); }
  $("chat").scrollTop = $("chat").scrollHeight;
}
$("chatForm").addEventListener("submit", (e) => { e.preventDefault(); const t = $("chatInput").value; $("chatInput").value = ""; enviarIA(t); });
bolha("Olá! Sou o Agro IA. Já tenho os dados da sua propriedade, o clima do local e suas perdas. O que você quer saber?", "ia");
 
/* ========= PÁGINAS ========= */
function ir(id) {
  if (!$(id) || !$(id).classList.contains("view")) id = "inicio";
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("on", v.id === id));
  document.querySelectorAll(".menu").forEach(b => b.classList.toggle("active", b.dataset.section === id));
  $("sidebar").classList.remove("open"); history.replaceState(null, "", "#" + id); window.scrollTo(0, 0);
  if (id === "localizacao" && mapa) { google.maps.event.trigger(mapa, "resize"); if (marcador && marcador.getPosition()) mapa.setCenter(marcador.getPosition()); }
  if (id === "ia") $("chatInput").focus({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  const ask = e.target.closest("[data-ask]"); if (ask) { ir("ia"); enviarIA(ask.dataset.ask); return; }
  const go = e.target.closest("[data-go],[data-section]"); if (go) ir(go.dataset.go || go.dataset.section);
});
$("selectCultura").addEventListener("change", (e) => mostrarCultura(e.target.value));
desenharPerdas();
ir(location.hash.slice(1) || "inicio");
$("burger").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("logout").addEventListener("click", async () => {
  try { await fetch("api.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "logout" }) }); } catch {}
  location.replace("login.html");
});
 
carregarPainel();