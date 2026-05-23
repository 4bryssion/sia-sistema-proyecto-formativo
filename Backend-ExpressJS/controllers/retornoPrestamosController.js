import RetornoPrestamo from "../models/RetornoPrestamo.js";

// Importamos MaterialConsumo para consultar el tipo_material del material antes de crear el retorno y validar cantidad_sobrante
import MaterialConsumo from "../models/MaterialConsumo.js";

// Crea un nuevo retorno de prestamo
// Si el material es de consumo, cantidad_sobrante es obligatoria
export const createRetornoPrestamo = async (req, res) => {
    try {
        // Buscamos el material en la DB para conocer su tipo_material
        const material = await MaterialConsumo.findById(req.body.material);

        if (!material) return res.status(404).json({ error: "Material no encontrado." });

        // Si el material es de consumo, validamos que cantidad_sobrante venga en el body
        if (material.tipo_material === "MaterialConsumo" && !req.body.cantidad_sobrante) {
            return res.status(400).json({ error: "La cantidad sobrante es requerida para materiales de consumo." });
        }

        const retorno = await RetornoPrestamo.create(req.body);
        res.status(201).json({ mensaje: "Retorno de prestamo creado.", retorno });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna todos los retornos de prestamo ordenados por fecha de devolucion descendente
export const getAllRetornosPrestamo = async (req, res) => {
    try {
        const retornos = await RetornoPrestamo.find()
            // Popula el prestamo para mostrar sus datos
            .populate('prestamo')
            // Popula el material para mostrar su nombre
            .populate('material', 'nombre_material tipo_material')
            .sort({ fecha_devolucion: -1 });

        res.json(retornos);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un retorno de prestamo específico buscándolo por su _id de MongoDB
export const getRetornoPrestamo = async (req, res) => {
    try {
        const retorno = await RetornoPrestamo.findById(req.params.id)
            .populate('prestamo')
            .populate('material', 'nombre_material tipo_material');

        if (!retorno) return res.status(404).json({ mensaje: "Retorno de prestamo no encontrado." });

        res.json(retorno);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};
