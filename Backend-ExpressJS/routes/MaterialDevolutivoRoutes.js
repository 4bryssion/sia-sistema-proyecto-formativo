// routes/MaterialDevolutivoRoutes.js
import { Router } from "express";

import {
    createMaterialDevolutivo,
    getAllMaterialesDevolutivos,
    getMaterialDevolutivo,
    updateMaterialDevolutivo,
    deleteMaterialDevolutivo,
} from "../controllers/materialesDevolutivoController.js";

// Middleware de multer: genera nombre único, valida imágenes jpeg/jpg/png y archivos pdf/excel, limita a 5MB
import { uploadArchivos as upload } from "../middleware/multerConfig.js"; 

// Para no estar llamando a Router() todo el rato.
const router = Router();


// Usamos .fields() en vez de .single() porque este modelo maneja dos archivos:

// 'imagen' (jpg/png) y 'ficha_tecnica' (pdf/excel)

// El maxCount: 1 limita a que cada campo solo tenga un archivo el cual dentro del controlador de crear sera un array de un solo indice osea [0]

router.post('/', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'ficha_tecnica', maxCount: 1 }]), createMaterialDevolutivo);

router.get('/',                               getAllMaterialesDevolutivos);

router.get('/:id',                            getMaterialDevolutivo);

router.put('/:id', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'ficha_tecnica', maxCount: 1 }]), updateMaterialDevolutivo);

router.delete('/:id',                         deleteMaterialDevolutivo);


export default router;