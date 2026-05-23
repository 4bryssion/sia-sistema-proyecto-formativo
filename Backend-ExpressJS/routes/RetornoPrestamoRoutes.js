import { Router } from "express";
import {
    createRetornoPrestamo,
    getAllRetornosPrestamo,
    getRetornoPrestamo
} from "../controllers/retornoPrestamosController.js";

const router = Router();

router.post('/',      createRetornoPrestamo);
router.get('/',       getAllRetornosPrestamo);
router.get('/:id',    getRetornoPrestamo);

export default router;