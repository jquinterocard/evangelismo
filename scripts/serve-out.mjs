// Servidor estático mínimo para probar out/ localmente (respeta NEXT_PUBLIC_BASE_PATH).
// Uso: npm start  (PORT=3000 por defecto)
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.env.PORT) || 3000;
const raw = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const basePath = raw && raw !== "/" ? `/${raw.replace(/^\/+|\/+$/g, "")}` : "";
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (basePath) {
    if (path === basePath) path = `${basePath}/`;
    if (!path.startsWith(`${basePath}/`)) {
      res.writeHead(302, { Location: `${basePath}/` }).end();
      return;
    }
    path = path.slice(basePath.length);
  }
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404, { "Content-Type": types[".html"] });
    return createReadStream(join(root, "404.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Sirviendo out/ en http://localhost:${port}${basePath}/`));
