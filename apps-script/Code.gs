/**
 * Instituto Ludus — backend em Google Apps Script
 *
 * Este arquivo recebe o formulário do site (doPost), grava a resposta
 * numa aba da planilha (Jovens / Doadores / Empresas) e envia por
 * e-mail o PDF correspondente ao perfil escolhido.
 *
 * Veja o README.md do projeto para o passo a passo de como colar este
 * código na planilha e publicar como app da web.
 */

// IDs dos PDFs no Google Drive (pasta Faculdade > Instituto Ludus)
const ID_PDF = {
  jovem: '1hfpbwey0yxEL7Ah6uCJ8V5m1lXBuCpwB',
  doador: '1-7A2ErVN-IaxtwZtzB62FiLO7v3ElQkC',
  empresa: '1wgUUxHJEyxGGieLSGM4paXzrGg-5AlaN',
};

// Nome da aba da planilha para cada perfil
const NOME_ABA = {
  jovem: 'Jovens',
  doador: 'Doadores',
  empresa: 'Empresas',
};

// Assunto do e-mail para cada perfil
const ASSUNTO_EMAIL = {
  jovem: 'Bem-vindo(a) ao Instituto Ludus — seu kit chegou!',
  doador: 'Obrigado por apoiar o Instituto Ludus — seu kit chegou!',
  empresa: 'Instituto Ludus — sua cota e os próximos passos',
};

// Colunas de cada aba: [texto do cabeçalho, chave no JSON recebido]
const CABECALHOS = {
  jovem: [
    ['Carimbo (servidor)', '_carimboServidor'],
    ['Data/hora (navegador)', 'dataHora'],
    ['Origem', 'origem'],
    ['Nome', 'nome'],
    ['E-mail', 'email'],
    ['WhatsApp', 'whatsapp'],
    ['Como conheceu', 'comoConheceu'],
    ['Idade', 'idade'],
    ['Cidade/Bairro', 'cidadeBairro'],
    ['Situação escolar', 'situacaoEscolar'],
    ['Trilha', 'trilha'],
    ['Jogos', 'jogos'],
    ['Equipamento', 'equipamento'],
    ['CadÚnico', 'cadunico'],
    ['Gênero', 'genero'],
    ['PCD', 'pcd'],
    ['Adaptação PCD', 'pcdAdaptacao'],
    ['Menor de idade', 'menorDeIdade'],
    ['Nome responsável', 'responsavelNome'],
    ['E-mail responsável', 'responsavelEmail'],
    ['Telefone responsável', 'responsavelTelefone'],
    ['Autorização responsável', 'responsavelAutorizacao'],
    ['Consentimento LGPD', 'consentimentoLgpd'],
    ['Status e-mail', '_statusEmail'],
    ['Erro e-mail', '_erroEmail'],
  ],
  doador: [
    ['Carimbo (servidor)', '_carimboServidor'],
    ['Data/hora (navegador)', 'dataHora'],
    ['Origem', 'origem'],
    ['Nome', 'nome'],
    ['E-mail', 'email'],
    ['WhatsApp', 'whatsapp'],
    ['Como conheceu', 'comoConheceu'],
    ['Nível de apoio', 'nivelApoio'],
    ['Nome no mural', 'nomeNoMural'],
    ['Trabalha com marketing/dados', 'trabalhaComMarketing'],
    ['Quer relatório mensal', 'querRelatorioMensal'],
    ['Consentimento LGPD', 'consentimentoLgpd'],
    ['Status e-mail', '_statusEmail'],
    ['Erro e-mail', '_erroEmail'],
  ],
  empresa: [
    ['Carimbo (servidor)', '_carimboServidor'],
    ['Data/hora (navegador)', 'dataHora'],
    ['Origem', 'origem'],
    ['Nome', 'nome'],
    ['E-mail', 'email'],
    ['WhatsApp', 'whatsapp'],
    ['Como conheceu', 'comoConheceu'],
    ['Nome da empresa', 'empresaNome'],
    ['Cargo', 'cargo'],
    ['Setor', 'setor'],
    ['Nº de funcionários', 'numeroFuncionarios'],
    ['Objetivo', 'objetivo'],
    ['Cota de interesse', 'cotaInteresse'],
    ['Tributada pelo lucro real', 'tributadaLucroReal'],
    ['Melhor período', 'melhorPeriodo'],
    ['LinkedIn', 'linkedin'],
    ['Consentimento LGPD', 'consentimentoLgpd'],
    ['Status e-mail', '_statusEmail'],
    ['Erro e-mail', '_erroEmail'],
  ],
};

