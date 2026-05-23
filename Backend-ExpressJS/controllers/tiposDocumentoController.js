import TipoDocumento from "../models/TipoDocumento.js";

// Retorna todos los tipos de documento ordenados alfabéticamente por nombre
export const getAllTiposDocumento = async (req, res) => {
    try {
        const tiposDocumento = await TipoDocumento.find().sort({ nombre_documento: 1 });
        res.json(tiposDocumento);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un tipo de documento específico buscándolo por su _id de MongoDB
export const getTipoDocumento = async (req, res) => {
    try {
        const tipoDocumento = await TipoDocumento.findById(req.params.id);

        if (!tipoDocumento) return res.status(404).json({ mensaje: "Tipo de documento no encontrado." });

        res.json(tipoDocumento);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};