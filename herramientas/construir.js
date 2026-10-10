// Arma el sitio publicable en public/ a partir de la base común (sitio/plantilla.html),
// las páginas (sitio/paginas/*.html) y el contenido editable (datos/sitio.json).
//
// Vercel lo ejecuta en cada publicación (ver vercel.json). En el computador: npm run build
//
// En las plantillas:
//   {{seccion.campo}}   se reemplaza por el texto del campo, con los caracteres HTML escapados.
//   <!--@BLOQUE-->      se reemplaza por HTML generado aquí (tarjetas, menú, canales de contacto, etc.).

const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const ORIGEN = path.join(RAIZ, "sitio");
const DESTINO = path.join(RAIZ, "public");
const DATOS = path.join(RAIZ, "datos", "sitio.json");

// Cada página del sitio. "salida" es el archivo en public/; con cleanUrls, /oportunidades sirve oportunidades.html.
const PAGINAS = [
  { id: "inicio", ruta: "/", salida: "index.html", menu: "Inicio", titulo: "Inversiones Pellegrini",
    descripcion: "Invertimos en el mercado nacional e internacional. Asesoría en inversiones con visión de mediano y largo plazo." },
  { id: "oportunidades", ruta: "/oportunidades", salida: "oportunidades.html", menu: "Oportunidades de inversión",
    titulo: "Oportunidades de inversión · Inversiones Pellegrini",
    descripcion: "Fondos con garantía inmobiliaria, fondos de deuda internacional, seguros de vida y leaseback." },
  { id: "por-que-elegirnos", ruta: "/por-que-elegirnos", salida: "por-que-elegirnos.html", menu: "Por qué elegirnos",
    titulo: "Por qué elegirnos · Inversiones Pellegrini",
    descripcion: "Oportunidades reales, activos reales e inversión con respaldo." },
  { id: "quienes-somos", ruta: "/quienes-somos", salida: "quienes-somos.html", menu: "Quiénes somos",
    titulo: "Quiénes somos · Inversiones Pellegrini",
    descripcion: "Conoce a Luciano Pellegrini y el enfoque de Inversiones Pellegrini." },
  { id: "contacto", ruta: "/contacto", salida: "contacto.html", menu: "Contacto", titulo: "Contacto · Inversiones Pellegrini",
    descripcion: "Conversemos sobre tus objetivos de inversión.", sinLlamado: true }
];

// Identificador para enlazar a cada tarjeta: "Inversión Nacional" → "inversion-nacional"
function slug(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function enlaceContacto(motivo) {
  return "/contacto?motivo=" + encodeURIComponent(motivo);
}

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

function icono(nombre, tamano) {
  return `<svg width="${tamano}" height="${tamano}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICONOS[nombre] || ICONOS.grafico}</svg>`;
}

function tarjetas(datos) {
  return (datos.oportunidades.tarjetas || []).map((t) => `        <article class="card" id="${slug(t.titulo)}">
          <div class="ico">${icono(t.icono, 22)}</div>
          <h3>${escapar(t.titulo)}</h3>
          <p>${descripcionTarjeta(t.descripcion)}</p>
          <a href="${escapar(enlaceContacto(t.titulo))}" class="link">Consultar →</a>
        </article>`).join("\n");
}

// En el inicio: resumen de las oportunidades, cada una enlazada a su tarjeta en /oportunidades.
function resumenOportunidades(datos) {
  const op = datos.oportunidades || {};
  const items = (op.tarjetas || []).map((t) => `        <a class="card mini" href="/oportunidades#${slug(t.titulo)}">
          <div class="ico">${icono(t.icono, 22)}</div>
          <h3>${escapar(t.titulo)}</h3>
          <span class="link">Ver detalle →</span>
        </a>`).join("\n");
  return `<section id="resumen">
    <div class="wrap">
      <div class="section-head">
        <h2>${escapar(op.titulo)}</h2>
        <p>${escapar(op.subtitulo)}</p>
      </div>
      <div class="grid resumen">
${items}
      </div>
      <p class="ver-todas"><a class="btn ghost" href="/oportunidades">Ver todas las oportunidades</a></p>
    </div>
  </section>`;
}

function menu(activa) {
  return PAGINAS.map((p) => `      <a href="${p.ruta}"${p.id === activa ? ' aria-current="page"' : ""}>${escapar(p.menu)}</a>`).join("\n");
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
    : `<span class="channel"><b>WhatsApp</b><small class="todo">Por definir</small></span>`);
  lista.push(c.correo
    ? `<a class="channel" href="mailto:${escapar(c.correo)}"><b>Correo</b><small>${escapar(c.correo)}</small></a>`
    : `<span class="channel"><b>Correo</b><small class="todo">Por definir</small></span>`);
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
  const destino = wa ? `href="https://wa.me/${wa}" target="_blank" rel="noopener"` : 'href="/contacto"';
  return `<a class="wa" ${destino} aria-label="Escribir por WhatsApp">\n  ${WHATSAPP_SVG}\n</a>`;
}

