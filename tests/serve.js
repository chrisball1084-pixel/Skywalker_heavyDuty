// Winziger statischer Server, nur fuer die Sichtpruefung im Browser.
// Kein Teil der App — die laeuft ohne Server direkt von GitHub Pages.
const http = require("http"), fs = require("fs"), path = require("path");
const TYPEN = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
                ".json":"application/json; charset=utf-8", ".png":"image/png",
                ".webmanifest":"application/manifest+json" };
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const datei = path.join(process.cwd(), rel);
  if (!datei.startsWith(process.cwd())) { res.writeHead(403); return res.end("nope"); }
  fs.readFile(datei, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPEN[path.extname(datei)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(4173, () => console.log("Sichtprüfung läuft auf http://localhost:4173"));
