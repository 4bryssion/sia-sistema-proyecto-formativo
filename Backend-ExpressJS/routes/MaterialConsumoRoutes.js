import { Router } from "express";

import {
    createMaterialConsumo,
    getAllMaterialesConsumo,
    getMaterialConsumo,
    updateMaterialConsumo,
    deleteMaterialConsumo,
} from "../controllers/materialesConsumoController.js";

// Middleware de multer: genera nombre único, valida formato jpeg/jpg/png y limita a 5MB
import { uploadImagen as upload } from "../middleware/multerConfig.js"; 

// Para no estar llamando a Router() todo el rato.
const router = Router();


router.post('/', upload.single('imagen'), createMaterialConsumo);

router.get('/',                               getAllMaterialesConsumo);

router.get('/:id',                            getMaterialConsumo);

router.put('/:id', upload.single('imagen'), updateMaterialConsumo);

router.delete('/:id',                         deleteMaterialConsumo);


export default router;