// URL base del endpoint de usuarios en el backend
// En desarrollo apunta al servidor Express local
// En producción debería provenir de variables de entorno
const API_URL = "http://localhost:4000/api/users";


// Función para crear un usuario en el backend
// Recibe un objeto con los datos del usuario
// Retorna la respuesta JSON del servidor
export async function createUser(userData) {


  // Realizamos la petición HTTP usando fetch
  const response = await fetch(API_URL, {
    // Método HTTP según convención REST
    method: "POST",


    // Cabeceras de la petición
    // Indicamos que enviamos JSON
    headers: {
      "Content-Type": "application/json",
    },


    // Convertimos el objeto userData a JSON
    body: JSON.stringify(userData),
  });


  // Verificamos si la respuesta NO fue exitosa (status != 2xx)
  if (!response.ok) {
    // Leemos el cuerpo de la respuesta de error
    const error = await response.json();


    // Lanzamos una excepción con el mensaje de error
    // Esto permite que el componente que llama maneje el error con try/catch
    throw new Error(error.error || "Error al crear usuario");
  }


  // Si la petición fue exitosa, retornamos la respuesta parseada como JSON
  return response.json();
}
