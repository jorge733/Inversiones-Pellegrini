// Servidor para probar el sitio y el panel en el computador: npm run dev → http://localhost:3000
//
// Sirve public/ (lo genera al iniciar) y ejecuta las funciones de api/ igual que Vercel.
// Sin GITHUB_TOKEN, el panel guarda directamente en los archivos del proyecto y el sitio
// se vuelve a generar después de cada guardado.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { construir } = require("./construir");

const RAIZ = path.join(__dirname, "..");
const PUBLICO = path.join(RAIZ, "public");
const PUERTO = Number(process.env.PORT) || 3000;

// Variables de entorno desde .env (formato CLAVE=valor).
const archivoEnv = path.join(RAIZ, ".env");
if (fs.existsSync(archivoEnv)) {
  for (const linea of fs.readFileSync(archivoEnv, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon"
};

function adaptarRespuesta(res) {
  res.status = (codigo) => { res.statusCode = codigo; return res; };
  res.json = (objeto) => {
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(objeto));
    return res;
  };
  return res;
}

function leerCuerpo(req) {
  return new Promise((resolver) => {
    let datos = "";
    req.on("data", (trozo) => { datos += trozo; });
    req.on("end", () => {
      try { resolver(datos ? JSON.parse(datos) : {}); } catch (e) { resolver({}); }
    });
  });
}

async function atenderApi(req, res, url) {
  const nombre = url.pathname.replace(/^\/api\//, "").replace(/[^a-z0-9-]/gi, "");
  const archivo = path.join(RAIZ, "api", nombre + ".js");
  if (!fs.existsSync(archivo)) { res.statusCode = 404; return res.end("No encontrado"); }
  req.query = Object.fromEntries(url.searchParams);
  req.body = req.method === "POST" ? await leerCuerpo(req) : {};
  adaptarRespuesta(res);
  await require(archivo)(req, res);
  // Después de guardar desde el panel se vuelve a generar el sitio.
  if (nombre === "admin" && req.query.accion === "guardar" && res.statusCode === 200) construir();
}

function atenderArchivo(res, url) {
  let ruta = decodeURIComponent(url.pathname);
  if (ruta.endsWith("/")) ruta += "index.html";
  const archivo = path.normalize(path.join(PUBLICO, ruta));
  if (!archivo.startsWith(PUBLICO)) { res.statusCode = 403; return res.end(); }
  let destino = archivo;
  if (fs.existsSync(destino) && fs.statSync(destino).isDirectory()) destino = path.join(destino, "index.html");
  // Igual que cleanUrls en Vercel: /oportunidades sirve oportunidades.html
  if (!fs.existsSync(destino) && !path.extname(destino)) destino += ".html";
  if (!fs.existsSync(destino)) { res.statusCode = 404; return res.end("No encontrado"); }
  res.setHeader("Content-Type", TIPOS[path.extname(destino).toLowerCase()] || "application/octet-stream");
  fs.createReadStream(destino).pipe(res);
}

construir();
http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const tarea = url.pathname.startsWith("/api/") ? atenderApi(req, res, url) : Promise.resolve(atenderArchivo(res, url));
  tarea.catch((e) => {
    console.error(e);
    if (!res.headersSent) { res.statusCode = 500; res.end("Error interno"); }
  });
}).listen(PUERTO, () => console.log(`Sitio en http://localhost:${PUERTO}  ·  Panel en http://localhost:${PUERTO}/admin`));
