const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname.replace(/\.claude$/, "");
const port = 5173;

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(root, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Não encontrado");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": tipos[ext] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log("Servindo em http://localhost:" + port));
