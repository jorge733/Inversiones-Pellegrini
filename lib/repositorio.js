// Lectura y escritura del contenido del sitio desde el panel de administración.
//
// En Vercel, los cambios se guardan como un commit en el repositorio de GitHub; Vercel detecta
// el commit y vuelve a publicar el sitio en uno o dos minutos. Así cada cambio queda registrado
// en el historial y puede revertirse.
//
// Variables de entorno:
//   GITHUB_TOKEN   Token de GitHub con permiso de lectura y escritura de contenidos del repositorio.
//   GITHUB_REPO    (Opcional) "dueño/repositorio". Por defecto se usa el repositorio conectado a Vercel.
//   GITHUB_RAMA    (Opcional) Rama donde se guardan los cambios. Por defecto, la rama publicada o "main".
//
// En el computador (npm run dev, sin GITHUB_TOKEN), los cambios se escriben directamente en los
// archivos del proyecto.

const fs = require("fs");
const path = require("path");

const RAIZ = process.cwd();
const API = "https://api.github.com";

function usarGitHub() {
  return Boolean(process.env.GITHUB_TOKEN) || Boolean(process.env.VERCEL);
}

function configuracion() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Falta la variable de entorno GITHUB_TOKEN: el panel no puede guardar cambios.");
  const repo = process.env.GITHUB_REPO ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : "");
  if (!repo) throw new Error("No se pudo determinar el repositorio de GitHub (configure GITHUB_REPO).");
  const rama = process.env.GITHUB_RAMA || process.env.VERCEL_GIT_COMMIT_REF || "main";
  return { token, repo, rama };
}

async function github(metodo, ruta, cuerpo) {
  const { token } = configuracion();
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "panel-inversiones-pellegrini",
      ...(cuerpo ? { "Content-Type": "application/json" } : {})
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    const error = new Error(`GitHub respondió ${respuesta.status} en ${ruta}: ${detalle.slice(0, 300)}`);
    error.estado = respuesta.status;
    throw error;
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

function rutaSegura(ruta) {
  const normal = path.posix.normalize(String(ruta)).replace(/^\/+/, "");
  if (normal.startsWith("..") || normal.includes("/../")) throw new Error("Ruta no válida: " + ruta);
  return normal;
}

/* Lee un archivo de texto. Devuelve null si no existe. */
async function leerTexto(ruta) {
  ruta = rutaSegura(ruta);
  if (!usarGitHub()) {
    const archivo = path.join(RAIZ, ruta);
    return fs.existsSync(archivo) ? fs.readFileSync(archivo, "utf8") : null;
  }
  const { repo, rama } = configuracion();
  try {
    const datos = await github("GET", `/repos/${repo}/contents/${ruta.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(rama)}`);
    return Buffer.from(datos.content, "base64").toString("utf8");
  } catch (e) {
    if (e.estado === 404) return null;
    throw e;
  }
}

async function leerJSON(ruta, porDefecto) {
  const texto = await leerTexto(ruta);
  return texto === null ? porDefecto : JSON.parse(texto);
}

/*
  Guarda varios archivos en un solo cambio.
  archivos: [{ ruta, texto }] o [{ ruta, base64 }]
  Devuelve el identificador de la versión (commit) creada.
*/
async function guardar(archivos, mensaje) {
  archivos = archivos.map((a) => ({ ...a, ruta: rutaSegura(a.ruta) }));

  if (!usarGitHub()) {
    for (const a of archivos) {
      const destino = path.join(RAIZ, a.ruta);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, a.base64 !== undefined ? Buffer.from(a.base64, "base64") : a.texto);
    }
    return "local";
  }

  const { repo, rama } = configuracion();
  // Se reintenta una vez si otra persona guardó al mismo tiempo.
  for (let intento = 1; ; intento++) {
    try {
      const ref = await github("GET", `/repos/${repo}/git/ref/heads/${encodeURIComponent(rama)}`);
      const commitBase = await github("GET", `/repos/${repo}/git/commits/${ref.object.sha}`);
      const arbol = [];
      for (const a of archivos) {
        const blob = await github("POST", `/repos/${repo}/git/blobs`, {
          content: a.base64 !== undefined ? a.base64 : Buffer.from(a.texto, "utf8").toString("base64"),
          encoding: "base64"
        });
        arbol.push({ path: a.ruta, mode: "100644", type: "blob", sha: blob.sha });
      }
      const nuevoArbol = await github("POST", `/repos/${repo}/git/trees`, { base_tree: commitBase.tree.sha, tree: arbol });
      const commit = await github("POST", `/repos/${repo}/git/commits`, {
        message: mensaje,
        tree: nuevoArbol.sha,
        parents: [ref.object.sha]
      });
      await github("PATCH", `/repos/${repo}/git/refs/heads/${encodeURIComponent(rama)}`, { sha: commit.sha });
      return commit.sha;
    } catch (e) {
      if (intento < 2 && e.estado === 422) continue;
      throw e;
    }
  }
}

module.exports = { leerTexto, leerJSON, guardar, usarGitHub };
