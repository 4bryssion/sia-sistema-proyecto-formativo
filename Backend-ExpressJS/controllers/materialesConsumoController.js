// TENER MUCHO CUIDADO AL HACER LAS CONSULTAS DEBIDO A LA ESTRUCTURA DE HERENCIA ENTRE MATERIALES DE CONSUMO Y DEVOLUTIVOS.

// Debido a que MaterialConsumo es la clase padre y que esta en MongoDB se guardara como Materiales, esta colección guardara los documentos de materiales devolutivos y de consumo.

// Si se hace la típica consulta de "const materiales = await MaterialConsumo.find();" Esta traera TODOS los materiales ya sean de consumo o devolutivos.

// Para hacer la consulta por el tipo se debe buscar por "tipo_material" Ejemplo en materiales de consumo: "const materialesConsumo = await MaterialConsumo.find({ tipo_material: "MaterialConsumo"});" Esto debido a que en MaterialConsumo el atributo "tipo_material" se definio manualmente mediante default: "MaterialConsumo". Esta consulta en MaterialDevolutivo CAMBIA.



// Importamos el modelo padre, que representa la colección "materiales" en MongoDB
import MaterialConsumo from "../models/MaterialConsumo.js";
import path from "path";
import fs from "fs";

// --- Controladores CRUD ---

// Crea un nuevo material de consumo. La imagen es obligatoria según el modelo
export const createMaterialConsumo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "La imagen es requerida." });

        const data = { ...req.body };
        data.imagen = `/uploads/${req.file.filename}`;

        // Forzamos el tipo_material para garantizar que se guarde como MaterialConsumo
        data.tipo_material = "MaterialConsumo";

        const material = new MaterialConsumo(data);
        await material.save();

        res.status(201).json({ mensaje: "Material de consumo creado.", material });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la creación del material falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        if (req.file) {
            const ruta = path.join("uploads", req.file.filename);
            fs.unlink(ruta, (err) => {
                if (err) console.error("Error eliminando imagen:", err);
            });
        }
        
        res.status(400).json({ error: error.message });
    }
};

// Retorna SOLO los materiales de consumo filtrando por tipo_material
// IMPORTANTE: Sin este filtro, se traerían también los materiales devolutivos ya que ambos comparten la misma colección "materiales" en MongoDB
export const getAllMaterialesConsumo = async (req, res) => {
    try {
        const materiales = await MaterialConsumo.find({ tipo_material: "MaterialConsumo" })
            .populate('usuario', 'nombre apellido cuentadante')
            .populate('marca', 'nombre_marca')
            // Este sort, ordena los materiales de forma Ascendente A => Z o 0 => 9
            .sort({ nombre_material: 1 });

        res.json(materiales);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un material de consumo específico por su _id
// Incluimos el filtro tipo_material para evitar retornar un devolutivo si el id coincide
export const getMaterialConsumo = async (req, res) => {
    try {
        const material = await MaterialConsumo.findOne({
            _id: req.params.id,
            tipo_material: "MaterialConsumo"
        })
            .populate('usuario', 'nombre apellido cuentadante')
            .populate('marca', 'nombre_marca');

        if (!material) return res.status(404).json({ mensaje: "Material de consumo no encontrado." });

        res.json(material);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza un material de consumo. Si se sube nueva imagen, reemplaza la ruta anterior
export const updateMaterialConsumo = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) updates.imagen = `/uploads/${req.file.filename}`;

        // Prevenimos que alguien pueda cambiar el tipo_material desde el body <= RE IMPORTANTE
        delete updates.tipo_material;

        const material = await MaterialConsumo.findOneAndUpdate(
            { _id: req.params.id, tipo_material: "MaterialConsumo" },
            updates,
            { new: true, runValidators: true }
        );

        if (!material) return res.status(404).json({ error: "Material de consumo no encontrado." });

        res.json({ mensaje: "Material de consumo actualizado.", material });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la actualización del material falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        if (req.file) {
            const ruta = path.join("uploads", req.file.filename);
            fs.unlink(ruta, (err) => {
                if (err) console.error("Error eliminando imagen:", err);
            });
        }

        res.status(400).json({ error: error.message });
    }
};

// Elimina un material de consumo por su _id
// Filtramos por tipo_material para no eliminar accidentalmente un devolutivo
export const deleteMaterialConsumo = async (req, res) => {
    try {
        const material = await MaterialConsumo.findOneAndDelete({
            _id: req.params.id,
            tipo_material: "MaterialConsumo"
        });

        if (!material) return res.status(404).json({ error: "Material de consumo no encontrado." });

        res.json({ mensaje: "Material de consumo eliminado." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};