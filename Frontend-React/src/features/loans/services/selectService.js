// URL base del backend
const API_URL = "http://localhost:5000/api";

// Obtiene los materiales consumibles disponibles para préstamo
export async function getMaterials() {
    const response = await fetch(`${API_URL}/consumable-materials`);
    if (!response.ok) throw new Error("Error al obtener materiales");
    const data = await response.json();
    // Transforma los datos al formato que espera el Select
    return data.map((m) => ({ value: m.id, label: m.materialName }));
}

// Obtiene los usuarios disponibles para préstamo
export async function getUsers() {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error("Error al obtener usuarios");
    const data = await response.json();
    // Transforma los datos al formato que espera el Select
    return data.map((u) => ({ value: u.id, label: `${u.userFirstName} ${u.userLastName}` }));
}
//en loann service =============================00
// Crea un nuevo préstamo en el backend
export async function createLoan(loanData) {
    const response = await fetch(`${API_URL}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear préstamo");
    }
    return response.json();
}