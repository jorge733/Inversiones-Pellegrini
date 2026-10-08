# Inversiones Pellegrini

Sitio web de Inversiones Pellegrini, publicado en **Vercel**, con un panel privado (`/admin`) para editar el contenido sin tocar código.

## Estructura

| Ruta | Qué contiene |
|---|---|
| `datos/sitio.json` | Todo el contenido editable: textos, tarjetas de oportunidades, perfil, foto y datos de contacto. |
| `sitio/index.html` | Plantilla de la página. `{{seccion.campo}}` se reemplaza por el texto; `<!--@BLOQUE-->` por HTML generado. |
| `sitio/` | Archivos estáticos: favicon, imágenes (`img/`) y el panel (`admin/`). |
| `herramientas/construir.js` | Une plantilla y datos, y genera el sitio en `public/` (no se sube al repositorio). |
| `api/admin.js`, `api/estado.js` | Funciones del panel en Vercel. |
| `lib/` | Sesión, límite de intentos y guardado en GitHub (basado en el panel de ehda.cl). |

## Panel de administración (`/admin`)

Luciano entra a `https://<dominio>/admin` con una contraseña y puede editar:
bienvenida, tarjetas de oportunidades (agregar, quitar, ordenar y cambiar ícono), «Por qué elegirnos»,
su nombre, descripción y foto, datos de contacto (WhatsApp, correo, agenda, LinkedIn, Instagram) y avisos legales.
El diseño, los colores y la estructura no se editan desde el panel.

**Cómo guarda:** cada «Guardar cambios» crea un commit en GitHub con `datos/sitio.json` (y la foto, si cambió).
Vercel lo detecta, vuelve a generar el sitio y lo publica en 1–2 minutos; el panel avisa cuando ya está en línea.
Todo cambio queda en el historial de git y se puede revertir.

- **Fotos:** el navegador las reduce a 900 px de ancho y las convierte a JPG antes de subirlas a `sitio/img/subidas/`.
- **Seguridad:** cookie `HttpOnly`, `Secure`, `SameSite=Strict`, válida 8 horas; bloqueo de 15 minutos tras 8 contraseñas incorrectas; el servidor valida cada campo y solo acepta imágenes JPG, PNG o WEBP.

### Activar el panel en Vercel

En el proyecto de Vercel → **Settings → Environment Variables**, agregue:

| Variable | Valor |
|---|---|
| `CLAVE_ADMIN` | La contraseña que usará Luciano. |
| `SECRETO_SESION` | Un texto largo y aleatorio (mínimo 16 caracteres). |
| `GITHUB_TOKEN` | Token de GitHub *fine-grained* con acceso solo a este repositorio y permiso **Contents: Read and write**. |

Luego vuelva a publicar (**Deployments → Redeploy**). Para revisar la configuración sin ver los valores: `https://<dominio>/api/estado`.

## Trabajar en el computador

```bash
npm run dev
```

Abre el sitio en `http://localhost:3000` y el panel en `http://localhost:3000/admin`.
Copie `.env.example` como `.env` y defina `CLAVE_ADMIN` y `SECRETO_SESION`. Sin `GITHUB_TOKEN`, el panel guarda
directamente en los archivos del proyecto y el sitio se regenera solo.

Para generar el sitio sin servidor: `npm run build` (queda en `public/`).
