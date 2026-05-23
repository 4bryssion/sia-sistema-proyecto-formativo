import mongoose from "mongoose";
const Schema = mongoose.Schema;

const marcaSchema = new Schema({

    nombre_marca: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }

});

export default mongoose.model('Marca', marcaSchema);