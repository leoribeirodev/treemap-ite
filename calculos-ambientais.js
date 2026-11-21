
/*
 * TreeMap-ITE
 * Validação de dados para cálculos ambientais
 *
 * Abordagem científica conservadora.
 * Nenhum cálculo é realizado com medidas
 * sem confirmação de origem.
 */

function validarDadosAmbientais(arvore) {

  if (!arvore || typeof arvore !== "object") {
    return {
      valido: false,
      motivo: "Dados da árvore indisponíveis."
    };
  }

  // 1. Verificar identificação científica
  const dadosEspecie = buscarDadosAmbientais(
    arvore.nomeCientifico
  );

  if (!dadosEspecie) {
    return {
      valido: false,
      motivo: "Espécie sem cadastro científico validado."
    };
  }

  // 2. Verificar medidas
  const altura = arvore.altura;
  const circunferencia = arvore.circunferencia;

  if (
    typeof altura !== "number" ||
    !Number.isFinite(altura) ||
    altura <= 0
  ) {
    return {
      valido: false,
      motivo: "Altura total não informada ou inválida."
    };
  }

  if (
    typeof circunferencia !== "number" ||
    !Number.isFinite(circunferencia) ||
    circunferencia <= 0
  ) {
    return {
      valido: false,
      motivo: "Circunferência não informada ou inválida."
    };
  }

  // 3. Confirmar medição a 1,30 m
  if (arvore.circunferenciaConfirmada130 !== true) {
    return {
      valido: false,
      motivo: "Circunferência não confirmada a 1,30 m do solo."
    };
  }

  // 4. Validar densidade da madeira
  if (
    typeof dadosEspecie.densidadeMadeira !== "number" ||
    !Number.isFinite(dadosEspecie.densidadeMadeira) ||
    dadosEspecie.densidadeMadeira <= 0
  ) {
    return {
      valido: false,
      motivo: "Densidade da madeira não validada."
    };
  }

  // 5. Verificar modelo científico
  if (!dadosEspecie.modeloAlometrico) {
    return {
      valido: false,
      motivo: "Modelo alométrico ainda não validado."
    };
  }

  return {
    valido: true,
    motivo: null,
    dadosEspecie: dadosEspecie
  };
}


/*
 * TreeMap-ITE
 * Estimativa de biomassa aérea e carbono
 *
 * Modelo de Chave et al. (2014)
 * Aplicação exploratória a árvores lenhosas.
 */

async function calcularImpactoAmbiental(
  nomeCientifico,
  circunferenciaCm,
  alturaM
) {
  // Verificar medidas
  if (
    !Number.isFinite(circunferenciaCm) ||
    !Number.isFinite(alturaM) ||
    circunferenciaCm <= 0 ||
    alturaM <= 0
  ) {
    return {
      disponivel: false,
      motivo: "Medidas ausentes ou inválidas."
    };
  }

  // Consultar a densidade científica
  
  // Proteção complementar para palmeiras
  if (identificarPalmeira(nomeCientifico)) {
  return {
    disponivel: false,
    motivo: "Palmeira: modelo específico necessário."
  };
}

  // Palmeiras exigem um modelo específico.
  // Por enquanto, não calcular para a família Arecaceae.
  const base = await carregarBaseDensidades();

  const nomeNormalizado = normalizarNomeCientifico(
  nomeCientifico
  ).toLowerCase();

  const chaveEspecie = Object.keys(base.especies || {})
    .find(nome => nome.toLowerCase() === nomeNormalizado);

  
  const genero = nomeNormalizado.split(/\s+/)[0];

  const chaveGenero = Object.keys(base.generos || {})
    .find(nome => nome.toLowerCase() === genero.toLowerCase());

  const familia = chaveEspecie
    ? base.especies[chaveEspecie].familia
    : chaveGenero
      ? base.generos[chaveGenero].familia
      : null;

if (!familia) {
  return {
    disponivel: false,
    motivo: "Família botânica não identificada."
  };
}

if (familia.toLowerCase() === "arecaceae") {
  return {
    disponivel: false,
    motivo: "Palmeira: modelo específico necessário."
  };
}
  const dados = await buscarDensidadeMadeira(nomeCientifico);

  if (!dados || !Number.isFinite(dados.densidade)) {
    return {
      disponivel: false,
      motivo: "Densidade da madeira indisponível."
    };
  }


  // Converter circunferência em DAP
  const dapCm = circunferenciaCm / Math.PI;

  // Biomassa aérea seca (kg)
  const biomassaKg = 0.0673 * Math.pow(
    dados.densidade * dapCm ** 2 * alturaM,
    0.976
  );

  // Carbono estimado (kg)
  const carbonoKg = biomassaKg * 0.47;

  // CO2 equivalente (kg)
  const co2Kg = carbonoKg * (44 / 12);

  return {
    disponivel: true,
    biomassaKg,
    carbonoKg,
    co2Kg,
    dapCm,
    densidade: dados.densidade,
    nivelReferencia: dados.nivel,
    metodologia: "Chave et al. (2014)"
  };
}

