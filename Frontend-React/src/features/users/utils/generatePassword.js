// Generador de contraseña temporal para la creación de usuarios.
//
// La contraseña ya no la escribe el administrador: se genera aquí, viaja al
// backend en el mismo campo userPassword de siempre (el contrato no cambia) y
// llega al usuario por correo marcada como temporal. El administrador nunca la
// ve en pantalla, solo el aviso "Automática".
//
// Se usa crypto.getRandomValues y no Math.random: Math.random no es
// criptográficamente seguro y sus valores son predecibles a partir del estado
// del generador.

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // sin I ni O (se confunden con 1 y 0)
const LOWER = "abcdefghijkmnopqrstuvwxyz";  // sin l
const DIGITS = "23456789";                  // sin 0 ni 1
const SYMBOLS = "!@#$%&*?-_";

const pick = (chars) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];

// Mezcla de Fisher-Yates con aleatoriedad criptográfica: sin esto, los cuatro
// caracteres obligatorios quedarían siempre en las mismas posiciones iniciales.
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/**
 * Devuelve una contraseña que cumple SIEMPRE las reglas de userSchema:
 * mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
 * @param {number} length longitud total (por defecto 14)
 */
export function generatePassword(length = 14) {
    const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
    const pool = UPPER + LOWER + DIGITS + SYMBOLS;

    const rest = Array.from({ length: Math.max(length, 8) - required.length }, () => pick(pool));

    return shuffle([...required, ...rest]).join("");
}
