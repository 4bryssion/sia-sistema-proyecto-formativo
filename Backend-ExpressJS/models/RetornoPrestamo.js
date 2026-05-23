import mongoose from "mongoose";
const Schema = mongoose.Schema;

const retornoPrestamoSchema = new Schema({

    // LLave foránea de prestamo
    prestamo: {
        type: Schema.Types.ObjectId,
        ref: "Prestamo",
        required: true
    },

    // LLave foránea de materiales
    material: {
        type: Schema.Types.ObjectId,
        ref: "MaterialConsumo",
        required: true
    },

    cantidad_sobrante: {
        type: Number,
        // required: true, solo si el tipo material es de consumo, validar esto en el controller
    },

    observaciones: {
        type: String,
        maxlength: 255, 
        required: true
    }

}, {
    // Crea/Agrega automáticamente "createdAt" y "updatedAt", y estos se pueden modificar. Al ponerle como valor "False" a alguno, este no se generara
    timestamps: {
        createdAt: "fecha_devolucion",
        updatedAt: false
    }
});

export default mongoose.model('RetornoPrestamo', retornoPrestamoSchema);