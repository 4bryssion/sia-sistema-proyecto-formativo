import { Router } from "express";

import {
    createUsuario,
    getAllUsuarios,
    getUsuario,
    updateUsuario,
    deleteUsuario,
} from "../controllers/usuariosController.js";

// Middleware de multer: genera nombre único, valida formato jpeg/jpg/png y limita a 5MB
import { uploadImagen as upload } from "../middleware/multerConfig.js"; 

// Para no estar llamando a Router() todo el rato.
const router = Router();

// upload.single('foto') es el middleware que intercepta el archivo antes de que llegue al controlador. 'foto' debe coincidir con el campo del formulario que envía la imagen.
router.post('/', upload.single('foto'), createUsuario);

router.get('/',                            getAllUsuarios);

router.get('/:id',                         getUsuario);

router.put('/:id', upload.single('foto'), updateUsuario);

router.delete('/:id',                      deleteUsuario);

export default router;