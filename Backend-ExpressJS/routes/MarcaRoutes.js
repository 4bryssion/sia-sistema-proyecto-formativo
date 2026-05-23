import { Router } from "express";
import {
    getAllMarcas,
    getMarca,
    createMarca,
    updateMarca,
    deleteMarca
} from "../controllers/marcasController.js";

const router = Router();

router.post('/', createMarca);
router.get('/', getAllMarcas);
router.get('/:id', getMarca);
router.put('/:id', updateMarca);
router.delete('/:id', deleteMarca);

export default router;