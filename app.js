// Instituto Ludus — lógica do formulário
// Troque esta constante na Fase 2, depois de publicar o Apps Script como app da web.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGno_9IJ-WPQbQulLmscOwiMMZvucJUsRbouwoy2kRG0lFNWlmTnj1pJHi_3901lOMGw/exec";

(function () {
  "use strict";

  const form = document.getElementById("form-ludus");
  const blocoFormulario = document.getElementById("bloco-formulario");
  const tituloFormulario = document.getElementById("titulo-formulario");
  const campoPerfil = document.getElementById("campo-perfil");
  const campoOrigem = document.getElementById("campo-origem");
  const botaoEnviar = document.getElementById("botao-enviar");
  const statusEnvio = document.getElementById("status-envio");
  const telaSucesso = document.getElementById("tela-sucesso");
  const sucessoEmail = document.getElementById("sucesso-email");
  const botaoNovaResposta = document.getElementById("botao-nova-resposta");

  const cartoes = document.querySelectorAll(".cartao-perfil");
  const secoes = {
    jovem: document.getElementById("secao-jovem"),
    doador: document.getElementById("secao-doador"),
    empresa: document.getElementById("secao-empresa"),
  };
  const titulos = {
    jovem: "Formulário — Sou jovem",
    doador: "Formulário — Quero doar",
    empresa: "Formulário — Sou empresa",
  };

  let perfilAtual = "";

  // ---------- Origem (utm_source) ----------
  const params = new URLSearchParams(window.location.search);
  campoOrigem.value = params.get("utm_source") || "direto";

  // ---------- Seleção de perfil ----------
  cartoes.forEach(function (cartao) {
    cartao.addEventListener("click", function () {
      selecionarPerfil(cartao.dataset.perfil);
    });
  });

  function selecionarPerfil(perfil) {
    perfilAtual = perfil;
    campoPerfil.value = perfil;

    cartoes.forEach(function (c) {
      const selecionado = c.dataset.perfil === perfil;
      c.classList.toggle("selecionado", selecionado);
      c.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    Object.keys(secoes).forEach(function (chave) {
      const ativa = chave === perfil;
      secoes[chave].hidden = !ativa;
    });

    tituloFormulario.textContent = titulos[perfil];
    blocoFormulario.classList.add("ativo");
    telaSucesso.classList.remove("ativa");
    form.style.display = "";

    window.requestAnimationFrame(function () {
      blocoFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ---------- Máscara de WhatsApp ----------
  const campoWhatsapp = document.getElementById("campo-whatsapp");
  campoWhatsapp.addEventListener("input", function () {
    let numeros = campoWhatsapp.value.replace(/\D/g, "").slice(0, 11);
    let formatado = numeros;
    if (numeros.length > 2) {
      formatado = "(" + numeros.slice(0, 2) + ") " + numeros.slice(2);
    }
    if (numeros.length > 7) {
      formatado = "(" + numeros.slice(0, 2) + ") " + numeros.slice(2, 7) + "-" + numeros.slice(7);
    }
    campoWhatsapp.value = formatado;
  });

  // ---------- Idade do jovem / responsável ----------
  const campoIdade = document.getElementById("jovem-idade");
  const mensagemForaIdade = document.getElementById("mensagem-fora-idade");
  const blocoResponsavel = document.getElementById("bloco-responsavel");

  campoIdade.addEventListener("input", function () {
    const idade = parseInt(campoIdade.value, 10);
    const foraDaFaixa = campoIdade.value !== "" && (isNaN(idade) || idade < 14 || idade > 24);
    mensagemForaIdade.classList.toggle("visivel", foraDaFaixa);

    const menorDeIdade = !isNaN(idade) && idade >= 14 && idade < 18;
    blocoResponsavel.hidden = !menorDeIdade;
  });

  // ---------- PCD: campo de adaptação ----------
  const camposPcd = document.querySelectorAll('input[name="jovemPcd"]');
  const campoAdaptacao = document.getElementById("campo-adaptacao");
  camposPcd.forEach(function (radio) {
    radio.addEventListener("change", function () {
      campoAdaptacao.hidden = radio.value !== "sim" || !radio.checked;
    });
  });

  // ---------- Validação ----------
  function limparErros() {
    document.querySelectorAll(".campo.com-erro").forEach(function (campo) {
      campo.classList.remove("com-erro");
    });
  }

  function marcarErro(elemento) {
    const campoPai = elemento.closest(".campo");
    if (campoPai) campoPai.classList.add("com-erro");
  }

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function validarTelefone(valor) {
    return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(valor);
  }

  function grupoMarcado(nome) {
    return document.querySelector('input[name="' + nome + '"]:checked');
  }

  function validarFormulario() {
    limparErros();
    let valido = true;

    // Comuns
    const nome = document.getElementById("campo-nome");
    if (!nome.value.trim()) { marcarErro(nome); valido = false; }

    const email = document.getElementById("campo-email");
    if (!validarEmail(email.value.trim())) { marcarErro(email); valido = false; }

    const whatsapp = document.getElementById("campo-whatsapp");
    if (whatsapp.value.trim() && !validarTelefone(whatsapp.value.trim())) { marcarErro(whatsapp); valido = false; }

    const comoConheceu = document.getElementById("campo-como-conheceu");
    if (!comoConheceu.value) { marcarErro(comoConheceu); valido = false; }

    if (perfilAtual === "jovem") {
      const idade = parseInt(campoIdade.value, 10);
      if (campoIdade.value === "" || isNaN(idade) || idade < 14 || idade > 24) {
        marcarErro(campoIdade); valido = false;
      }

      const cidade = document.getElementById("jovem-cidade");
      if (!cidade.value.trim()) { marcarErro(cidade); valido = false; }

      const escolaridade = document.getElementById("jovem-escolaridade");
      if (!escolaridade.value) { marcarErro(escolaridade); valido = false; }

      const trilha = document.getElementById("jovem-trilha");
      if (!trilha.value) { marcarErro(trilha); valido = false; }

      const equipamento = document.getElementById("jovem-equipamento");
      if (!equipamento.value) { marcarErro(equipamento); valido = false; }

      if (!isNaN(idade) && idade >= 14 && idade < 18) {
        const respNome = document.getElementById("resp-nome");
        if (!respNome.value.trim()) { marcarErro(respNome); valido = false; }

        const respEmail = document.getElementById("resp-email");
        if (!validarEmail(respEmail.value.trim())) { marcarErro(respEmail); valido = false; }

        const respTelefone = document.getElementById("resp-telefone");
        if (!validarTelefone(respTelefone.value.trim())) { marcarErro(respTelefone); valido = false; }

        const respAutorizacao = document.getElementById("resp-autorizacao");
        if (!respAutorizacao.checked) { marcarErro(respAutorizacao); valido = false; }
      }
    }

    if (perfilAtual === "doador") {
      if (!grupoMarcado("doadorNivel")) {
        marcarErro(document.getElementById("doador-torcida"));
        valido = false;
      }
    }

    if (perfilAtual === "empresa") {
      const empresaNome = document.getElementById("empresa-nome");
      if (!empresaNome.value.trim()) { marcarErro(empresaNome); valido = false; }

      const empresaCargo = document.getElementById("empresa-cargo");
      if (!empresaCargo.value.trim()) { marcarErro(empresaCargo); valido = false; }

      if (!grupoMarcado("empresaCota")) {
        marcarErro(document.getElementById("empresa-cota-apoiadora"));
        valido = false;
      }
    }

    const consentimento = document.getElementById("campo-consentimento");
    if (!consentimento.checked) { marcarErro(consentimento); valido = false; }

    if (!valido) {
      const primeiroErro = blocoFormulario.querySelector(".campo.com-erro");
      if (primeiroErro) primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return valido;
  }

  // ---------- Coleta dos dados ----------
  function coletarDados() {
    const dados = {
      perfil: perfilAtual,
      dataHora: new Date().toISOString(),
      origem: campoOrigem.value,
      nome: document.getElementById("campo-nome").value.trim(),
      email: document.getElementById("campo-email").value.trim(),
      whatsapp: document.getElementById("campo-whatsapp").value.trim(),
      comoConheceu: document.getElementById("campo-como-conheceu").value,
      consentimentoLgpd: document.getElementById("campo-consentimento").checked,
    };

    if (perfilAtual === "jovem") {
      const idade = parseInt(campoIdade.value, 10);
      Object.assign(dados, {
        idade: idade,
        cidadeBairro: document.getElementById("jovem-cidade").value.trim(),
        situacaoEscolar: document.getElementById("jovem-escolaridade").value,
        trilha: document.getElementById("jovem-trilha").value,
        jogos: document.getElementById("jovem-jogos").value.trim(),
        equipamento: document.getElementById("jovem-equipamento").value,
        cadunico: document.getElementById("jovem-cadunico").value,
        genero: document.getElementById("jovem-genero").value,
        pcd: (grupoMarcado("jovemPcd") || {}).value || "",
        pcdAdaptacao: document.getElementById("jovem-adaptacao").value.trim(),
        menorDeIdade: idade >= 14 && idade < 18,
        responsavelNome: document.getElementById("resp-nome").value.trim(),
        responsavelEmail: document.getElementById("resp-email").value.trim(),
        responsavelTelefone: document.getElementById("resp-telefone").value.trim(),
        responsavelAutorizacao: document.getElementById("resp-autorizacao").checked,
      });
    }

    if (perfilAtual === "doador") {
      Object.assign(dados, {
        nivelApoio: (grupoMarcado("doadorNivel") || {}).value || "",
        nomeNoMural: (grupoMarcado("doadorMural") || {}).value || "",
        trabalhaComMarketing: document.getElementById("doador-marketing").value,
        querRelatorioMensal: (grupoMarcado("doadorRelatorio") || {}).value || "sim",
      });
    }

    if (perfilAtual === "empresa") {
      Object.assign(dados, {
        empresaNome: document.getElementById("empresa-nome").value.trim(),
        cargo: document.getElementById("empresa-cargo").value.trim(),
        setor: document.getElementById("empresa-setor").value,
        numeroFuncionarios: document.getElementById("empresa-funcionarios").value,
        objetivo: document.getElementById("empresa-objetivo").value,
        cotaInteresse: (grupoMarcado("empresaCota") || {}).value || "",
        tributadaLucroReal: document.getElementById("empresa-lucro-real").value,
        melhorPeriodo: document.getElementById("empresa-periodo").value,
        linkedin: document.getElementById("empresa-linkedin").value.trim(),
      });
    }

    return dados;
  }

  // ---------- Envio ----------
  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!perfilAtual) return;

    // honeypot: se veio preenchido, finge sucesso e não envia nada
    const honeypot = document.getElementById("campo-site").value;
    if (honeypot) {
      mostrarSucesso(document.getElementById("campo-email").value.trim());
      return;
    }

    if (!validarFormulario()) return;

    const dados = coletarDados();

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando seu kit...";
    statusEnvio.textContent = "";
    statusEnvio.classList.remove("erro");

    enviarParaAppsScript(dados)
      .then(function () {
        mostrarSucesso(dados.email);
      })
      .catch(function () {
        statusEnvio.textContent = "Não conseguimos confirmar o envio agora. Verifique sua internet e tente novamente.";
        statusEnvio.classList.add("erro");
      })
      .finally(function () {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = "Quero receber meu kit";
      });
  });

  function enviarParaAppsScript(dados) {
    // Fase 1 (sem Apps Script configurado ainda): simula o envio para testar a interface.
    if (!APPS_SCRIPT_URL) {
      return new Promise(function (resolve) {
        setTimeout(resolve, 700);
      });
    }

    // fetch com Content-Type text/plain evita preflight de CORS no Apps Script.
    // Se a resposta não puder ser lida (no-cors ou rede instável), consideramos
    // enviado quando a requisição em si não falhar.
    return fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(dados),
    }).then(function (resposta) {
      return resposta.text().catch(function () { return null; });
    });
  }

  function mostrarSucesso(email) {
    form.style.display = "none";
    sucessoEmail.textContent = email;
    telaSucesso.classList.add("ativa");
    window.requestAnimationFrame(function () {
      telaSucesso.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  botaoNovaResposta.addEventListener("click", function () {
    const nome = document.getElementById("campo-nome").value;
    const email = document.getElementById("campo-email").value;
    const whatsapp = document.getElementById("campo-whatsapp").value;

    form.reset();
    limparErros();
    mensagemForaIdade.classList.remove("visivel");
    blocoResponsavel.hidden = true;
    campoAdaptacao.hidden = true;

    document.getElementById("campo-nome").value = nome;
    document.getElementById("campo-email").value = email;
    document.getElementById("campo-whatsapp").value = whatsapp;

    telaSucesso.classList.remove("ativa");
    form.style.display = "";

    cartoes.forEach(function (c) {
      c.classList.remove("selecionado");
      c.setAttribute("aria-pressed", "false");
    });
    Object.values(secoes).forEach(function (s) { s.hidden = true; });
    blocoFormulario.classList.remove("ativo");
    perfilAtual = "";
    campoPerfil.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
