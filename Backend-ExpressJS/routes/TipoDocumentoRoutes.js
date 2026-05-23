import { Router } from "express";
import {
    getAllTiposDocumento,
    getTipoDocumento
} from "../controllers/tiposDocumentoController.js";

const router = Router();

router.get('/',    getAllTiposDocumento);
router.get('/:id', getTipoDocumento);

export default router;