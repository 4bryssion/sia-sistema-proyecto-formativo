import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tipoDocumentoSchema = new Schema({

    nombre_documento: {
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

export default mongoose.model('TipoDocumento', tipoDocumentoSchema);