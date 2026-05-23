import Prestamo from "../models/Prestamo.js";

// Crea un nuevo prestamo con los datos del body
// No maneja archivos por lo que req.body se usa directamente
export const createPrestamo = async (req, res) => {
    try {
        const prestamo = await Prestamo.create(req.body);
        res.status(201).json({ mensaje: "Prestamo creado.", prestamo });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna todos los prestamos ordenados por fecha_prestamo de forma descendente
// El -1 en el sort indica orden descendente, es decir el prestamo más reciente primero
// populate() reemplaza el ObjectId de usuario y material por los campos especificados
export const getAllPrestamos = async (req, res) => {
    try {
        const prestamos = await Prestamo.find()
            // Trae solo los campos necesarios del usuario en vez de todo el documento
            .populate('usuario', 'nombre apellido telefono email direccion')
            // Trae solo el nombre_material en vez de todo el documento del material
            .populate('material', 'nombre_material')
            .sort({ fecha_prestamo: -1 });

        res.json(prestamos);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un prestamo específico buscándolo por su _id de MongoDB
// También popula usuario y material para retornar sus datos legibles
export const getPrestamo = async (req, res) => {
    try {
        const prestamo = await Prestamo.findById(req.params.id)
            .populate('usuario', 'nombre apellido telefono email direccion')
            .populate('material', 'nombre_material');

        // Si el _id no corresponde a ningún prestamo, retornamos 404
        if (!prestamo) return res.status(404).json({ mensaje: "Prestamo no encontrado." });

        res.json(prestamo);

    } catch (error) {
        // Si el formato del _id es inválido, mongoose lanza un error que capturamos aquí
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza los campos enviados en el body para un prestamo específico
// new: true retorna el documento ya actualizado en vez del original
// runValidators: true re-ejecuta las validaciones del Schema sobre los nuevos datos
export const updatePrestamo = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!prestamo) return res.status(404).json({ error: "Prestamo no encontrado." });

        res.json({ mensaje: "Prestamo actualizado.", prestamo });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Elimina un prestamo de la base de datos por su _id
// findByIdAndDelete retorna el documento eliminado, lo usamos para verificar si existía
export const deletePrestamo = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByIdAndDelete(req.params.id);

        if (!prestamo) return res.status(404).json({ error: "Prestamo no encontrado." });

        res.json({ mensaje: "Prestamo eliminado." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};