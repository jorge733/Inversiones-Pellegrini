// Arma el sitio publicable en public/ a partir de la plantilla (sitio/index.html)
// y del contenido editable (datos/sitio.json).
//
// Vercel lo ejecuta en cada publicación (ver vercel.json). En el computador: npm run build
//
// En la plantilla:
//   {{seccion.campo}}   se reemplaza por el texto del campo, con los caracteres HTML escapados.
//   <!--@BLOQUE-->      se reemplaza por HTML generado aquí (tarjetas, canales de contacto, etc.).

const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const ORIGEN = path.join(RAIZ, "sitio");
const DESTINO = path.join(RAIZ, "public");
const DATOS = path.join(RAIZ, "datos", "sitio.json");

const ICONOS = {
  grafico: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
  escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  edificio: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
  maletin: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  moneda: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6v2M12 16v2"/>'
};

const WHATSAPP_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.4z"/></svg>';

function escapar(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function valor(datos, ruta) {
  return ruta.split(".").reduce((o, k) => (o == null ? undefined : o[k]), datos);
}

// Solo dígitos, para armar el enlace https://wa.me/56912345678
function numeroWhatsapp(texto) {
  return String(texto || "").replace(/\D/g, "");
}

function urlSegura(texto) {
  const url = String(texto || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

// Si la descripción tiene varias líneas, la primera se muestra como subtítulo en negrita.
function descripcionTarjeta(texto) {
  const lineas = String(texto || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lineas.length < 2) return escapar(lineas[0] || "");
  return `<strong class="card-sub">${escapar(lineas[0])}</strong>` + lineas.slice(1).map(escapar).join("<br>");
}

function tarjetas(datos) {
  return (datos.oportunidades.tarjetas || []).map((t) => `        <article class="card">
          <div class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICONOS[t.icono] || ICONOS.grafico}</svg></div>
          <h3>${escapar(t.titulo)}</h3>
          <p>${descripcionTarjeta(t.descripcion)}</p>
          <a href="#contacto" class="link" data-motivo="${escapar(t.titulo)}">Consultar →</a>
        </article>`).join("\n");
}

// Texto en párrafos: una línea en blanco separa párrafos; un salto simple se respeta como salto de línea.
function parrafos(texto, sangria) {
  return String(texto || "").split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `${sangria}<p>${p.split(/\r?\n/).map(escapar).join("<br>")}</p>`).join("\n");
}

const CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function puntos(datos) {
  return ((datos.porQue && datos.porQue.puntos) || []).map((p) =>
    `          <li><span class="chk">${CHECK_SVG}</span><span><strong>${escapar(p.titulo)}:</strong> ${escapar(p.texto)}</span></li>`
  ).join("\n");
}

function canales(datos) {
  const c = datos.contacto || {};
  const lista = [];
  const wa = numeroWhatsapp(c.whatsapp);
  // Mientras no se ingresen WhatsApp y correo en el panel, se muestran como pendientes.
  lista.push(wa
    ? `<a class="channel" href="https://wa.me/${wa}" target="_blank" rel="noopener"><b>WhatsApp</b><small>${escapar(c.whatsapp)}</small></a>`
    : `<a class="channel" href="#contacto"><b>WhatsApp</b><small class="todo">Por definir</small></a>`);
  lista.push(c.correo
    ? `<a class="channel" href="mailto:${escapar(c.correo)}"><b>Correo</b><small>${escapar(c.correo)}</small></a>`
    : `<a class="channel" href="#contacto"><b>Correo</b><small class="todo">Por definir</small></a>`);
  if (urlSegura(c.agenda)) lista.push(`<a class="channel" href="${escapar(urlSegura(c.agenda))}" target="_blank" rel="noopener"><b>Agendar reunión</b><small>Elige día y hora</small></a>`);
  if (urlSegura(c.linkedin)) lista.push(`<a class="channel" href="${escapar(urlSegura(c.linkedin))}" target="_blank" rel="noopener"><b>LinkedIn</b><small>Inversiones Pellegrini</small></a>`);
  if (urlSegura(c.instagram)) lista.push(`<a class="channel" href="${escapar(urlSegura(c.instagram))}" target="_blank" rel="noopener"><b>Instagram</b><small>Inversiones Pellegrini</small></a>`);
  return lista.map((l) => "          " + l).join("\n");
}

function motivos(datos) {
  return (datos.oportunidades.tarjetas || [])
    .map((t) => `            <option>${escapar(t.titulo)}</option>`).join("\n");
}

function botonWhatsapp(datos) {
  const wa = numeroWhatsapp(datos.contacto && datos.contacto.whatsapp);
  const destino = wa ? `href="https://wa.me/${wa}" target="_blank" rel="noopener"` : 'href="#contacto"';
  return `<a class="wa" ${destino} aria-label="Escribir por WhatsApp">\n  ${WHATSAPP_SVG}\n</a>`;
}

function renderizar(plantilla, datos) {
  const bloques = {
    TARJETAS: tarjetas(datos),
    PUNTOS: puntos(datos),
    QUIENES_TEXTO: parrafos(datos.quienes && datos.quienes.descripcion, "        ").trimStart(),
    CANALES: canales(datos),
    MOTIVOS: motivos(datos),
    BOTON_WHATSAPP: botonWhatsapp(datos)
  };
  const extra = { anio: new Date().getFullYear() };
  return plantilla
    .replace(/<!--@([A-Z_]+)-->/g, (m, nombre) => (nombre in bloques ? bloques[nombre] : m))
    .replace(/\{\{([a-zA-Z.]+)\}\}/g, (m, ruta) => {
      const v = ruta in extra ? extra[ruta] : valor(datos, ruta);
      if (v === undefined) throw new Error("Falta el campo «" + ruta + "» en datos/sitio.json");
      return escapar(v);
    });
}

function copiar(origen, destino) {
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    const o = path.join(origen, entrada.name);
    const d = path.join(destino, entrada.name);
    if (entrada.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copiar(o, d);
    } else if (!(origen === ORIGEN && entrada.name === "index.html")) {
      fs.copyFileSync(o, d);
    }
  }
}

function construir() {
  const datos = JSON.parse(fs.readFileSync(DATOS, "utf8"));
  const plantilla = fs.readFileSync(path.join(ORIGEN, "index.html"), "utf8");
  fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO, { recursive: true });
  copiar(ORIGEN, DESTINO);
  fs.writeFileSync(path.join(DESTINO, "index.html"), renderizar(plantilla, datos));
}

if (require.main === module) {
  construir();
  console.log("Sitio generado en public/");
}

module.exports = { construir, ICONOS };
