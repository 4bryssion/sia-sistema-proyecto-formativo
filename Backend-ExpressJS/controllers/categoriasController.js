import Categoria from "../models/Categoria.js";

// Retorna todas las categorías ordenadas alfabéticamente por nombre
export const getAllCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre_categoria: 1 });
        res.json(categorias);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna una categoría específica buscándola por su _id de MongoDB
export const getCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) return res.status(404).json({ mensaje: "Categoría no encontrada." });

        res.json(categoria);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};