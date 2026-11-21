// ==== GUARD / DEBUG ====
const DEBUG = false; //Mudar  para true quando der problema e precisar ver no console, false deixa essa desligado
debugLog('[TreeMap] api.js LOADED');
function debugLog(...args) {
  if (DEBUG) console.log(...args);
}
if (window.__TREEMAP_INITED__) {
  console.warn('[TreeMap] api.js já inicializado; ignorando carga duplicada.');
} else {
  window.__TREEMAP_INITED__ = true;

  // Desliga funções legadas
  window.atualizarInformacoesLateral = () => {};
  window.carregarCardsRecentes = () => {};

  // Camada de marcadores
  const markersLayer = L.layerGroup().addTo(map);

  // Fechar card ao clicar no mapa / ESC
  let ultimoMarcadorSel = null;
  map.on('click', () => fecharCard());
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') fecharCard(); });

// Torna o último snapshot de estatísticas global
window.__lastStats = null;

// Render desktop
function renderStatsDesktop(stats){
  const { total, especiesQtde, ultimaStr, top } = stats;
  const elTotal = document.getElementById('total-arvores');
  const elEsp   = document.getElementById('especies-diferentes');
  const elUlt   = document.getElementById('ultima-atualizacao');
  const elList  = document.getElementById('mais-comuns');

  if (elTotal) elTotal.textContent = String(total);
  if (elEsp)   elEsp.textContent   = String(especiesQtde);
  if (elUlt)   elUlt.textContent   = ultimaStr;
  if (elList) {
    elList.innerHTML = '';
    top.forEach(([nome,qtd])=>{
      const li = document.createElement('li');
      li.className = 'flex items-center mb-2';
      const dot = document.createElement('span');
      dot.className = 'w-3 h-3 bg-green-500 rounded-full mr-2 inline-block';
      const label = document.createElement('span');
      label.textContent = `${nome} (${qtd})`;
      li.append(dot, label);
      elList.appendChild(li);
    });
  }
}

// Render mobile (drawer)
function renderStatsMobile(stats){
  const { total, especiesQtde, ultimaStr, top } = stats;
  const mTotal = document.getElementById('m-total-arvores');
  const mEsp   = document.getElementById('m-especies-diferentes');
  const mUlt   = document.getElementById('m-ultima-atualizacao');
  const mList  = document.getElementById('m-mais-comuns');

  if (mTotal) mTotal.textContent = String(total);
  if (mEsp)   mEsp.textContent   = String(especiesQtde);
  if (mUlt)   mUlt.textContent   = ultimaStr;
  if (mList) {
    mList.innerHTML = '';
    top.forEach(([nome,qtd])=>{
      const li = document.createElement('li');
      li.className = 'flex items-center mb-2';
      const dot = document.createElement('span');
      dot.className = 'w-3 h-3 bg-green-500 rounded-full mr-2 inline-block';
      const label = document.createElement('span');
      label.textContent = `${nome} (${qtd})`;
      li.append(dot, label);
      mList.appendChild(li);
    });
  }
}

// expõe as funções para o index.html poder chamá-las
window.renderStatsDesktop = renderStatsDesktop;
window.renderStatsMobile  = renderStatsMobile;



  function fecharCard(){
  const s = document.getElementById('sidebar-popup');
  if (s) {
    s.classList.add('hidden');
    // ADICIONE a linha abaixo:
    s.classList.remove('lg:block');  // <-- GARANTE que não “reserve” espaço após F5
    s.innerHTML = '';
  }
  if (ultimoMarcadorSel) {
    ultimoMarcadorSel.getElement()?.classList.remove('selected');
    ultimoMarcadorSel = null;
  }
  try { map.invalidateSize(); } catch {}
}


  // Event delegation para o botão Fechar dentro do card
  document.getElementById('sidebar-popup')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-close="popup"]');
    if (btn) fecharCard();
  });

  // Helpers
  const isMobile = window.matchMedia('(max-width:1023px)');
  function toTS(v){ if(v==null) return null; if(typeof v==='number') return v; const t=Date.parse(v); return Number.isFinite(t)?t:null; }
  function pickImage(imgs){ const i=(imgs && imgs[0])||null; return i?.l || i?.m || i?.s || i?.urlLarge || i?.url || null; }
  function pickImages(imgs) {
  if (!Array.isArray(imgs)) return [];

  return imgs
    .map(i => i?.l || i?.m || i?.s || i?.urlLarge || i?.url)
    .filter(url => typeof url === 'string' && url.trim());
}
  
