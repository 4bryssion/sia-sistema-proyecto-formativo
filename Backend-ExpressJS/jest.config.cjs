// Configuración de Jest (pruebas unitarias de la Matriz de Casos de Prueba v6).
// .cjs por la misma razón que babel.config.cjs: el proyecto es ESM y Jest lee
// este archivo antes de que exista ninguna transformación.
module.exports = {
  testEnvironment: 'node',

  // Limpia el historial de todos los jest.fn() entre una prueba y la siguiente,
  // para que una prueba no herede las llamadas registradas por otra.
  clearMocks: true,

  // Variables de entorno ficticias ANTES de cargar cualquier archivo de src/.
  setupFiles: ['<rootDir>/jest.setup.cjs'],

  // Las pruebas unitarias viven junto al archivo que prueban (src/**/x.test.js)
  // y las de configuración en tests/. No se buscan en uploads ni en prisma.
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.js'],

  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageDirectory: 'coverage',

  verbose: true,
};
