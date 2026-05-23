import mongoose from "mongoose";
const Schema = mongoose.Schema;

const categoriaSchema = new Schema({

    nombre_categoria: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }

});

export default mongoose.model('Categoria', categoriaSchema);