
/*
 * TreeMap-ITE
 * Base de dados ambientais das espécies
 *
 * Este arquivo armazena parâmetros científicos
 * utilizados nas estimativas ambientais.
 *
 * Não inserir valores sem fonte verificável.
 */

const DADOS_AMBIENTAIS = {
  "Libidibia ferrea": {
    nomePopular: "Pau-ferro",
    tipo: "arvore",
    densidadeMadeira: null,
    fonte: null,
    modeloAlometrico: null,
    status: "aguardando_dados"
  },

  "Cenostigma pluviosum": {
    nomePopular: "Sibipiruna",
    tipo: "arvore",
    densidadeMadeira: null,
    fonte: null,
    modeloAlometrico: null,
    status: "aguardando_dados"
  },

    "Handroanthus ochraceus": {
     nomePopular: "Ipê-amarelo",
     tipo: "arvore",
     densidadeMadeira: 0.643,
     fonte: {
     nome: "Ciência Florestal - Valuation of seven Cerrado woods in charcoal production",
     url: "https://new.scielo.br/j/cflo/a/V93RZHnjCq6JHRTQB6K4CdL/"
  },
  modeloAlometrico: null,
  status: "densidade_identificada"
},

"Tabebuia rosea": {
  nomePopular: "Ipê-rosa",
  tipo: "arvore",
  densidadeMadeira: 0.54,
  fonte: {
    nome: "ITTO - Tropical Timber",
    url: "https://www.tropicaltimber.info/specie/apamate-tabebuia-rosea/"
  },
  modeloAlometrico: null,
  status: "densidade_identificada"
},


  "Syagrus romanzoffiana": {
    nomePopular: "Jerivá",
    tipo: "palmeira",
    densidadeMadeira: null,
    fonte: null,        
    modeloAlometrico: null,
    status: "modelo_especifico"
  }
};

function buscarDadosAmbientais(nomeCientifico) {
  if (!nomeCientifico) {
    return null;
  }

  const nomeNormalizado = nomeCientifico.trim().toLowerCase();

  const especieEncontrada = Object.keys(DADOS_AMBIENTAIS)
    .find(nome => nome.toLowerCase() === nomeNormalizado);

  if (!especieEncontrada) {
    return null;
  }

  return DADOS_AMBIENTAIS[especieEncontrada];
}


/*
 * TreeMap-ITE
 * Consulta automática à base científica GWDD v2.2
 */

let baseDensidadesMadeira = null;

async function carregarBaseDensidades() {
  if (baseDensidadesMadeira) {
    return baseDensidadesMadeira;
  }

  // The third-party GWDD data file is omitted from this public source snapshot
  // until redistribution terms are confirmed. Calculations requiring it will
  // report unavailable results instead of failing on a missing JSON file.
  try {
    const resposta = await fetch('dados/densidades-madeira.json');
    if (!resposta.ok) throw new Error('Density dataset not available');
    baseDensidadesMadeira = await resposta.json();
  } catch (erro) {
    console.info('[TreeMap] Optional scientific density dataset not included in public snapshot.');
    baseDensidadesMadeira = { especies: {}, generos: {} };
  }

  return baseDensidadesMadeira;
}

async function buscarDensidadeMadeira(nomeCientifico) {
  if (!nomeCientifico || typeof nomeCientifico !== "string") {
    return null;
  }

  const base = await carregarBaseDensidades();

  const nome = normalizarNomeCientifico(nomeCientifico);

  const especie = Object.keys(base.especies || {})
    .find(chave => chave.toLowerCase() === nome.toLowerCase());

  if (especie) {
    const registro = base.especies[especie];

    return {
      densidade: registro.densidade,
      nivel: "especie",
      nomeReferencia: especie,
      registros: registro.n
    };
  }

  const genero = nome.split(" ")[0];

  const generoEncontrado = Object.keys(base.generos || {})
    .find(chave => chave.toLowerCase() === genero.toLowerCase());

  if (generoEncontrado) {
    const registro = base.generos[generoEncontrado];

    return {
      densidade: registro.densidade,
      nivel: "genero",
      nomeReferencia: generoEncontrado,
      registros: registro.n
    };
  }

  return null;
}

/*
 * TreeMap-ITE
 * Normalização de nomes científicos
 *
 * Permite reconhecer sinônimos taxonômicos
 * utilizados pelo PlantNet.
 */

const SINONIMOS_CIENTIFICOS = {
  "chrysalidocarpus lutescens": "Dypsis lutescens"
};

function normalizarNomeCientifico(nome) {
  if (!nome || typeof nome !== "string") {
    return "";
  }

  // Remove autores científicos, quando presentes.
  const partes = nome.trim().split(/\s+/);

  const nomeBinomial = partes
    .slice(0, 2)
    .join(" ")
    .toLowerCase();

  return SINONIMOS_CIENTIFICOS[nomeBinomial]
    || partes.slice(0, 2).join(" ");
}

/*
 * Identificação complementar de palmeiras.
 * Usada quando a GWDD não possui a família
 * ou o nome científico correspondente.
 */

const GENEROS_PALMEIRAS = new Set([
  "chrysalidocarpus",
  "dypsis",
  "syagrus",
  "areca",
  "cocos",
  "phoenix",
  "washingtonia",
  "roystonea",
  "archontophoenix",
  "livistona",
  "bactris",
  "euterpe",
  "attalea",
  "butia",
  "acromia",
  "licuala",
  "raphia",
  "sabal"
]);

function identificarPalmeira(nomeCientifico) {
  const nome = normalizarNomeCientifico(nomeCientifico);

  if (!nome) return false;

  const genero = nome.split(/\s+/)[0].toLowerCase();

  return GENEROS_PALMEIRAS.has(genero);
}




