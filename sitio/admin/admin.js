// Panel de administración de Inversiones Pellegrini.
// Edita datos/sitio.json; al guardar, el servidor crea un commit en GitHub y Vercel vuelve a publicar.
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var ICONOS = {
    grafico: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    edificio: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
    maletin: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6v2M12 16v2"/>'
  };
  var NOMBRES_ICONOS = { grafico: "Gráfico", globo: "Globo", escudo: "Escudo", casa: "Casa", edificio: "Edificio", maletin: "Maletín", moneda: "Moneda" };

  // Secciones del panel y sus campos. "ruta" apunta al campo dentro de datos/sitio.json.
  var SECCIONES = [
    { id: "bienvenida", titulo: "Bienvenida", descripcion: "Lo primero que ven los visitantes al entrar al sitio.", bloques: [
      { campos: [
        { ruta: "bienvenida.titulo", etiqueta: "Título", max: 120 },
        { ruta: "bienvenida.texto", etiqueta: "Texto", max: 400, largo: true },
        { ruta: "bienvenida.boton", etiqueta: "Texto del botón", max: 40, ayuda: "El botón lleva al formulario de contacto." }
      ] }
    ] },
    { id: "oportunidades", titulo: "Oportunidades de inversión", descripcion: "Las tarjetas con las alternativas de inversión. Cada tarjeta tiene un botón «Consultar».", bloques: [
      { campos: [
        { ruta: "oportunidades.titulo", etiqueta: "Título de la sección", max: 120 },
        { ruta: "oportunidades.subtitulo", etiqueta: "Subtítulo", max: 300 }
      ] },
      { tarjetas: true },
      { titulo: "Aviso legal", campos: [
        { ruta: "oportunidades.aviso", etiqueta: "Texto bajo las tarjetas", max: 600, largo: true,
          ayuda: "Si mencionas rentabilidades, conviene mantener este aviso." }
      ] }
    ] },
    { id: "porQue", titulo: "Por qué elegirnos", descripcion: "El mensaje principal sobre la propuesta de valor. A la derecha se muestra el logo.", bloques: [
      { campos: [
        { ruta: "porQue.etiqueta", etiqueta: "Etiqueta pequeña (sobre el título)", max: 60 },
        { ruta: "porQue.titulo", etiqueta: "Título", max: 160 },
        { ruta: "porQue.texto", etiqueta: "Texto", max: 1200, largo: true }
      ] },
      { titulo: "Lista de motivos", campos: [
        { ruta: "porQue.subtitulo", etiqueta: "Subtítulo de la lista", max: 120 }
      ] },
      { puntos: true },
      { campos: [
        { ruta: "porQue.cierre", etiqueta: "Frase de cierre", max: 200 }
      ] }
    ] },
    { id: "quienes", titulo: "Quiénes somos", descripcion: "Tu presentación personal, tu fotografía y las demás personas del equipo.", bloques: [
      { foto: true },
      { campos: [
        { ruta: "quienes.nombre", etiqueta: "Nombre", max: 80 },
        { ruta: "quienes.descripcion", etiqueta: "Descripción", max: 2500, largo: true, ayuda: "Para separar párrafos, deja una línea en blanco entre ellos." }
      ] },
      { titulo: "Equipo", campos: [
        { ruta: "quienes.equipoTitulo", etiqueta: "Título de la sección del equipo", max: 80, ayuda: "Se muestra sobre las personas del equipo, debajo de tu presentación." }
      ] },
      { equipo: true }
    ] },
    { id: "contacto", titulo: "Contacto", descripcion: "Datos de contacto, enlaces y la franja que invita a escribir.", bloques: [
      { titulo: "Datos de contacto", campos: [
        { ruta: "contacto.whatsapp", etiqueta: "WhatsApp", max: 30, tipo: "tel", ayuda: "Con código de país, por ejemplo +56 9 1234 5678. También activa el botón verde de WhatsApp." },
        { ruta: "contacto.correo", etiqueta: "Correo", max: 120, tipo: "email" },
        { ruta: "contacto.agenda", etiqueta: "Enlace de la agenda en línea", max: 300, tipo: "url", ayuda: "La página de reservas de Google Calendar (enlace del código para insertar) o de Calendly. Se muestra dentro de la opción «Agenda una reunión». Mientras esté vacío, esa opción invita a dejar los datos." },
        { ruta: "contacto.agendaTexto", etiqueta: "Texto de la opción «Agenda una reunión»", max: 200 },
        { ruta: "contacto.linkedin", etiqueta: "LinkedIn (opcional)", max: 300, tipo: "url" },
        { ruta: "contacto.instagram", etiqueta: "Instagram (opcional)", max: 300, tipo: "url" }
      ] },
      { titulo: "Textos", campos: [
        { ruta: "contacto.titulo", etiqueta: "Título de la sección de contacto", max: 120 },
        { ruta: "contacto.texto", etiqueta: "Texto de la sección de contacto", max: 400, largo: true },
        { ruta: "llamado.titulo", etiqueta: "Título de la franja azul antes de contacto", max: 160 }
      ] }
    ] },
    { id: "pie", titulo: "Pie de página", descripcion: "El texto legal al final del sitio.", bloques: [
      { campos: [
        { ruta: "pie.aviso", etiqueta: "Aviso legal", max: 600, largo: true }
      ] }
    ] }
  ];

  var estado = {
    datos: null,          // contenido que se está editando
    original: "",         // contenido guardado (para saber si hay cambios)
    fotos: {},            // fotos nuevas sin guardar: { "img/subidas/x.jpg": { base64, previa } }
    seccion: "bienvenida",
    guardando: false
  };

  /* ---------- Utilidades ---------- */

  function el(etiqueta, atributos, hijos) {
    var nodo = document.createElement(etiqueta);
    Object.keys(atributos || {}).forEach(function (k) {
      if (k === "texto") nodo.textContent = atributos[k];
      else if (k === "html") nodo.innerHTML = atributos[k];
      else if (k.indexOf("on") === 0) nodo.addEventListener(k.slice(2), atributos[k]);
      else if (atributos[k] !== false && atributos[k] != null) nodo.setAttribute(k, atributos[k]);
    });
    (hijos || []).forEach(function (h) { if (h) nodo.appendChild(h); });
    return nodo;
  }

  function leer(ruta) {
    return ruta.split(".").reduce(function (o, k) { return o == null ? "" : o[k]; }, estado.datos);
  }

  function escribir(ruta, valor) {
    var partes = ruta.split(".");
    var o = estado.datos;
    for (var i = 0; i < partes.length - 1; i++) o = o[partes[i]] = o[partes[i]] || {};
    o[partes[partes.length - 1]] = valor;
    actualizarEstado();
  }

  function icono(nombre) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">' +
      (ICONOS[nombre] || ICONOS.grafico) + "</svg>";
  }

  function api(accion, cuerpo) {
    return fetch("/api/admin?accion=" + accion, {
      method: cuerpo ? "POST" : "GET",
      credentials: "same-origin",
      headers: cuerpo ? { "Content-Type": "application/json" } : {},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var error = new Error(j.error || "Error " + r.status);
          error.estado = r.status;
          throw error;
        }
        return j;
      });
    });
  }

  var temporizadorAviso;
  function avisar(html, tipo, duracion) {
    var a = $("aviso");
    a.className = "aviso-flotante" + (tipo ? " " + tipo : "");
    a.innerHTML = html;
    a.hidden = false;
    clearTimeout(temporizadorAviso);
    if (duracion) temporizadorAviso = setTimeout(function () { a.hidden = true; }, duracion);
  }

  /* ---------- Cambios pendientes ---------- */

  function hayCambios() {
    return Object.keys(estado.fotos).length > 0 || JSON.stringify(estado.datos) !== estado.original;
  }

  // Fotos en uso: la principal y las del equipo.
  function fotosEnUso() {
    var q = estado.datos.quienes;
    return [q.foto].concat((q.equipo || []).map(function (p) { return p.foto; })).filter(Boolean);
  }

  // Olvida las fotos nuevas que ya no se usan (por ejemplo, al quitar a una persona).
  function limpiarFotos() {
    var enUso = fotosEnUso();
    Object.keys(estado.fotos).forEach(function (r) { if (enUso.indexOf(r) < 0) delete estado.fotos[r]; });
  }

  function vistaFoto(ruta) {
    return estado.fotos[ruta] ? estado.fotos[ruta].previa : "/" + ruta;
  }

  function seccionesConCambios() {
    if (!estado.datos) return {};
    var original = JSON.parse(estado.original);
    var cambios = {};
    SECCIONES.forEach(function (s) {
      var claves = [s.id];
      if (s.id === "contacto") claves.push("llamado");
      cambios[s.id] = claves.some(function (k) { return JSON.stringify(estado.datos[k]) !== JSON.stringify(original[k]); });
    });
    if (Object.keys(estado.fotos).length) cambios.quienes = true;
    return cambios;
  }

  function actualizarEstado() {
    $("barra-guardar").hidden = !hayCambios() && !estado.guardando;
    var cambios = seccionesConCambios();
    document.querySelectorAll("#menu-secciones button").forEach(function (b) {
      b.querySelector(".punto").hidden = !cambios[b.dataset.id];
    });
  }

  window.addEventListener("beforeunload", function (e) {
    if (estado.datos && hayCambios()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- Menú ---------- */

  function dibujarMenu() {
    var lista = $("menu-secciones");
    var movil = $("menu-movil");
    lista.innerHTML = "";
    movil.innerHTML = "";
    SECCIONES.forEach(function (s) {
      lista.appendChild(el("li", {}, [el("button", {
        type: "button", "data-id": s.id, "aria-current": s.id === estado.seccion ? "true" : "false",
        onclick: function () { irA(s.id); }
      }, [el("span", { texto: s.titulo }), el("span", { class: "punto", hidden: "" })])]));
      movil.appendChild(el("option", { value: s.id, texto: s.titulo, selected: s.id === estado.seccion ? "" : false }));
    });
    movil.onchange = function () { irA(movil.value); };
  }

  function irA(id) {
    estado.seccion = id;
    document.querySelectorAll("#menu-secciones button").forEach(function (b) {
      b.setAttribute("aria-current", b.dataset.id === id ? "true" : "false");
    });
    $("menu-movil").value = id;
    dibujarSeccion();
    $("contenido").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- Formularios ---------- */

  function campoTexto(c) {
    var id = "campo-" + c.ruta.replace(/\./g, "-");
    var valor = leer(c.ruta) || "";
    var entrada = c.largo
      ? el("textarea", { id: id, rows: 4 })
      : el("input", { id: id, type: c.tipo || "text", autocomplete: "off" });
    entrada.value = valor;
    var contador = el("div", { class: "contador" });
    function contar() {
      var n = entrada.value.length;
      contador.textContent = n + " / " + c.max;
      contador.classList.toggle("excede", n > c.max);
    }
    entrada.addEventListener("input", function () { escribir(c.ruta, entrada.value); contar(); });
    contar();
    return el("div", { class: "campo" }, [
      el("label", { for: id, texto: c.etiqueta }),
      c.ayuda ? el("p", { class: "ayuda", texto: c.ayuda }) : null,
      entrada,
      contador
    ]);
  }

  function bloqueTarjetas() {
    var lista = estado.datos.oportunidades.tarjetas;
    var contenedor = el("div", { class: "tarjeta" }, [el("h3", { texto: "Tarjetas" }),
      el("p", { class: "ayuda", texto: "Entre 1 y 8 tarjetas. El título de cada tarjeta también aparece como motivo de consulta en el formulario. Si la descripción tiene más de una línea, la primera se muestra en negrita como subtítulo." })]);

    lista.forEach(function (t, i) {
      var vista = el("span", { class: "icono-vista", html: icono(t.icono) });
      var selector = el("select", { id: "icono-" + i, onchange: function () {
        t.icono = selector.value; vista.innerHTML = icono(t.icono); actualizarEstado();
      } });
      Object.keys(ICONOS).forEach(function (k) {
        selector.appendChild(el("option", { value: k, texto: NOMBRES_ICONOS[k], selected: k === t.icono ? "" : false }));
      });

      var titulo = el("input", { id: "tarjeta-titulo-" + i, type: "text", autocomplete: "off" });
      titulo.value = t.titulo;
      titulo.addEventListener("input", function () { t.titulo = titulo.value; nombre.textContent = titulo.value || "Tarjeta " + (i + 1); actualizarEstado(); });
      var descripcion = el("textarea", { id: "tarjeta-desc-" + i, rows: 4 });
      descripcion.value = t.descripcion;
      descripcion.addEventListener("input", function () { t.descripcion = descripcion.value; actualizarEstado(); });

      var nombre = el("span", { texto: t.titulo || "Tarjeta " + (i + 1) });
      function mover(delta) {
        var j = i + delta;
        if (j < 0 || j >= lista.length) return;
        lista.splice(j, 0, lista.splice(i, 1)[0]);
        actualizarEstado();
        dibujarSeccion();
      }
      contenedor.appendChild(el("div", { class: "item" }, [
        el("div", { class: "item-cabecera" }, [
          el("strong", {}, [vista, nombre]),
          el("div", { class: "item-acciones" }, [
            el("button", { type: "button", class: "boton secundario chico", title: "Subir", "aria-label": "Subir tarjeta", disabled: i === 0 ? "" : false, onclick: function () { mover(-1); } }, [document.createTextNode("↑")]),
            el("button", { type: "button", class: "boton secundario chico", title: "Bajar", "aria-label": "Bajar tarjeta", disabled: i === lista.length - 1 ? "" : false, onclick: function () { mover(1); } }, [document.createTextNode("↓")]),
            el("button", { type: "button", class: "boton peligro chico", disabled: lista.length <= 1 ? "" : false, onclick: function () {
              if (!confirm("¿Eliminar la tarjeta «" + (t.titulo || "sin título") + "»?")) return;
              lista.splice(i, 1); actualizarEstado(); dibujarSeccion();
            } }, [document.createTextNode("Eliminar")])
          ])
        ]),
        el("div", { class: "fila" }, [
          el("div", { class: "campo" }, [el("label", { for: "icono-" + i, texto: "Ícono" }), selector]),
          el("div", { class: "campo" }, [el("label", { for: "tarjeta-titulo-" + i, texto: "Título" }), titulo])
        ]),
        el("div", { class: "campo" }, [el("label", { for: "tarjeta-desc-" + i, texto: "Descripción" }), descripcion])
      ]));
    });

    contenedor.appendChild(el("button", { type: "button", class: "boton secundario", disabled: lista.length >= 8 ? "" : false, onclick: function () {
      lista.push({ icono: "grafico", titulo: "", descripcion: "" });
      actualizarEstado(); dibujarSeccion();
      var ultimo = document.getElementById("tarjeta-titulo-" + (lista.length - 1));
      if (ultimo) ultimo.focus();
    } }, [document.createTextNode("+ Agregar tarjeta")]));
    return contenedor;
  }

  function bloquePuntos() {
    var porQue = estado.datos.porQue;
    var lista = porQue.puntos = porQue.puntos || [];
    var contenedor = el("div", { class: "tarjeta" }, [el("h3", { texto: "Motivos" }),
      el("p", { class: "ayuda", texto: "Hasta 8 motivos. Cada uno se muestra con un check, el título en negrita y el texto a continuación." })]);

    lista.forEach(function (p, i) {
      var titulo = el("input", { id: "punto-titulo-" + i, type: "text", autocomplete: "off" });
      titulo.value = p.titulo;
      var nombre = el("span", { texto: p.titulo || "Motivo " + (i + 1) });
      titulo.addEventListener("input", function () { p.titulo = titulo.value; nombre.textContent = titulo.value || "Motivo " + (i + 1); actualizarEstado(); });
      var texto = el("textarea", { id: "punto-texto-" + i, rows: 2 });
      texto.value = p.texto;
      texto.addEventListener("input", function () { p.texto = texto.value; actualizarEstado(); });
      function mover(delta) {
        var j = i + delta;
        if (j < 0 || j >= lista.length) return;
        lista.splice(j, 0, lista.splice(i, 1)[0]);
        actualizarEstado(); dibujarSeccion();
      }
      contenedor.appendChild(el("div", { class: "item" }, [
        el("div", { class: "item-cabecera" }, [
          el("strong", {}, [nombre]),
          el("div", { class: "item-acciones" }, [
            el("button", { type: "button", class: "boton secundario chico", "aria-label": "Subir motivo", disabled: i === 0 ? "" : false, onclick: function () { mover(-1); } }, [document.createTextNode("↑")]),
            el("button", { type: "button", class: "boton secundario chico", "aria-label": "Bajar motivo", disabled: i === lista.length - 1 ? "" : false, onclick: function () { mover(1); } }, [document.createTextNode("↓")]),
            el("button", { type: "button", class: "boton peligro chico", onclick: function () {
              if (!confirm("¿Eliminar el motivo «" + (p.titulo || "sin título") + "»?")) return;
              lista.splice(i, 1); actualizarEstado(); dibujarSeccion();
            } }, [document.createTextNode("Eliminar")])
          ])
        ]),
        el("div", { class: "campo" }, [el("label", { for: "punto-titulo-" + i, texto: "Título" }), titulo]),
        el("div", { class: "campo" }, [el("label", { for: "punto-texto-" + i, texto: "Texto" }), texto])
      ]));
    });

    contenedor.appendChild(el("button", { type: "button", class: "boton secundario", disabled: lista.length >= 8 ? "" : false, onclick: function () {
      lista.push({ titulo: "", texto: "" });
      actualizarEstado(); dibujarSeccion();
      var ultimo = document.getElementById("punto-titulo-" + (lista.length - 1));
      if (ultimo) ultimo.focus();
    } }, [document.createTextNode("+ Agregar motivo")]));
    return contenedor;
  }

  // Reduce la imagen a 900 px de ancho como máximo y la convierte a JPG.
  function prepararFoto(archivo) {
    return new Promise(function (resolver, rechazar) {
      if (!/^image\//.test(archivo.type)) return rechazar(new Error("El archivo no es una imagen."));
      var img = new Image();
      var url = URL.createObjectURL(archivo);
      img.onload = function () {
        var escala = Math.min(1, 900 / img.naturalWidth);
        var lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.naturalWidth * escala);
        lienzo.height = Math.round(img.naturalHeight * escala);
        var ctx = lienzo.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        URL.revokeObjectURL(url);
        var datosUrl = lienzo.toDataURL("image/jpeg", 0.86);
        resolver({ base64: datosUrl.split(",")[1], previa: datosUrl });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rechazar(new Error("No se pudo leer la imagen.")); };
      img.src = url;
    });
  }

  // Selector de archivo que prepara la foto y la deja pendiente. "prefijo" da el comienzo del nombre del archivo;
  // "alElegir" recibe la ruta nueva dentro de sitio/.
  function entradaFoto(id, prefijo, alElegir) {
    var entrada = el("input", { type: "file", accept: "image/jpeg,image/png,image/webp", id: id, hidden: "" });
    entrada.addEventListener("change", function () {
      var archivo = entrada.files[0];
      if (!archivo) return;
      prepararFoto(archivo).then(function (r) {
        var ruta = "img/subidas/" + prefijo() + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + ".jpg";
        estado.fotos[ruta] = { base64: r.base64, previa: r.previa };
        alElegir(ruta);
        limpiarFotos();
        actualizarEstado();
        dibujarSeccion();
      }).catch(function (e) { avisar(e.message, "error", 6000); });
    });
    return entrada;
  }

  // Para el nombre del archivo: "María José" → "maria-jose"
  function slug(texto) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "persona";
  }

  function bloqueFoto() {
    var ruta = leer("quienes.foto");
    var nueva = Boolean(estado.fotos[ruta]);
    var vista = el("img", { src: vistaFoto(ruta), alt: "Fotografía actual" });
    var acciones = [
      el("label", { for: "foto-archivo", class: "boton secundario", texto: "Elegir otra foto" }),
      entradaFoto("foto-archivo", function () { return "luciano"; }, function (r) { estado.datos.quienes.foto = r; }),
      el("p", { class: "ayuda", texto: "La foto se muestra en un círculo: conviene una imagen cuadrada, con el rostro centrado. Se ajusta automáticamente a 900 px de ancho." })
    ];
    if (nueva) {
      acciones.unshift(el("span", { class: "marca-pendiente", texto: "Foto nueva sin guardar" }));
      acciones.push(el("button", { type: "button", class: "boton peligro chico", onclick: function () {
        estado.datos.quienes.foto = JSON.parse(estado.original).quienes.foto;
        limpiarFotos();
        actualizarEstado(); dibujarSeccion();
      } }, [document.createTextNode("Deshacer cambio de foto")]));
    }
    return el("div", { class: "tarjeta" }, [el("h3", { texto: "Fotografía" }),
      el("div", { class: "foto-editor" }, [vista, el("div", { class: "acciones" }, acciones)])]);
  }

  function bloqueEquipo() {
    var quienes = estado.datos.quienes;
    var lista = quienes.equipo = quienes.equipo || [];
    var contenedor = el("div", { class: "tarjeta" }, [el("h3", { texto: "Personas del equipo" }),
      el("p", { class: "ayuda", texto: "Hasta 12 personas, que se muestran en tarjetas debajo de tu presentación. La foto es opcional: sin foto se muestran sus iniciales. Mientras no haya nadie, la sección no aparece en el sitio." })]);

    lista.forEach(function (p, i) {
      var etiqueta = function () { return p.nombre || "Persona " + (i + 1); };
      var nombreVista = el("span", { texto: etiqueta() });
      var campo = function (clave, texto, max, largo) {
        var id = "persona-" + clave + "-" + i;
        var entrada = largo ? el("textarea", { id: id, rows: 3 }) : el("input", { id: id, type: "text", autocomplete: "off" });
        entrada.value = p[clave] || "";
        var contador = el("div", { class: "contador" });
        function contar() {
          contador.textContent = entrada.value.length + " / " + max;
          contador.classList.toggle("excede", entrada.value.length > max);
        }
        entrada.addEventListener("input", function () {
          p[clave] = entrada.value;
          if (clave === "nombre") nombreVista.textContent = etiqueta();
          contar(); actualizarEstado();
        });
        contar();
        return el("div", { class: "campo" }, [el("label", { for: id, texto: texto }), entrada, contador]);
      };
      function mover(delta) {
        var j = i + delta;
        if (j < 0 || j >= lista.length) return;
        lista.splice(j, 0, lista.splice(i, 1)[0]);
        actualizarEstado(); dibujarSeccion();
      }

      var idArchivo = "persona-foto-" + i;
      var accionesFoto = [
        el("label", { for: idArchivo, class: "boton secundario chico", texto: p.foto ? "Cambiar foto" : "Agregar foto" }),
        entradaFoto(idArchivo, function () { return slug(p.nombre); }, function (r) { p.foto = r; })
      ];
      if (p.foto) {
        accionesFoto.push(el("button", { type: "button", class: "boton peligro chico", onclick: function () {
          p.foto = ""; limpiarFotos(); actualizarEstado(); dibujarSeccion();
        } }, [document.createTextNode("Quitar foto")]));
      }
      if (estado.fotos[p.foto]) accionesFoto.unshift(el("span", { class: "marca-pendiente", texto: "Foto nueva sin guardar" }));
      var retrato = p.foto
        ? el("img", { src: vistaFoto(p.foto), alt: "Foto de " + etiqueta() })
        : el("span", { class: "sin-foto", texto: "Sin foto" });

      contenedor.appendChild(el("div", { class: "item" }, [
        el("div", { class: "item-cabecera" }, [
          el("strong", {}, [nombreVista]),
          el("div", { class: "item-acciones" }, [
            el("button", { type: "button", class: "boton secundario chico", "aria-label": "Subir persona", disabled: i === 0 ? "" : false, onclick: function () { mover(-1); } }, [document.createTextNode("↑")]),
            el("button", { type: "button", class: "boton secundario chico", "aria-label": "Bajar persona", disabled: i === lista.length - 1 ? "" : false, onclick: function () { mover(1); } }, [document.createTextNode("↓")]),
            el("button", { type: "button", class: "boton peligro chico", onclick: function () {
              if (!confirm("¿Quitar a «" + etiqueta() + "» del equipo?")) return;
              lista.splice(i, 1); limpiarFotos(); actualizarEstado(); dibujarSeccion();
            } }, [document.createTextNode("Eliminar")])
          ])
        ]),
        el("div", { class: "foto-editor chico" }, [retrato, el("div", { class: "acciones" }, accionesFoto)]),
        el("div", { class: "fila mitades" }, [campo("nombre", "Nombre", 80), campo("cargo", "Cargo (opcional)", 80)]),
        campo("descripcion", "Descripción (opcional)", 800, true)
      ]));
    });

    contenedor.appendChild(el("button", { type: "button", class: "boton secundario", disabled: lista.length >= 12 ? "" : false, onclick: function () {
      lista.push({ nombre: "", cargo: "", descripcion: "", foto: "" });
      actualizarEstado(); dibujarSeccion();
      var ultimo = document.getElementById("persona-nombre-" + (lista.length - 1));
      if (ultimo) ultimo.focus();
    } }, [document.createTextNode("+ Agregar persona")]));
    return contenedor;
  }

  function dibujarSeccion() {
    var s = SECCIONES.filter(function (x) { return x.id === estado.seccion; })[0];
    var contenido = $("contenido");
    contenido.innerHTML = "";
    contenido.appendChild(el("header", {}, [el("h2", { texto: s.titulo }), el("p", { texto: s.descripcion })]));
    s.bloques.forEach(function (b) {
      if (b.tarjetas) return contenido.appendChild(bloqueTarjetas());
      if (b.foto) return contenido.appendChild(bloqueFoto());
      if (b.puntos) return contenido.appendChild(bloquePuntos());
      if (b.equipo) return contenido.appendChild(bloqueEquipo());
      contenido.appendChild(el("div", { class: "tarjeta" },
        [b.titulo ? el("h3", { texto: b.titulo }) : null].concat(b.campos.map(campoTexto))));
    });
  }

  /* ---------- Guardar y publicar ---------- */

  function guardar() {
    if (estado.guardando || !hayCambios()) return;
    estado.guardando = true;
    $("boton-guardar").disabled = true;
    $("boton-descartar").disabled = true;
    $("texto-guardar").textContent = "Guardando…";
    limpiarFotos();
    var archivos = Object.keys(estado.fotos).map(function (r) { return { ruta: "sitio/" + r, base64: estado.fotos[r].base64 }; });
    api("guardar", { datos: estado.datos, archivos: archivos }).then(function (r) {
      estado.datos = r.datos;
      estado.original = JSON.stringify(r.datos);
      estado.fotos = {};
      dibujarSeccion();
      seguirPublicacion(r.version);
    }).catch(function (e) {
      if (e.estado === 401) return mostrarAcceso("Tu sesión venció. Vuelve a ingresar; tus cambios siguen en esta pestaña hasta que la cierres.");
      avisar("<strong>No se guardó.</strong> " + escaparHtml(e.message), "error");
    }).then(function () {
      estado.guardando = false;
      $("boton-guardar").disabled = false;
      $("boton-descartar").disabled = false;
      $("texto-guardar").textContent = "Hay cambios sin guardar.";
      actualizarEstado();
    });
  }

  // Espera a que Vercel publique la versión recién guardada.
  function seguirPublicacion(version) {
    if (!version || version === "local") {
      return avisar("<strong>Cambios guardados.</strong> <a href=\"/\" target=\"_blank\" rel=\"noopener\">Ver el sitio ↗</a>", "ok", 8000);
    }
    avisar("<strong>Cambios guardados.</strong> Publicando en el sitio… suele tardar uno o dos minutos.");
    var intentos = 0;
    (function revisar() {
      intentos++;
      fetch("/api/estado", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (e) {
        if (e.version === version) {
          avisar("<strong>¡Listo!</strong> Los cambios ya están publicados. <a href=\"/\" target=\"_blank\" rel=\"noopener\">Ver el sitio ↗</a>", "ok", 15000);
        } else if (intentos < 48) {
          setTimeout(revisar, 5000);
        } else {
          avisar("Los cambios están guardados, pero la publicación está tardando más de lo normal. Revisa el sitio en unos minutos.", "", 15000);
        }
      }).catch(function () { if (intentos < 48) setTimeout(revisar, 5000); });
    })();
  }

  function descartar() {
    if (!confirm("¿Descartar todos los cambios sin guardar?")) return;
    estado.datos = JSON.parse(estado.original);
    estado.fotos = {};
    actualizarEstado();
    dibujarSeccion();
  }

  function escaparHtml(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* ---------- Acceso ---------- */

  function mostrarAcceso(mensaje) {
    // Si la sesión venció mientras editaba, el contenido queda en memoria y vuelve al reingresar.
    $("vista-acceso").hidden = false;
    $("vista-panel").hidden = true;
    $("error-acceso").textContent = mensaje || "";
    $("clave-admin").focus();
  }

  function mostrarPanel() {
    $("vista-acceso").hidden = true;
    $("vista-panel").hidden = false;
    if (estado.datos) { dibujarMenu(); dibujarSeccion(); actualizarEstado(); return; }
    api("contenido").then(function (r) {
      estado.datos = r.datos;
      estado.original = JSON.stringify(r.datos);
      dibujarMenu();
      dibujarSeccion();
      actualizarEstado();
    }).catch(function (e) {
      if (e.estado === 401) return mostrarAcceso();
      $("contenido").innerHTML = "";
      $("contenido").appendChild(el("p", { class: "error", texto: "No se pudo cargar el contenido: " + e.message }));
    });
  }

  function verClave(mostrar) {
    var boton = $("ver-clave");
    $("clave-admin").type = mostrar ? "text" : "password";
    boton.setAttribute("aria-pressed", mostrar ? "true" : "false");
    boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
    // Los SVG no tienen la propiedad hidden; se usa el atributo.
    boton.querySelector(".ojo-abierto").toggleAttribute("hidden", mostrar);
    boton.querySelector(".ojo-cerrado").toggleAttribute("hidden", !mostrar);
  }

  $("ver-clave").addEventListener("click", function () {
    verClave($("clave-admin").type === "password");
    $("clave-admin").focus();
  });

  $("formulario-acceso").addEventListener("submit", function (e) {
    e.preventDefault();
    var boton = $("boton-entrar");
    boton.disabled = true;
    $("error-acceso").textContent = "";
    api("entrar", { clave: $("clave-admin").value }).then(function () {
      $("clave-admin").value = "";
      verClave(false);
      mostrarPanel();
    }).catch(function (err) {
      $("error-acceso").textContent = err.message;
    }).then(function () { boton.disabled = false; });
  });

  $("boton-salir").addEventListener("click", function () {
    if (hayCambios() && !confirm("Hay cambios sin guardar. ¿Cerrar sesión de todas formas?")) return;
    api("salir", {}).then(function () { location.reload(); });
  });
  $("boton-guardar").addEventListener("click", guardar);
  $("boton-descartar").addEventListener("click", descartar);
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && estado.datos) { e.preventDefault(); guardar(); }
  });

  api("sesion").then(mostrarPanel).catch(function () { mostrarAcceso(); });
})();
