import Marca from "../models/Marca.js";

// Crea una nueva marca con los datos del body
export const createMarca = async (req, res) => {
    try {
        const marca = await Marca.create(req.body);
        res.status(201).json({ mensaje: "Marca creada.", marca });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna todas las marcas ordenadas alfabéticamente por nombre
export const getAllMarcas = async (req, res) => {
    try {
        const marcas = await Marca.find().sort({ nombre_marca: 1 });
        res.json(marcas);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna una marca específica buscándola por su _id de MongoDB
export const getMarca = async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);

        if (!marca) return res.status(404).json({ mensaje: "Marca no encontrada." });

        res.json(marca);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza una marca por su _id
export const updateMarca = async (req, res) => {
    try {
        const marca = await Marca.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!marca) return res.status(404).json({ error: "Marca no encontrada." });

        res.json({ mensaje: "Marca actualizada.", marca });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Elimina una marca por su _id
export const deleteMarca = async (req, res) => {
    try {
        const marca = await Marca.findByIdAndDelete(req.params.id);

        if (!marca) return res.status(404).json({ error: "Marca no encontrada." });

        res.json({ mensaje: "Marca eliminada." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};