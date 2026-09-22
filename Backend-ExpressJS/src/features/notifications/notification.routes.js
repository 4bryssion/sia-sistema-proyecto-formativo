import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// (p50) Todas las rutas son "las mías": no reciben un id de usuario por
// parámetro, lo toman del token. Así no existe forma de pedir las
// notificaciones de otra persona.
//
// Se eliminó `GET /:id`: el listado ya devuelve el aviso completo y el modal de
// detalle trabaja sobre la fila que ya tiene. Era una ruta que nadie llamaba.
router.get('/', authenticateToken, notificationController.getAll);

// Punto verde de la campana.
router.get('/unread', authenticateToken, notificationController.unread);
router.post('/seen', authenticateToken, notificationController.markSeen);

export default router;
