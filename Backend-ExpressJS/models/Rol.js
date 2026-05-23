import mongoose from "mongoose";
const Schema = mongoose.Schema;

const rolSchema = new Schema({

    nombre_rol: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    descripcion: {
        type: String,
        maxlength: 255
    }

});

export default mongoose.model('Rol', rolSchema);