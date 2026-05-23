import { Router } from "express";
import {
    createPrestamo,
    getAllPrestamos,
    getPrestamo,
    updatePrestamo,
    deletePrestamo
} from "../controllers/prestamosController.js";

const router = Router();

router.post('/', createPrestamo);
router.get('/', getAllPrestamos);
router.get('/:id', getPrestamo);
router.put('/:id', updatePrestamo);
router.delete('/:id', deletePrestamo);

export default router;
