// Prueba de humo de la configuración de Jest. NO es un caso de la Matriz de
// Casos de Prueba: solo confirma que Jest puede importar un módulo ESM de src/
// (babel-jest) y que jest.setup.cjs cargó las variables de entorno ficticias.
// Si esta prueba falla, ninguna prueba unitaria del proyecto va a poder correr.
import { normalizarNombre } from '../../src/shared/normalizeName.js';

describe('Configuración de Jest', () => {
  test('importa un módulo ESM de src/ y lo ejecuta', () => {
    expect(normalizarNombre('  Gúcci  SA ')).toBe('gucci sa');
  });

  test('usa las variables de entorno ficticias de jest.setup.cjs', () => {
    expect(process.env.JWT_SECRET).toBe('clave_de_pruebas_unitarias_no_usar_en_produccion');
    expect(process.env.DATABASE_URL).toContain('jest_sin_base_de_datos');
  });
});
