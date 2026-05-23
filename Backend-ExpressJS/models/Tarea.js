import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tareaSchema = new Schema({

    // LLave foránea de usuario
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    nombre_tarea: {
        type: String,
        required: true,
        trim: true
    },

    descripcion: {
        type: String,
        maxlength: 255,
        required: true
    },

    estado: {
        // Activad - Inactiva
        type: Boolean,
        required: true,
        default: true
    }

});

export default mongoose.model('Tarea', tareaSchema);