function interpretarMedidas(comments) {
  if (typeof comments !== "string") return null;

  const texto = comments.trim();

  // FORMATO NOVO:
  // C=240;A=900
  // C = circunferência em cm
  // A = altura em cm

  const novoFormato = texto.match(
    /^C\s*=\s*(\d+(?:[.,]\d+)?)\s*;\s*A\s*=\s*(\d+(?:[.,]\d+)?)$/i
  );

  if (novoFormato) {
    const circunferenciaCm = Number(
      novoFormato[1].replace(",", ".")
    );

    const alturaCm = Number(
      novoFormato[2].replace(",", ".")
    );

    if (
      !Number.isFinite(circunferenciaCm) ||
      !Number.isFinite(alturaCm) ||
      circunferenciaCm <= 0 ||
      alturaCm <= 0
    ) {
      return null;
    }

    return {
      circunferenciaCm,
      alturaM: alturaCm / 100,
      dapCm: circunferenciaCm / Math.PI,
      metodo: "padronizado",
      confiancaMedidas: "identificadas"
    };
  }

  // FORMATO ANTIGO:
  // 240/900 ou 900/240

  const formatoAntigo = texto.match(
    /^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/
  );

  if (formatoAntigo) {
    const valor1 = Number(
      formatoAntigo[1].replace(",", ".")
    );

    const valor2 = Number(
      formatoAntigo[2].replace(",", ".")
    );

    if (
      !Number.isFinite(valor1) ||
      !Number.isFinite(valor2) ||
      valor1 <= 0 ||
      valor2 <= 0
    ) {
      return null;
    }

    const circunferenciaCm = Math.min(valor1, valor2);
    const alturaCm = Math.max(valor1, valor2);

    return {
      circunferenciaCm,
      alturaM: alturaCm / 100,
      dapCm: circunferenciaCm / Math.PI,
      metodo: "legado",
      confiancaMedidas: "presumidas"
    };
  }

  return null;
}

  // Encode all data from external observation services before inserting it into HTML.
  // Browser textContent is preferred when building DOM without templates.
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  // Accept only ordinary HTTP(S) image URLs; never render javascript: or data: URLs.
  const FALLBACK_IMAGE = 'https://placehold.co/600x400?text=Sem+Imagem';
  function safeImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return FALLBACK_IMAGE;
    try {
      const candidate = new URL(value, window.location.href);
      if (candidate.protocol === 'https:' || candidate.protocol === 'http:') {
        return candidate.href;
      }
    } catch (_) {}
    return FALLBACK_IMAGE;
  }

  function plantnetObservationUrl(id) {
    if (id == null || String(id).trim() === '') return null;
    return 'https://identify.plantnet.org/pt-br/k-brazil/observations/' +
      encodeURIComponent(String(id));
  }

  function firstNonEmpty(...vals){ for(const v of vals){ if(v && String(v).trim().length) return v; } return ''; }

  // Normalizadores
  function normFromObservacao(t){
    return {
      source:'observacao',
      id:t.id ?? t.obsId ?? null,
      lat:t?.geo?.lat ?? null,
      lon:t?.geo?.lon ?? null,
      place:t?.geo?.place ?? '',
      dateTS:t?.dateObsTSms ?? toTS(t?.dateObs),
      dateStr:t?.dateObs ?? '',
      speciesCommon:Array.isArray(t?.species?.commonNames)?t.species.commonNames:[],
      speciesName:t?.species?.name ?? '',
      submittedName:t?.submittedName ?? '',
      image:pickImage(t?.images),
      images:pickImages(t?.images),
      medidas: interpretarMedidas(t?.comments),
      plantnetId:t?.id ?? null,
      projectName:'',
      projectUrl:''
    };
  }

  // Dedup
  function dedupUnified(arr){
    const seen=new Set(), out=[];
    for(const it of arr){
      const key = it.id ? `obs:${it.id}` : `${it.lat?.toFixed?.(6)},${it.lon?.toFixed?.(6)},${it.dateTS||0}`;
      if(seen.has(key)) continue;
      seen.add(key); out.push(it);
    }
    return out;
  }

  // Fetchers
 async function fetchObservationsByProject(projetoId) {
  const pageSize = 250;
  const maxPages = 6; // segurança para não ficar infinito
  let todas = [];
  const idsVistos = new Set();

  for (let page = 0; page < maxPages; page++) {
    try {
      // Protected PHP implementation is not part of the public source snapshot.
      const res = await fetch('/api/api.php?getObservations&projeto=' + projetoId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		  // Converte o objeto para uma string x-www-form-urlencoded
          body: new URLSearchParams({
          	lang: 'pt-br',
          	page: page,
          	pageSize: pageSize,
          	insideAreaOnly: true
  		  }).toString()
	  });

      const data = await res.json();
      const lista = Array.isArray(data?.observations) ? data.observations : [];

      debugLog(`[TreeMap] projeto=${projetoId} página=${page} retornou ${lista.length}`);

      if (lista.length === 0) break;

      let novos = 0;

      lista.forEach(obs => {
        const id = obs.id ?? obs.obsId ?? null;
        if (!id) return;

        if (!idsVistos.has(id)) {
          idsVistos.add(id);
          todas.push(obs);
          novos++;
        }
      });

      debugLog(`[TreeMap] projeto=${projetoId} página=${page} novos=${novos}`);

      // Se a página veio cheia, mas não trouxe nenhum ID novo, está repetindo.
      if (novos === 0) break;

      // Se veio menos que o limite, terminou.
      if (lista.length < pageSize) break;

    } catch (e) {
      console.error('[TreeMap] Falha getObservations projeto=' + projetoId + ' página=' + page, e);
      break;
    }
  }

  debugLog(`[TreeMap] projeto=${projetoId} total carregado: ${todas.length}`);
  return todas;
}

  // Bootstrap
  const PROJETOS = [1,2,3];
  async function bootstrap(){
    try {
      debugLog('[TreeMap] bootstrap start');

      const obsLists = await Promise.all(PROJETOS.map(id => fetchObservationsByProject(id)));
      const obsAll = obsLists.flat();
      debugLog('[TreeMap] fetched counts => obsAll:', obsAll.length);

      const unifiedRaw = obsAll.map(normFromObservacao).filter(it => it.lat!=null && it.lon!=null);
      const unified = dedupUnified(unifiedRaw).sort((a,b)=>(b.dateTS||0)-(a.dateTS||0));
      debugLog('[TreeMap] unified after dedup:', unified.length);

      markersLayer.clearLayers();
      adicionarItensNoMapa(unified);
      atualizarInformacoesLateralUnificado(unified);
      carregarCardsRecentesUnificado(unified);

      debugLog('[TreeMap] render done');
    } catch (e) {
      console.error('[TreeMap] Falha no bootstrap:', e);
    }
  }
  window.onload = bootstrap;

  // quando o usuário tocar no botão "Estatísticas" (mobile), preenche na hora
