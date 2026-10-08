// Límite de intentos fallidos de contraseña por dirección IP.
// Se guarda en memoria: cada instancia de la función en Vercel lleva su propia cuenta,
// por lo que el límite es aproximado, pero frena los intentos automáticos repetidos.

const MAX_FALLOS = 8;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos

const registro = new Map();

function ipDe(req) {
  const reenviada = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return reenviada || req.headers["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "desconocida";
}

function limpiar(ahora) {
  for (const [ip, r] of registro) if (ahora - r.desde > VENTANA_MS) registro.delete(ip);
}

// Devuelve los minutos que faltan para poder reintentar, o 0 si está permitido.
function bloqueado(req) {
  const ahora = Date.now();
  limpiar(ahora);
  const r = registro.get(ipDe(req));
  if (!r || r.fallos < MAX_FALLOS) return 0;
  return Math.ceil((VENTANA_MS - (ahora - r.desde)) / 60000);
}

function registrarFallo(req) {
  const ip = ipDe(req);
  const r = registro.get(ip);
  if (r) r.fallos += 1;
  else registro.set(ip, { fallos: 1, desde: Date.now() });
}

function registrarExito(req) {
  registro.delete(ipDe(req));
}

module.exports = { bloqueado, registrarFallo, registrarExito };
