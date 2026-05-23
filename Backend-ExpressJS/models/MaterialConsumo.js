import mongoose from "mongoose";
const Schema = mongoose.Schema;

const materialConsumoSchema = new Schema({

  // Esta llave foranea es para conocer que usuario es el cuentadante del material.
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    marca: {
        type: Schema.Types.ObjectId,
        ref: "Marca",
        required: true
    },

    // No debería ser obligatoria, no todos los materiales la tienen, si no es poner default: null
    placa_sena: {
        type: String,
        unique: true
    },

    nombre_material: {
        type: String,
        required: true,
        maxlength: 100
    },

    // Encontrar la forma de validar la carga de la imagen. (.jpg .jpeg .png)
    imagen: {
        type: String,
        required: true
    },

    cantidad: {
        type: Number,
        // required: true, si tiene o no placa sena, validar esto en el controller
    },

    valor_unitario: {
        type: Number,
        required: true
    },

    valor_total: {
        type: Number,
        required: true
    },

    estado: {
        type: String,
        enum: ["Disponible", "No disponible", "Mantenimiento", "En prestamo", "Traslado", "Baja"],
        required: true
    },

    descripcion: {
        type: String,
        maxlength: 255,
        required: true
    },

    fecha_compra: {
        type: Date,
        required: true
    },

    ubicacion: {
        type: String,
        maxlength: 100,
        required: true
    },

    tipo_material: {
      type: String,
      enum: ["MaterialConsumo", "MaterialDevolutivo"],
      default: "MaterialConsumo"
    }

}, {
  discriminatorKey: "tipo_material",
  timestamps: true
})


// Esto hace que en la DB de MongoDB, se cree únicamente una colección con nombre el cual solo sera materiales, y dentro de este se guardaran los documentos de MaterialConsumo y MaterialDevolutivo ya que una clase padre también guarda los documentos de sus clases hijas.

const MaterialConsumo = mongoose.model(
  "MaterialConsumo",
  materialConsumoSchema,
  "materiales"
);

export default MaterialConsumo;