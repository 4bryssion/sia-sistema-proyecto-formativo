import Tarea from "../models/Tarea.js";

// Crea una nueva tarea con los datos del body
export const createTarea = async (req, res) => {
    try {
        const tarea = await Tarea.create(req.body);
        res.status(201).json({ mensaje: "Tarea creada.", tarea });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna todas las tareas ordenadas alfabéticamente por nombre_tarea
// El populate anidado de rol dentro de usuario se hace con la opción populate dentro del primer populate, ya que rol es una llave foránea dentro de usuario
export const getAllTareas = async (req, res) => {
    try {
        const tareas = await Tarea.find()
            .populate({
                path: 'usuario',
                select: 'nombre apellido rol',
                // Populate anidado: dentro del documento usuario, popula el campo rol
                // trayendo solo el campo nombre_rol en vez de todo el documento
                populate: {
                    path: 'rol',
                    select: 'nombre_rol'
                }
            })
            .sort({ nombre_tarea: 1 });

        res.json(tareas);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna una tarea específica buscándola por su _id de MongoDB
export const getTarea = async (req, res) => {
    try {
        const tarea = await Tarea.findById(req.params.id)
            .populate({
                path: 'usuario',
                select: 'nombre apellido rol',
                populate: {
                    path: 'rol',
                    select: 'nombre_rol'
                }
            });

        if (!tarea) return res.status(404).json({ mensaje: "Tarea no encontrada." });

        res.json(tarea);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza una tarea por su _id
// new: true retorna el documento ya actualizado en vez del original
// runValidators: true re-ejecuta las validaciones del Schema sobre los nuevos datos
export const updateTarea = async (req, res) => {
    try {
        const tarea = await Tarea.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!tarea) return res.status(404).json({ error: "Tarea no encontrada." });

        res.json({ mensaje: "Tarea actualizada.", tarea });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Elimina una tarea por su _id
export const deleteTarea = async (req, res) => {
    try {
        const tarea = await Tarea.findByIdAndDelete(req.params.id);

        if (!tarea) return res.status(404).json({ error: "Tarea no encontrada." });

        res.json({ mensaje: "Tarea eliminada." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};