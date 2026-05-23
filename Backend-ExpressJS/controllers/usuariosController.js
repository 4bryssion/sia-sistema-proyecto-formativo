// Importamos el modelo Usuario para interactuar con la colección en MongoDB
import Usuario from "../models/Usuario.js";
import path from "path";
import fs from "fs";

// --- Controladores CRUD ---

// Crea un nuevo usuario con los datos del body y la foto si se adjunta
export const createUsuario = async (req, res) => {
    try {
        // Validamos que se haya adjuntado una foto antes de intentar crear el usuario ya que la foto es obligatoria
        if (!req.file) return res.status(400).json({ error: "La foto es requerida." });
        
        const data = { ...req.body };
        data.foto = `/uploads/${req.file.filename}`;

        const usuario = await Usuario.create(data);
        res.status(201).json({ mensaje: "Usuario creado.", usuario });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la creación del usuario falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        if (req.file) {
            const ruta = path.join("uploads", req.file.filename);
            fs.unlink(ruta, (err) => {
                if (err) console.error("Error eliminando foto:", err);
            });
        }

        res.status(400).json({ error: error.message });
    }
};

// Retorna todos los usuarios ordenados alfabéticamente por nombre
// Popula rol y tipo_documento para mostrar sus datos completos en lugar del ObjectId, esto dado que, rol y tipo_documento son modelos de llave foranea dentro de Usuarios
export const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find()
            .populate('rol', 'nombre')
            .populate('tipo_documento', 'nombre')
            // Este sort, ordena los usuarios de forma Ascendente A => Z o 0 => 9
            .sort({ nombre: 1 });

        res.json(usuarios);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retorna un usuario específico buscándolo por su _id de MongoDB
export const getUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id)
            .populate('rol', 'nombre')
            .populate('tipo_documento', 'nombre');

        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado." });

        res.json(usuario);

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};

// Actualiza los datos de un usuario. Si se sube nueva foto, reemplaza la ruta anterior
export const updateUsuario = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Si se adjuntó una nueva foto, actualizamos la ruta en el campo 'foto'
        if (req.file) updates.foto = `/uploads/${req.file.filename}`;

        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true } // 'new' retorna el doc actualizado, 'runValidators' re-valida el Schema
        );

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });

        res.json({ mensaje: "Usuario actualizado.", usuario });

    } catch (error) {
        // Como lo que guarda la imagen es el multer, si la actualización del usuario falla, la imagen aun así sera guardada en uploads, entonces una vez se atrape un error, la imagen sera eliminada de forma obligada
        if (req.file) {
            const ruta = path.join("uploads", req.file.filename);
            fs.unlink(ruta, (err) => {
                if (err) console.error("Error eliminando foto:", err);
            });
        }

        res.status(400).json({ error: error.message });
    }
};

// Elimina un usuario de la base de datos por su _id
export const deleteUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });

        res.json({ mensaje: "Usuario eliminado." });

    } catch (error) {
        res.status(400).json({ error: "ID inválido." });
    }
};