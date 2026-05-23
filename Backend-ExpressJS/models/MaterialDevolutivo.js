import mongoose from "mongoose";
const Schema = mongoose.Schema;

import MaterialConsumo from "./MaterialConsumo.js";

const MaterialDevolutivo = MaterialConsumo.discriminator("MaterialDevolutivo", new Schema({

    categoria: {
        type: Schema.Types.ObjectId,
        ref: "Categoria",
        required: true
    },

    modelo: {
        type: String,
        maxlength: 100,
        required: true
    },

    serial: {
        type: String,
        unique: true,
        required: true
    },

    // Averiguar como se valida el tipo de archivo al cargar. (pdf, png, excel)
    ficha_tecnica: {
        type: String,
        required: true
    },

    // Esto solo se puede si la categoria es "Muebles y Enseres" Preguntar como hacer que aparezca si es la categoria adecuada.
    dimensiones: {
        type: String,
        maxlength: 100,
        required: false
    }

  })
);

export default MaterialDevolutivo;