document.getElementById('open-stats')?.addEventListener('click', ()=>{
  if (window.__lastStats) {
    window.renderStatsMobile(window.__lastStats);
  }
});


  // Render mapa + popup
  function adicionarItensNoMapa(items){
    if(!Array.isArray(items)) return;

    items.forEach((it)=>{
      const nomePopular    = it.speciesCommon?.[0] || it.submittedName || "Espécie desconhecida";
      const nomeCientifico = it.speciesName || "";
      const local          = it.place || "Local não informado";
      const foto           = safeImageUrl(it.image);
      const fotos = (it.images?.length ? it.images : (it.image ? [it.image] : []))
        .map(safeImageUrl);

      const galeriaId = `galeria-${String(it.id ?? '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const addedStr       = it.dateStr || (it.dateTS ? new Date(it.dateTS).toLocaleDateString('pt-BR') : '');
      const medidas = it.medidas;

      const formatarMedida = (valor, casas = 2) =>
        valor.toLocaleString('pt-BR', {
          maximumFractionDigits: casas
        });

      const medidasHtml = medidas ? `
        <div class="mt-4 border-t border-gray-200 pt-3">
          <h4 class="font-semibold text-green-800 mb-3">
            <i class="fas fa-ruler-combined mr-1"></i>
            Características da árvore
          </h4>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-green-50 rounded-lg p-3">
              <p class="text-xs text-gray-500">Altura estimada</p>
              <p class="font-bold text-green-800">
                ${formatarMedida(medidas.alturaM)} m
              </p>
            </div>

            <div class="bg-green-50 rounded-lg p-3">
              <p class="text-xs text-gray-500">Circunferência estimada</p>
              <p class="font-bold text-green-800">
                ${formatarMedida(medidas.circunferenciaCm)} cm
              </p>
            </div>
          </div>
        </div>

            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-circle-info mr-1"></i>
             Medidas interpretadas automaticamente a partir dos registros.
            A identificação dos valores pode conter imprecisões.
            </p>
        ` : `
          <div class="mt-4 border-t border-gray-200 pt-3">
            <h4 class="font-semibold text-green-800 mb-3">
              <i class="fas fa-ruler-combined mr-1"></i>
              Características da árvore
            </h4>

            <div class="grid grid-cols-2 gap-2">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Altura</p>
                <p class="font-semibold text-gray-600 text-sm">
                  Não informada
                </p>
              </div>

              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Circunferência</p>
                <p class="font-semibold text-gray-600 text-sm">
                  Não informada
                </p>
              </div>
            </div>

             <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-circle-info mr-1"></i>
              Esta observação não possui medidas disponíveis
              ou reconhecidas pelo sistema.
            </p>
          </div>
        `;
      const observationUrl = plantnetObservationUrl(it.plantnetId);
      const linkHtml = observationUrl
        ? `<a href="${escapeHTML(observationUrl)}" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline">Ver no PlantNet</a>`
        : `<span class="opacity-60">Sem link</span>`;

      const popupContent = `
        <div class="w-72">
          <button type="button" data-close="popup" class="mb-2 text-red-600 font-bold inline-flex items-center gap-1">
            <i class="fa-solid fa-xmark"></i> Fechar
          </button>
          <div id="${galeriaId}" class="relative mb-3 rounded-lg overflow-hidden bg-gray-100">

            <img
              src="${escapeHTML(foto)}"
              alt="${escapeHTML(nomePopular)}"
              data-galeria-imagem
              class="w-full h-56 object-contain"
            >

          ${fotos.length > 1 ? `
            <button type="button"
            data-galeria-direcao="-1"
            aria-label="Foto anterior"
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-green-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <i class="fas fa-chevron-left"></i>
          </button>

          <button type="button"
            data-galeria-direcao="1"
            aria-label="Próxima foto"
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-green-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <i class="fas fa-chevron-right"></i>
         </button>

        <div data-galeria-contador
          class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          1 / ${fotos.length}
        </div>
    ` : ''}
</div>
          <h3 class="font-bold text-lg">${escapeHTML(nomePopular)}</h3>
          <p class="text-gray-600 italic text-sm mb-2">${escapeHTML(nomeCientifico)}</p>
          <p class="text-sm">${escapeHTML(local)}</p>
          ${medidasHtml}
          <div class="mt-3 flex justify-between items-center text-xs text-gray-500">
            <span>Adicionado em ${escapeHTML(addedStr)}</span>
            ${linkHtml}
          </div>
        </div>`;

      const marker = L.marker([it.lat, it.lon], { icon: treeIcon });
      marker.on('click', () => {
        // destaque marker
        ultimoMarcadorSel?.getElement()?.classList.remove('selected');
        marker.getElement()?.classList.add('selected');
        ultimoMarcadorSel = marker;

        const alvo = marker.getLatLng();
        const targetZoom = Math.max(map.getZoom(), 19);
        map.flyTo(alvo, Math.min(targetZoom, 21), { animate:true, duration:0.5 });

        const sidebar = document.getElementById('sidebar-popup');
        if (!sidebar) return;
        sidebar.innerHTML = popupContent;
        let fotoAtual = 0;

        const galeria = sidebar.querySelector(`#${galeriaId}`);
        const imagemGaleria = galeria?.querySelector('[data-galeria-imagem]');
        const contadorGaleria = galeria?.querySelector('[data-galeria-contador]');

        galeria?.querySelectorAll('[data-galeria-direcao]').forEach(botao => {
          botao.addEventListener('click', (e) => {
            e.stopPropagation();

          const direcao = Number(botao.dataset.galeriaDirecao);

          fotoAtual = (fotoAtual + direcao + fotos.length) % fotos.length;

          if (imagemGaleria) imagemGaleria.src = fotos[fotoAtual];

          if (contadorGaleria) {
            contadorGaleria.textContent = `${fotoAtual + 1} / ${fotos.length}`;
        }
      });
    });
        sidebar.classList.remove('hidden');
        sidebar.classList.add('lg:block');  

        map.once('moveend', () => {
          const w = sidebar.offsetWidth || 320;
          map.panBy([w/2, 0], { animate:true, duration:0.3 });
        });
      });

      markersLayer.addLayer(marker);
    });
  }

  // Informativos (desktop + mobile)
  function atualizarInformacoesLateralUnificado(items){
  if(!Array.isArray(items)) return;

  const especies = {};
  let ultimoTS = null;

  items.forEach((it)=>{
    const nome = (it.speciesCommon?.[0] || it.speciesName || it.submittedName || 'Desconhecida').trim();
    especies[nome] = (especies[nome] || 0) + 1;
    const ts = it.dateTS ?? null;
    if (ts!=null) ultimoTS = Math.max(ultimoTS ?? ts, ts);
  });

  const total        = items.length;
  const especiesQtde = Object.keys(especies).length;
  const ultimaStr    = ultimoTS
    ? new Date(ultimoTS).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
    : '---';
  const top          = Object.entries(especies).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // guarda globalmente para qualquer script poder usar
  window.__lastStats = { total, especiesQtde, ultimaStr, top };

  // preenche ambos imediatamente
  renderStatsDesktop(window.__lastStats);
  renderStatsMobile(window.__lastStats);
}

  // Cartões recentes
  function formatarDataRelativaTS(ts){
    if(!ts) return '';
    const d=new Date(ts), agora=new Date();
    const diffDias=Math.floor((agora-d)/(1000*60*60*24));
    if(diffDias===0) return 'hoje';
    if(diffDias===1) return 'ontem';
    if(diffDias<7) return `há ${diffDias} dias`;
    if(diffDias<30) return `há ${Math.floor(diffDias/7)} semana(s)`;
    return d.toLocaleDateString('pt-BR');
  }
  function carregarCardsRecentesUnificado(items){
    const container=document.getElementById("recent-cards");
    if(!container) return;
    container.innerHTML="";

    [...items].sort((a,b)=>(b.dateTS||0)-(a.dateTS||0)).slice(0,3).forEach(it=>{
      const nomePopular    = it.speciesCommon?.[0] || it.submittedName || "Espécie desconhecida";
      const nomeCientifico = it.speciesName || "";
      const local          = it.place || "Local não informado";
      const dataRelativa   = formatarDataRelativaTS(it.dateTS);
      const imagem         = safeImageUrl(it.image);
      const link           = plantnetObservationUrl(it.plantnetId) || '#';

      const cardHTML = `
        <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
          <img loading="lazy" decoding="async" src="${escapeHTML(imagem)}" alt="${escapeHTML(nomePopular)}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="font-bold text-lg text-gray-800">${escapeHTML(nomePopular)}</h3>
            <p class="text-gray-600 text-sm italic">${escapeHTML(nomeCientifico)}</p>
            <div class="mt-3 flex items-center text-sm text-gray-500"><i class="fas fa-location-dot mr-1"></i>${escapeHTML(local)}</div>
            <div class="mt-3 flex justify-between items-center">
              <span class="text-xs text-gray-500">Adicionada ${escapeHTML(dataRelativa)}</span>
              <a class="text-green-600 hover:text-green-800 text-sm font-medium" target="_blank" href="${escapeHTML(link)}" rel="noopener noreferrer">
                Ver detalhes <i class="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        </article>`;
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  // Ajustes de layout
  window.addEventListener('resize', ()=>{ try{ map.invalidateSize(); }catch{} });
}
