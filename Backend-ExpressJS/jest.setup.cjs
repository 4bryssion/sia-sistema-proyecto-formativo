// Se ejecuta antes de cada archivo de prueba.
//
// Las pruebas unitarias NO usan el .env real ni el .env.test: no deben tocar la
// base de datos, ni el correo, ni depender de secretos de nadie. Estos valores
// existen solo para que los módulos de src/ puedan importarse sin fallar.
process.env.JWT_SECRET = 'clave_de_pruebas_unitarias_no_usar_en_produccion';
process.env.JWT_EXPIRES = '1h';

// PrismaClient no se conecta al crearse, solo al hacer la primera consulta.
// Una URL inalcanzable garantiza que, si una prueba olvida simular un
// repository, falle de forma evidente en vez de escribir en una base real.
process.env.DATABASE_URL = 'postgresql://jest:jest@127.0.0.1:1/jest_sin_base_de_datos';

// nodemailer tampoco se conecta al crearse: estos valores evitan que un envío
// olvidado salga hacia un servidor real.
process.env.EMAIL_HOST = '127.0.0.1';
process.env.EMAIL_PORT = '1';
process.env.EMAIL_SECURE = 'false';
process.env.EMAIL_USER = 'jest@localhost';
process.env.EMAIL_APP_PASSWORD = 'jest';
process.env.EMAIL_FROM = 'Jest <jest@localhost>';
process.env.FRONTEND_URL = 'http://localhost:5173';
