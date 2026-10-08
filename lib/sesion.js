// Sesión del panel de administración (/admin).
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   SECRETO_SESION   Texto largo y aleatorio usado para firmar la cookie de sesión (mínimo 16 caracteres).
//   CLAVE_ADMIN      Contraseña del panel.

const crypto = require("crypto");

const COOKIE_ADMIN = "sesion_admin_pellegrini";
const DURACION_ADMIN = 60 * 60 * 8; // 8 horas

function secreto() {
  const s = process.env.SECRETO_SESION;
  if (!s || s.length < 16) throw new Error("Falta la variable de entorno SECRETO_SESION (mínimo 16 caracteres).");
  return s;
}

function firmar(valor) {
  return crypto.createHmac("sha256", secreto()).update("admin:" + valor).digest("base64url");
}

// Compara sin revelar información por el tiempo de respuesta.
function igualSeguro(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function claveAdminConfigurada() {
  return Boolean((process.env.CLAVE_ADMIN || "").trim());
}

function claveAdminValida(clave) {
  const configurada = (process.env.CLAVE_ADMIN || "").trim();
  if (!configurada || typeof clave !== "string") return false;
  return igualSeguro(clave.trim(), configurada);
}

function leerCookie(req, nombre) {
  for (const parte of String(req.headers.cookie || "").split(";")) {
    const [n, ...resto] = parte.trim().split("=");
    if (n === nombre) return resto.join("=");
  }
  return null;
}

// SameSite=Strict: el panel no acepta solicitudes que vengan desde otros sitios.
function crearCookieAdmin() {
  const expira = Math.floor(Date.now() / 1000) + DURACION_ADMIN;
  return `${COOKIE_ADMIN}=${expira}.${firmar(String(expira))}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${DURACION_ADMIN}`;
}

function borrarCookieAdmin() {
  return `${COOKIE_ADMIN}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
}

function sesionAdminValida(req) {
  const token = leerCookie(req, COOKIE_ADMIN);
  if (!token) return false;
  const [expira, firma] = token.split(".");
  if (!expira || !firma || Number(expira) < Date.now() / 1000) return false;
  try {
    return igualSeguro(firma, firmar(expira));
  } catch (e) {
    return false;
  }
}

// Diagnóstico: indica qué está configurado, sin mostrar valores.
function estadoConfiguracion() {
  return {
    secretoSesionConfigurado: (process.env.SECRETO_SESION || "").length >= 16,
    claveAdminConfigurada: claveAdminConfigurada(),
    githubConfigurado: Boolean(process.env.GITHUB_TOKEN),
    entorno: process.env.VERCEL_ENV || "local",
    // Versión publicada: el panel la compara con la de su último guardado.
    version: process.env.VERCEL_GIT_COMMIT_SHA || "local"
  };
}

module.exports = {
  claveAdminConfigurada, claveAdminValida,
  crearCookieAdmin, borrarCookieAdmin, sesionAdminValida,
  estadoConfiguracion
};
