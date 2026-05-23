import mongoose from "mongoose";
const Schema = mongoose.Schema;

const prestamoSchema = new Schema({

    // Llave foránea de usuario
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    // Llave foránea de materiales
    material: { 
        type: Schema.Types.ObjectId,
        ref: "MaterialConsumo",
        required: true
    },

    cantidad_prestada: {
        type: Number,
        required: true
    },

    grupo_aprendices: {
        type: Number,
        required: true
    },

    justificacion_uso: {
        type: String,
        maxlength: 255, 
        required: true
    },

    fecha_devolucion: {
        type: Date,
        required: true
    }

}, {
    // Crea/Agrega automáticamente "createdAt" y "updatedAt", y estos se pueden modificar. Al ponerle como valor "False" a alguno, este no se generara
    timestamps: {
        createdAt: "fecha_prestamo",
        updatedAt: false
    }
});

export default mongoose.model('Prestamo', prestamoSchema);