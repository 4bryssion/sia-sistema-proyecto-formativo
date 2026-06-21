// URL base del endpoint de préstamos en el backend
const API_URL = "http://localhost:5000/api/loans";

// Crea un nuevo préstamo en el backend
// Recibe un objeto con los datos del préstamo validados
// Retorna la respuesta JSON del servidor
export async function createLoan(loanData) {

    // Realizamos la petición HTTP usando fetch
    const response = await fetch(API_URL, {

        // Método HTTP según convención REST
        method: "POST",

        // Indicamos que enviamos JSON
        headers: { "Content-Type": "application/json" },

        // Convertimos el objeto loanData a JSON
        body: JSON.stringify(loanData),
    });

    // Verificamos si la respuesta NO fue exitosa
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear préstamo");
    }

    return response.json();
}