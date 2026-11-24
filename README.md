# Instituto Ludus — site (A3 Marketing de Conteúdo)

Site de página única para o Instituto Ludus (ONG fictícia, trabalho acadêmico da Anhembi
Morumbi). A pessoa escolhe um perfil (Jovem, Doador ou Empresa), preenche o formulário,
os dados vão para uma planilha Google e ela recebe por e-mail o kit em PDF do perfil
escolhido. Custo zero: HTML/CSS/JS puro + Google Apps Script + Google Sheets.

**Site publicado:** https://instituto-ludus.netlify.app
**Repositório:** https://github.com/pedro-fariasz/instituto-ludus

## Estrutura

```
index.html          página principal (cartões + formulários)
styles.css          identidade visual do Ludus
app.js              lógica do formulário e envio ao Apps Script
privacidade.html    política de privacidade
assets/             favicon / logo em SVG
apps-script/Code.gs backend (planilha + e-mail com o PDF do kit)
```

## 1. Criar a planilha e o Apps Script

1. Em [sheets.google.com](https://sheets.google.com), crie uma planilha em branco (use a
   conta `ludusinstituto@gmail.com`, ou a que você quiser que fique dona dos dados).
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo de `Código.gs` e cole todo o conteúdo de
   [`apps-script/Code.gs`](apps-script/Code.gs) deste repositório. Salve (`Ctrl+S`).
4. Selecione a função `testeManual` no menu suspenso ao lado de "Executar" e clique em
   **Executar**. O Google vai pedir autorização — aceite os avisos ("App não verificado" é
   normal) e permita o acesso ao Gmail e ao Drive.
   - Se dar erro de "Nenhum item com o ID fornecido foi encontrado", é porque os 3 PDFs
     dos kits (no Drive) não estão compartilhados com a conta que está rodando o script.
     Compartilhe a pasta dos kits com essa conta (acesso de leitor).
5. Confira: deve ter aparecido a aba **"Jovens"** na planilha e chegado um e-mail de teste
   com o Kit do Jovem anexado.

## 2. Publicar como app da web

1. No editor do Apps Script: **Implantar → Nova implantação**.
2. Ícone de engrenagem → tipo **App da Web**.
3. **Executar como:** Eu. **Quem pode acessar:** Qualquer pessoa.
4. Clique em **Implantar**, autorize se pedir, e copie a **URL do app da Web** (termina em
   `/exec`).

## 3. Ligar o site ao Apps Script

Abra [`app.js`](app.js) e troque a primeira linha:

```js
const APPS_SCRIPT_URL = "COLE_AQUI_A_URL_DO_SEU_APP_DA_WEB";
```

## 4. Testar no computador

Sem instalar nada, com Node.js (já vem no Windows com o `node`):

```powershell
cd "caminho\para\instituto-ludus"
node .claude\dev-server.js
```

Abra `http://localhost:5173` no navegador e teste os três perfis.

## 5. Subir para o GitHub e publicar no Netlify

Já está feito neste projeto:

- Repositório no GitHub: `pedro-fariasz/instituto-ludus` (branch `master`).
- No [Netlify](https://app.netlify.com): **Import a Git repository → GitHub** → selecione
  o repositório → **Build command** e **Publish directory** em branco (site estático, sem
  build) → Deploy.
- Toda vez que você der `git push` no repositório, o Netlify publica a nova versão
  automaticamente.

Para repetir do zero (outro projeto, por exemplo): `git init`, `git add -A`,
`git commit`, `gh repo create <nome> --public --source=. --push`, depois importar no
Netlify do mesmo jeito.

## 6. Gerar o QR Code

O ambiente de automação usado para montar este projeto bloqueia instalar ou baixar
bibliotecas externas (política de segurança), então o QR Code não pôde ser gerado aqui
dentro. É rápido fazer manualmente:

1. Use um gerador gratuito, por exemplo [qrcode-monkey.com](https://www.qrcode-monkey.com/)
   ou o gerador do Canva.
2. Cole este link (já com o parâmetro de origem da apresentação):

   ```
   https://instituto-ludus.netlify.app/?utm_source=apresentacao
   ```

3. Nas cores: fundo branco, QR na cor `#0B1F4B` (azul-marinho). Baixe em alta resolução
   (PNG, 1000px ou mais) e salve como `assets/qrcode.png`.

## 7. Checklist antes da apresentação

- [ ] Enviar um formulário de cada perfil (Jovem, Doador, Empresa) pelo site publicado.
- [ ] Conferir que chegaram os 3 e-mails, cada um com o PDF do kit certo anexado.
- [ ] Conferir as 3 abas da planilha (Jovens, Doadores, Empresas) com as linhas certas e
      `status_email = enviado`.
- [ ] Testar o envio de um jovem **menor de 18 anos** e confirmar que o e-mail também
      chegou para o responsável.
- [ ] Abrir o site pelo celular (QR Code) e conferir que os cartões e formulários ficam
      fáceis de tocar.
- [ ] Conferir a cota de e-mail restante na aba "Controle" da planilha
      (`MailApp.getRemainingDailyQuota()`), para não estourar o limite diário do Gmail no
      dia da apresentação.
