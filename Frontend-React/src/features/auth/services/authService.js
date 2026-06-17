const API_URL = "http://localhost:5000/api/auth";

export async function login(userData) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: userData.userEmail,
            password: userData.userPassword,
        }),
    });

    if (!response.ok){
        const error = await response.json();
        throw new Error(error.error || "Error login");
    }

    return response.json();
}