function renderizar(plantilla, datos, otros) {
  const bloques = {
    ...(otros || {}),
    TARJETAS: tarjetas(datos),
    RESUMEN_OPORTUNIDADES: resumenOportunidades(datos),
    PUNTOS: puntos(datos),
    QUIENES_TEXTO: parrafos(datos.quienes && datos.quienes.descripcion, "        ").trimStart(),
    CANALES: canales(datos),
    MOTIVOS: motivos(datos),
    BOTON_WHATSAPP: botonWhatsapp(datos)
  };
  const extra = { anio: new Date().getFullYear(), ...((otros && otros.extra) || {}) };
  delete bloques.extra;
  // 1) Se arma la plantilla completa (base + página); 2) se reemplazan los {{campos}};
  // 3) recién al final se insertan los bloques generados, para que el texto de los
  //    datos nunca se interprete como plantilla.
  const partes = { CONTENIDO: bloques.CONTENIDO || "", LLAMADO: bloques.LLAMADO || "" };
  return plantilla
    .replace(/<!--@(CONTENIDO|LLAMADO)-->/g, (m, nombre) => partes[nombre])
    .replace(/\{\{([a-zA-Z.]+)\}\}/g, (m, ruta) => {
      const v = ruta in extra ? extra[ruta] : valor(datos, ruta);
      if (v === undefined) throw new Error("Falta el campo «" + ruta + "» en datos/sitio.json");
      return escapar(v);
    })
    .replace(/<!--@([A-Z_]+)-->/g, (m, nombre) => (nombre in bloques ? bloques[nombre] : m));
}

function copiar(origen, destino) {
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    const o = path.join(origen, entrada.name);
    const d = path.join(destino, entrada.name);
    if (entrada.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copiar(o, d);
    } else {
      fs.copyFileSync(o, d);
    }
  }
}

// Archivos de sitio/ que son plantillas y no se publican tal cual.
const NO_COPIAR = new Set(["plantilla.html", "paginas"]);

function construir() {
  const datos = JSON.parse(fs.readFileSync(DATOS, "utf8"));
  const base = fs.readFileSync(path.join(ORIGEN, "plantilla.html"), "utf8");
  const llamado = fs.readFileSync(path.join(ORIGEN, "paginas", "_llamado.html"), "utf8");
  fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO, { recursive: true });
  for (const entrada of fs.readdirSync(ORIGEN, { withFileTypes: true })) {
    if (NO_COPIAR.has(entrada.name)) continue;
    const o = path.join(ORIGEN, entrada.name);
    const d = path.join(DESTINO, entrada.name);
    if (entrada.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copiar(o, d); }
    else fs.copyFileSync(o, d);
  }
  for (const p of PAGINAS) {
    const cuerpo = fs.readFileSync(path.join(ORIGEN, "paginas", p.id + ".html"), "utf8");
    const html = renderizar(base, datos, {
      CONTENIDO: cuerpo,
      LLAMADO: p.sinLlamado ? "" : llamado,
      MENU: menu(p.id),
      extra: { "pagina.titulo": p.titulo, "pagina.descripcion": p.descripcion }
    });
    fs.writeFileSync(path.join(DESTINO, p.salida), html);
  }
}

if (require.main === module) {
  construir();
  console.log("Sitio generado en public/");
}

module.exports = { construir, ICONOS };
