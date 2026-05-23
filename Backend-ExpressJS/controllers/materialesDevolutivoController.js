// TENER MUCHO CUIDADO AL HACER LAS CONSULTAS DEBIDO A LA ESTRUCTURA DE HERENCIA ENTRE MATERIALES DE CONSUMO Y DEVOLUTIVOS.

// Debido a que MaterialConsumo es la clase padre y que esta en MongoDB se guardara como Materiales, esta colección guardara los documentos de materiales devolutivos y de consumo.

// Si se hace la típica consulta de "const materiales = await MaterialConsumo.find();" Esta traera TODOS los materiales ya sean de consumo o devolutivos.

// Para hacer la consulta por el tipo no se debe buscar por tipo_material a diferencia de MaterialConsumo ¿POR QUË? -Debido a qué en MaterialDevolutivo mongoose agrega internamente de forma automática { tipo_material: "MaterialDevolutivo" } esto gracias a que la clase padre hereda para sus clases hijas la discriminatorKey: "tipo_material" y MaterialDevolutivo la usa y crea el tipo_material: "MaterialDevolutivo"

// controllers/MaterialDevolutivoController.js

// Importamos el modelo hijo. Mongoose automáticamente agrega
// { tipo_material: "MaterialDevolutivo" } en todas sus consultas
import MaterialDevolutivo from "../models/MaterialDevolutivo.js";
import path from "path";
import fs from "fs";

// Función auxiliar para eliminar múltiples archivos guardados por Multer
// La usamos porque este controlador maneja 2 archivos (imagen y ficha_tecnica)
const eliminarArchivos = (files) => {
    files.forEach(file => {
        if (file) {
            const ruta = path.join("uploads", file.filename);
            fs.unlink(ruta, (err) => {
                if (err) console.error("Error eliminando archivo:", err);
            });
        }
    });
};

// --- Controladores CRUD ---

// Crea un nuevo material devolutivo. Requiere imagen y ficha_tecnica obligatoriamente
export const createMaterialDevolutivo = async (req, res) => {
    try {
        // Cuando se usan múltiples archivos con upload.fields(), multer los organiza en req.files como un objeto donde cada key es el nombre del campo.
        // Ejemplo de como llega req.files:
        /* {
              imagen: [ { filename: 'foto_123.jpg', ... } ],
              ficha_tecnica: [ { filename: 'ficha_456.pdf', ... } ]
            } */
        
        // Validamos primero que el cliente haya enviado archivos en la request.
        // Si req.files es undefined significa que no se adjuntó ningún archivo
        if (!req.files) return res.status(400).json({ error: "No se enviaron archivos." });

        // El operador ?. (optional chaining) evita un error si req.files es undefined.
        // Con req.files ya validado, usamos ?. solo para proteger el acceso a cada campo individual, ya que podría llegar uno sin el otro.
        // El [0] accede al primer archivo del array ya que maxCount: 1 en la ruta garantiza que solo puede llegar un archivo por campo
        const imagen = req.files.imagen?.[0];
        const fichaTecnica = req.files.ficha_tecnica?.[0];

        // Validamos cada archivo por separado para indicarle al cliente exactamente cuál falta.
        // Antes de retornar limpiamos cualquier archivo que multer haya guardado para evitar huérfanos en uploads/
        if (!imagen) {
            eliminarArchivos([fichaTecnica]);
            return res.status(400).json({ error: "La imagen es requerida." });
        }
        if (!fichaTecnica) {
            eliminarArchivos([imagen]);
            return res.status(400).json({ error: "La ficha técnica es requerida." });
        }

        // Spread del body para no mutar directamente el objeto original de la request
        const data = { ...req.body };

        // Guardamos las rutas relativas de los archivos subidos.
        // Usamos .filename porque multer ya generó el nombre único en la configuración de storage
        data.imagen = `/uploads/${imagen.filename}`;
        data.ficha_tecnica = `/uploads/${fichaTecnica.filename}`;

        // Creamos la instancia en memoria para que Mongoose aplique todas las validaciones del Schema antes de escribir en MongoDB
        const material = new MaterialDevolutivo(data);

        // Guardamos el documento en la base de datos solo si pasó todas las validaciones
        await material.save();

        res.status(201).json({ mensaje: "Material devolutivo creado.", material });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la creación del material falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        eliminarArchivos([
            req.files?.imagen?.[0],
            req.files?.ficha_tecnica?.[0]
        ]);

        res.status(400).json({ error: error.message });
    }
};

// Retorna SOLO los materiales devolutivos
// NO necesitamos filtrar por tipo_material porque Mongoose lo hace automáticamente
// gracias al discriminator pattern heredado de MaterialConsumo
export const getAllMaterialesDevolutivos = async (req, res) => {
    try {
        const materiales = await MaterialDevolutivo.find()
            .populate('usuario', 'nombre apellido cuentadante')
            .populate('marca', 'nombre_marca')
            .populate('categoria', 'nombre_categoria')
            // Este sort, ordena los materiales de forma Ascendente A => Z o 0 => 9
            .sort({ nombre_material: 1 });

        res.json(materiales);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un material devolutivo específico por su _id
export const getMaterialDevolutivo = async (req, res) => {
    try {
        const material = await MaterialDevolutivo.findById(req.params.id)
            .populate('usuario', 'nombre apellido cuentadante')
            .populate('marca', 'nombre_marca')
            .populate('categoria', 'nombre_categoria');

        if (!material) return res.status(404).json({ mensaje: "Material devolutivo no encontrado." });

        res.json(material);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza un material devolutivo. Soporta actualización de imagen y/o ficha_tecnica
export const updateMaterialDevolutivo = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Actualizamos solo los archivos que se hayan enviado nuevamente
        if (req.files?.imagen?.[0]) updates.imagen = `/uploads/${req.files.imagen[0].filename}`;

        if (req.files?.ficha_tecnica?.[0]) updates.ficha_tecnica = `/uploads/${req.files.ficha_tecnica[0].filename}`;

        // Prevenimos que alguien pueda cambiar el tipo_material desde el body <= RE IMPORTANTE
        delete updates.tipo_material;

        const material = await MaterialDevolutivo.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!material) return res.status(404).json({ error: "Material devolutivo no encontrado." });

        res.json({ mensaje: "Material devolutivo actualizado.", material });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la actualización del material falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        eliminarArchivos([
            req.files?.imagen?.[0],
            req.files?.ficha_tecnica?.[0]
        ]);

        res.status(400).json({ error: error.message });
    }
};

// Elimina un material devolutivo por su _id
export const deleteMaterialDevolutivo = async (req, res) => {
    try {
        const material = await MaterialDevolutivo.findByIdAndDelete(req.params.id);

        if (!material) return res.status(404).json({ error: "Material devolutivo no encontrado." });

        res.json({ mensaje: "Material devolutivo eliminado." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};