/**
 * Ponto de entrada: toda vez que o site envia o formulário (fetch POST),
 * o Google chama esta função.
 */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    // Honeypot: se o campo "site" veio preenchido, é robô. Descarta
    // em silêncio e responde sucesso, sem gravar nem enviar nada.
    if (dados.site) {
      return respostaJson({ ok: true });
    }

    const perfil = dados.perfil;
    if (!perfil || !NOME_ABA[perfil]) {
      return respostaJson({ ok: false, erro: 'Perfil inválido.' });
    }

    const aba = obterOuCriarAba(perfil);
    const linhaIndice = aba.getLastRow() + 1;
    const cabecalhos = CABECALHOS[perfil];

    dados._carimboServidor = new Date();
    aba.getRange(linhaIndice, 1, 1, cabecalhos.length)
      .setValues([montarLinha(cabecalhos, dados)]);

    const resultadoEmail = enviarEmailKit(perfil, dados);

    const colunaStatus = cabecalhos.findIndex((c) => c[1] === '_statusEmail') + 1;
    const colunaErro = cabecalhos.findIndex((c) => c[1] === '_erroEmail') + 1;
    aba.getRange(linhaIndice, colunaStatus).setValue(resultadoEmail.ok ? 'enviado' : 'erro');
    aba.getRange(linhaIndice, colunaErro).setValue(resultadoEmail.erro || '');

    registrarCotaRestante();

    if (!resultadoEmail.ok) {
      return respostaJson({ ok: false, erro: resultadoEmail.erro });
    }
    return respostaJson({ ok: true });
  } catch (erro) {
    return respostaJson({ ok: false, erro: String(erro) });
  }
}

/** Monta a linha da planilha na mesma ordem dos cabeçalhos. */
function montarLinha(cabecalhos, dados) {
  return cabecalhos.map(function (par) {
    const chave = par[1];
    const valor = dados[chave];
    return valor === undefined || valor === null ? '' : valor;
  });
}

/** Pega a aba do perfil; cria com o cabeçalho se ainda não existir. */
function obterOuCriarAba(perfil) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const nome = NOME_ABA[perfil];
  let aba = planilha.getSheetByName(nome);

  if (!aba) {
    aba = planilha.insertSheet(nome);
    const titulos = CABECALHOS[perfil].map((c) => c[0]);
    aba.getRange(1, 1, 1, titulos.length).setValues([titulos]);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, titulos.length).setFontWeight('bold');
  }

  return aba;
}

/** Envia o e-mail do kit com o PDF do perfil anexado. */
function enviarEmailKit(perfil, dados) {
  try {
    const pdf = DriveApp.getFileById(ID_PDF[perfil]).getBlob();

    const destinatarios = [dados.email];
    if (perfil === 'jovem' && dados.menorDeIdade && dados.responsavelEmail) {
      destinatarios.push(dados.responsavelEmail);
    }

    GmailApp.sendEmail(destinatarios.join(','), ASSUNTO_EMAIL[perfil], textoAlternativo(perfil), {
      htmlBody: montarCorpoEmail(perfil, dados),
      attachments: [pdf],
      name: 'Instituto Ludus',
    });

    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: String(erro) };
  }
}

/** Texto simples, usado como alternativa para quem não vê HTML. */
function textoAlternativo(perfil) {
  return 'Instituto Ludus — Onde todo jogo vira oportunidade. ' +
    'O seu kit em PDF está anexado a este e-mail. ' +
    'Trabalho acadêmico. Instituto fictício.';
}

