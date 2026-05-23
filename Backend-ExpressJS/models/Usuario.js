import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const usuarioSchema = new Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    apellido: {
        type: String,
        required: true,
        trim: true
    },

    // La llave foránea de Rol
    rol: {
        type: Schema.Types.ObjectId,
        ref: "Rol",
        required: true
    },

    // La llave foránea de TipoDocumento
    tipo_documento: {
        type: Schema.Types.ObjectId,
        ref: "TipoDocumento",
        required: true
    },

    numero_documento: {
        type: String,
        required: true,
        unique: true
    },

    fecha_finalizacion: {
        type: Date,
        required: true
    },

    email: {
        type: String,
        lowercase: true, // Normaliza correos cualquier mayúscula a minúscula.
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Email inválido"] // Evita cosas como => usuario@@gmail / correo.com
    },

    telefono: {
        type: String,
        required: true
    },

    segundo_telefono: {
        type: String,
        default: null
    },

    direccion: {
        type: String,
        required: true
    },

    estado: {
        type: Boolean,
        default: true
    },

    // Encontrar una forma de validar el tipo de img para cargar. (.jpg .jpeg .png)
    foto: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8 // No acepta contraeñas cortas
    },

    cuentadante: {
        type: String,
        default: "Solidario",
        required: true
    }

}, {
    // Crea/Agrega automáticamente "createdAt" y "updatedAt", y estos se pueden modificar.
    timestamps: {
        createdAt: "fecha_inicio",
        updatedAt: "fecha_actualizacion"
    }
});

export default mongoose.model('Usuario', usuarioSchema);