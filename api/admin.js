// Panel de administración: una sola función con varias acciones (?accion=...).
//
//   POST entrar      { clave } Inicia sesión.
//   POST salir       Cierra la sesión.
//   GET  sesion      ¿Hay una sesión activa?
//   GET  contenido   El contenido editable (datos/sitio.json), leído desde el repositorio.
//   POST guardar     { datos, archivos } Guarda el contenido y, si hay, la foto nueva.

const repo = require("../lib/repositorio");
const sesion = require("../lib/sesion");
const { bloqueado, registrarFallo, registrarExito } = require("../lib/limite");

const RUTA_DATOS = "datos/sitio.json";
const ICONOS = ["grafico", "globo", "escudo", "casa", "edificio", "maletin", "moneda"];
const FOTO = /^img\/(subidas\/)?[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp)$/;
const ARCHIVO_PERMITIDO = /^sitio\/img\/subidas\/[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp)$/;
const FIRMAS = { jpg: [0xff, 0xd8, 0xff], jpeg: [0xff, 0xd8, 0xff], png: [0x89, 0x50, 0x4e, 0x47], webp: [0x52, 0x49, 0x46, 0x46] };
const MAX_BYTES_FOTO = 3 * 1024 * 1024;

function responderError(res, estado, mensaje) {
  return res.status(estado).json({ error: mensaje });
}

function cuerpoDe(req) {
  let cuerpo = req.body || {};
  if (typeof cuerpo === "string") {
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { cuerpo = {}; }
  }
  return cuerpo;
}

// Texto limpio y con largo máximo. "obligatorio" rechaza textos vacíos.
function texto(valor, nombre, max, obligatorio) {
  const t = String(valor == null ? "" : valor).replace(/\r\n/g, "\n").trim();
  if (obligatorio && !t) throw new Error(`El campo «${nombre}» no puede quedar vacío.`);
  if (t.length > max) throw new Error(`El campo «${nombre}» es demasiado largo (máximo ${max} caracteres).`);
  return t;
}

function url(valor, nombre) {
  const t = texto(valor, nombre, 300, false);
  if (t && !/^https:\/\/[^\s]+$/i.test(t)) throw new Error(`«${nombre}» debe ser un enlace que comience con https://`);
  return t;
}

// Reconstruye el contenido campo por campo: solo se guarda lo que el sitio usa.
function validarDatos(d) {
  if (!d || typeof d !== "object") throw new Error("El contenido no tiene el formato esperado.");
  const s = (k) => (d[k] && typeof d[k] === "object" ? d[k] : {});
  const op = s("oportunidades");
  const tarjetas = Array.isArray(op.tarjetas) ? op.tarjetas : [];
  if (tarjetas.length < 1 || tarjetas.length > 8) throw new Error("Debe haber entre 1 y 8 tarjetas de oportunidades.");
  const correo = texto(s("contacto").correo, "Correo", 120, false);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error("El correo no tiene un formato válido.");
  const foto = texto(s("quienes").foto, "Foto", 120, true);
  if (!FOTO.test(foto)) throw new Error("La ruta de la foto no es válida.");

  return {
    bienvenida: {
      titulo: texto(s("bienvenida").titulo, "Título de bienvenida", 120, true),
      texto: texto(s("bienvenida").texto, "Texto de bienvenida", 400, true),
      boton: texto(s("bienvenida").boton, "Texto del botón", 40, true)
    },
    oportunidades: {
      titulo: texto(op.titulo, "Título de oportunidades", 120, true),
      subtitulo: texto(op.subtitulo, "Subtítulo de oportunidades", 300, false),
      tarjetas: tarjetas.map((t, i) => ({
        icono: ICONOS.includes(t && t.icono) ? t.icono : "grafico",
        titulo: texto(t && t.titulo, `Tarjeta ${i + 1}: título`, 80, true),
        descripcion: texto(t && t.descripcion, `Tarjeta ${i + 1}: descripción`, 700, true)
      })),
      aviso: texto(op.aviso, "Aviso legal de oportunidades", 600, false)
    },
    porQue: {
      etiqueta: texto(s("porQue").etiqueta, "Etiqueta", 60, false),
      titulo: texto(s("porQue").titulo, "Título", 160, true),
      texto: texto(s("porQue").texto, "Texto", 1200, true)
    },
    quienes: {
      nombre: texto(s("quienes").nombre, "Nombre", 80, true),
      descripcion: texto(s("quienes").descripcion, "Descripción", 1200, true),
      foto
    },
    llamado: {
      titulo: texto(s("llamado").titulo, "Título de la franja final", 160, true)
    },
    contacto: {
      titulo: texto(s("contacto").titulo, "Título de contacto", 120, true),
      texto: texto(s("contacto").texto, "Texto de contacto", 400, false),
      whatsapp: texto(s("contacto").whatsapp, "WhatsApp", 30, false),
      correo,
      agenda: url(s("contacto").agenda, "Enlace para agendar"),
      linkedin: url(s("contacto").linkedin, "LinkedIn"),
      instagram: url(s("contacto").instagram, "Instagram")
    },
    pie: {
      aviso: texto(s("pie").aviso, "Aviso del pie de página", 600, false)
    }
  };
}

