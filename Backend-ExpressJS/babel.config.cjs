// Configuración de Babel SOLO para las pruebas con Jest.
//
// El backend usa ES Modules nativos ("type": "module") y el soporte de Jest para
// ESM sigue siendo experimental: en ese modo `jest.mock()` no funciona como en la
// documentación clásica. babel-jest transforma el código a CommonJS únicamente
// mientras corren las pruebas; `npm run dev` y `npm start` no pasan por aquí.
//
// Tiene que ser .cjs: babel-jest carga su configuración de forma síncrona y no
// puede leer un archivo de configuración escrito como ES Module.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
