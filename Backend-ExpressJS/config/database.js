import mongoose from 'mongoose';

// Definimos la función de conexión como async porque mongoose.connect() es una operación asíncrona (tarda un tiempo en completarse)
const connectDB = async () => {

    // Le decimos a mongoose que ignore los campos que no estén definidos en el Schema. Evita advertencias en la consola con versiones recientes de mongoose
    mongoose.set('strictQuery', true);

    mongoose.Promise = global.Promise;

    // El bloque try/catch nos permite manejar errores de forma controlada:
    // - try: intenta ejecutar el código
    // - catch: si algo falla, captura el error y lo maneja sin romper la app
    try {
        // Intentamos conectarnos a MongoDB en el puerto por defecto (27017) el cual es el equipo local osea del dispositivo
        // 'inventoryDB' es el nombre de nuestra base de datos
        // El 'await' pausa la función hasta que la conexión se complete o falle
        await mongoose.connect('mongodb://localhost:27017/inventoryDB');

        // Si llegamos aquí, la conexión fue exitosa
        console.log('Se conecto exitosamente la base de datos MongoDB!');

    } catch (err) {

        // Si la conexión falla, mostramos el error en consola
        console.error('Error al conectar la base de datos MongoDB.', err);

        // Terminamos el proceso de Node.js con código 1 (indica error) Esto evita que el servidor quede corriendo sin base de datos
        process.exit(1);
    }
};

export default connectDB;