import { Router } from "express";
import {
    createTarea,
    getAllTareas,
    getTarea,
    updateTarea,
    deleteTarea
} from "../controllers/tareasController.js";

const router = Router();

router.post('/',      createTarea);
router.get('/',       getAllTareas);
router.get('/:id',    getTarea);
router.put('/:id',    updateTarea);
router.delete('/:id', deleteTarea);

export default router;