/** HTML do e-mail, com as cores do Ludus e o texto de cada perfil. */
function montarCorpoEmail(perfil, dados) {
  const azulMarinho = '#0B1F4B';
  const azul = '#5B9BFF';
  const azulClaro = '#EAF1FF';

  let titulo = '';
  let corpo = '';

  if (perfil === 'jovem') {
    titulo = 'Você entrou no time, ' + primeiroNome(dados.nome) + '!';
    corpo =
      '<p>Que bom ter você no Instituto Ludus! A partir de agora você tem um caminho com fases claras ' +
      'até a sua primeira oportunidade na trilha <strong>' + (dados.trilha || '') + '</strong>.</p>' +
      '<p><strong>Próximos passos:</strong></p>' +
      '<ol>' +
      '<li>Leia o kit em anexo com calma — ele tem o seu plano de carreira completo.</li>' +
      '<li>Fique de olho no seu e-mail: em breve chamamos você para o diagnóstico de perfil.</li>' +
      '<li>Depois disso, você terá uma primeira conversa com o seu mentor.</li>' +
      '</ol>' +
      (dados.menorDeIdade
        ? '<p>Como você tem menos de 18 anos, enviamos este mesmo e-mail para o seu responsável.</p>'
        : '');
  } else if (perfil === 'doador') {
    titulo = 'Obrigado por apoiar o Ludus, ' + primeiroNome(dados.nome) + '!';
    corpo =
      '<p>Seu cadastro como doador(a) foi recebido. O kit em anexo mostra para onde vai cada real, ' +
      'os níveis de apoio e como acompanhar o impacto todo mês.</p>' +
      '<p><strong>Um aviso importante:</strong> o Instituto Ludus nunca pede doação por mensagem direta ' +
      '(WhatsApp, Instagram etc.). Qualquer cobrança feita assim não é oficial.</p>';
  } else {
    titulo = 'Obrigado pelo interesse, ' + primeiroNome(dados.nome) + '!';
    corpo =
      '<p>Recebemos o interesse da <strong>' + (dados.empresaNome || '') + '</strong> na cota ' +
      '<strong>' + (dados.cotaInteresse || 'a definir') + '</strong>.</p>' +
      '<p>O kit em anexo detalha as cotas de parceria e o que cada uma inclui. ' +
      'Vamos entrar em contato para agendar uma conversa de 20 minutos.</p>';
  }

  return (
    '<div style="font-family: Arial, sans-serif; color:#3A4A6B; max-width:560px; margin:0 auto;">' +
    '<div style="background:' + azulMarinho + '; padding:20px; border-radius:12px 12px 0 0;">' +
    '<h1 style="color:#fff; font-size:20px; margin:0;">' + titulo + '</h1>' +
    '</div>' +
    '<div style="background:' + azulClaro + '; padding:20px; border-radius:0 0 12px 12px;">' +
    corpo +
    '<p style="margin-top:24px; color:' + azulMarinho + '; font-weight:bold;">' +
    'Instituto Ludus · Onde todo jogo vira oportunidade</p>' +
    '<p style="font-size:12px; color:#3A4A6B;">Trabalho acadêmico. Instituto fictício.</p>' +
    '</div>' +
    '</div>'
  );
}

function primeiroNome(nomeCompleto) {
  return (nomeCompleto || '').trim().split(' ')[0] || '';
}

/**
 * Grava, numa aba "Controle", quantos e-mails ainda podem ser enviados
 * hoje por esta conta Gmail. O limite diário é do Google, não nosso —
 * esta célula é só para você acompanhar antes da apresentação.
 */
function registrarCotaRestante() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('Controle');

  if (!aba) {
    aba = planilha.insertSheet('Controle');
    aba.getRange('A1').setValue('Cota de e-mail restante hoje');
    aba.getRange('B1').setValue('Última atualização');
    aba.getRange('A1:B1').setFontWeight('bold');
  }

  aba.getRange('A2').setValue(MailApp.getRemainingDailyQuota());
  aba.getRange('B2').setValue(new Date());
}

function respostaJson(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Função só para você testar manualmente dentro do editor do Apps
 * Script (menu Executar), sem precisar do site. Veja o resultado em
 * "Execuções" no menu lateral.
 */
function testeManual() {
  const eventoFalso = {
    postData: {
      contents: JSON.stringify({
        perfil: 'jovem',
        dataHora: new Date().toISOString(),
        origem: 'teste-manual',
        nome: 'Teste da Silva',
        email: Session.getActiveUser().getEmail(),
        whatsapp: '(11) 90000-0000',
        comoConheceu: 'apresentacao',
        idade: 16,
        cidadeBairro: 'São Paulo',
        situacaoEscolar: 'cursando-medio',
        trilha: 'tech',
        jogos: 'Valorant',
        equipamento: 'so-celular',
        cadunico: 'nao-sei',
        genero: 'prefiro-nao-dizer',
        pcd: 'nao',
        pcdAdaptacao: '',
        menorDeIdade: true,
        responsavelNome: 'Responsável Teste',
        responsavelEmail: Session.getActiveUser().getEmail(),
        responsavelTelefone: '(11) 90000-0001',
        responsavelAutorizacao: true,
        consentimentoLgpd: true,
      }),
    },
  };

  const resultado = doPost(eventoFalso);
  Logger.log(resultado.getContent());
}
