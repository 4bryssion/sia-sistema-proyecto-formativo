import { Router } from "express";


import UsuarioRoutes from "./UsuarioRoutes.js";
import MaterialConsumoRoutes from "./MaterialConsumoRoutes.js";
import MaterialDevolutivoRoutes from "./MaterialDevolutivoRoutes.js";
import CategoriaRoutes from "./CategoriaRoutes.js"
import MarcaRoutes from "./MarcaRoutes.js";
import PrestamoRoutes from "./PrestamoRoutes.js";
import RetornoPrestamoRoutes from "./RetornoPrestamoRoutes.js";
import TareaRoutes from "./TareaRoutes.js";
import TipoDocumentoRoutes from "./TipoDocumentoRoutes.js";


const router = Router();


router.use('/usuarios', UsuarioRoutes);

router.use('/materiales-consumo',     MaterialConsumoRoutes);

router.use('/materiales-devolutivos', MaterialDevolutivoRoutes);

router.use('/categorias', CategoriaRoutes);

router.use('/marcas', MarcaRoutes);

router.use('/prestamos', PrestamoRoutes);

router.use('/retornos-prestamo', RetornoPrestamoRoutes);

router.use('/tareas', TareaRoutes);

router.use('/tipos-documento',        TipoDocumentoRoutes);


export default router;