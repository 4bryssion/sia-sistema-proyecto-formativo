// URL base del endpoint de retornos de préstamos en el backend
const API_URL = "http://localhost:5000/api/loan-returns";

// Obtener todos los retornos de préstamos
export async function getAllLoanReturns() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener retornos");
    }

    return response.json();
}

// Obtener un retorno por ID
export async function getLoanReturnById(id) {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener el retorno");
    }

    return response.json();
}

// Crear un nuevo retorno de préstamo
// Recibe: loanId, materialId, remainingQuantity (opcional), observations
export async function createLoanReturn(loanReturnData) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(loanReturnData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar retorno");
    }

    return response.json();
}

// Activar o desactivar un retorno
export async function toggleLoanReturn(id) {
    const response = await fetch(`${API_URL}/${id}/toggle`, {
        method: "PATCH",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar estado del retorno");
    }

    return response.json();
}