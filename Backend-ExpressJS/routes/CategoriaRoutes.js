import { Router } from "express";
import {
    getAllCategorias,
    getCategoria
} from "../controllers/categoriasController.js";

const router = Router();

router.get('/',    getAllCategorias);
router.get('/:id', getCategoria);

export default router;