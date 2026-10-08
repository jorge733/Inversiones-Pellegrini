// Diagnóstico: indica si las variables de entorno llegaron al servidor, sin mostrar sus valores.
// El panel también lo usa para saber cuándo ya está publicada la última versión guardada.
const { estadoConfiguracion } = require("../lib/sesion");

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(estadoConfiguracion());
};