function validarArchivo(a) {
  if (!a || typeof a.ruta !== "string" || typeof a.base64 !== "string") throw new Error("Archivo con formato no válido.");
  if (!ARCHIVO_PERMITIDO.test(a.ruta)) throw new Error("No se permite guardar el archivo " + a.ruta + ".");
  const datos = Buffer.from(a.base64, "base64");
  if (!datos.length) throw new Error("La imagen está vacía.");
  if (datos.length > MAX_BYTES_FOTO) throw new Error("La imagen es demasiado pesada (máximo 3 MB).");
  const firma = FIRMAS[a.ruta.split(".").pop()];
  if (!firma.every((byte, i) => datos[i] === byte)) throw new Error("El archivo no es una imagen válida.");
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const accion = String((req.query && req.query.accion) || "");
  const cuerpo = cuerpoDe(req);

  try {
    /* ---------- Sin sesión ---------- */
    if (accion === "entrar") {
      if (req.method !== "POST") return responderError(res, 405, "Método no permitido");
      if (!sesion.claveAdminConfigurada()) {
        return responderError(res, 500, "El panel no está configurado (falta la variable CLAVE_ADMIN).");
      }
      const minutos = bloqueado(req);
      if (minutos > 0) return responderError(res, 429, `Demasiados intentos fallidos. Intente nuevamente en ${minutos} minuto${minutos === 1 ? "" : "s"}.`);
      if (!sesion.claveAdminValida(cuerpo.clave)) {
        registrarFallo(req);
        await new Promise((r) => setTimeout(r, 800));
        return responderError(res, 401, "La contraseña no es correcta.");
      }
      registrarExito(req);
      res.setHeader("Set-Cookie", sesion.crearCookieAdmin());
      return res.status(200).json({ ok: true });
    }

    if (accion === "salir") {
      res.setHeader("Set-Cookie", sesion.borrarCookieAdmin());
      return res.status(200).json({ ok: true });
    }

    /* ---------- Con sesión ---------- */
    if (!sesion.sesionAdminValida(req)) return responderError(res, 401, "Sesión no válida o vencida. Vuelva a ingresar.");

    if (accion === "sesion") return res.status(200).json({ ok: true });

    if (accion === "contenido") {
      const datos = await repo.leerJSON(RUTA_DATOS, null);
      if (!datos) return responderError(res, 500, "No se encontró el archivo de contenido.");
      return res.status(200).json({ datos, iconos: ICONOS });
    }

    if (accion === "guardar") {
      if (req.method !== "POST") return responderError(res, 405, "Método no permitido");
      const archivos = Array.isArray(cuerpo.archivos) ? cuerpo.archivos : [];
      if (archivos.length > 1) return responderError(res, 400, "Solo se puede subir una imagen a la vez.");
      archivos.forEach(validarArchivo);
      const datos = validarDatos(cuerpo.datos);
      if (archivos.length && "sitio/" + datos.quienes.foto !== archivos[0].ruta) {
        return responderError(res, 400, "La foto subida no coincide con la del contenido.");
      }
      const cambios = archivos.map((a) => ({ ruta: a.ruta, base64: a.base64 }));
      cambios.push({ ruta: RUTA_DATOS, texto: JSON.stringify(datos, null, 2) + "\n" });
      const version = await repo.guardar(cambios, "Panel: actualiza el contenido del sitio");
      return res.status(200).json({ ok: true, version, datos });
    }

    return responderError(res, 400, "Acción desconocida.");
  } catch (e) {
    console.error(e);
    // Los errores de validación se muestran tal cual; los de GitHub, con un mensaje general.
    const mensaje = e.estado ? "No se pudo guardar en el repositorio. Intente nuevamente en unos minutos." : e.message;
    return responderError(res, e.estado ? 502 : 400, mensaje);
  }
};
