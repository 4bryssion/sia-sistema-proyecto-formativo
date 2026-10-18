import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// (p50) Todas las rutas son "las mías": no reciben un id de usuario por
// parámetro, lo toman del token. Así no existe forma de pedir las
// notificaciones de otra persona.
//
// Se eliminó `GET /:id`: el listado ya devuelve el aviso completo y el modal de
// detalle trabaja sobre la fila que ya tiene. Era una ruta que nadie llamaba.
// (p51) Las tres exigen `list_notifications`. No lo hacían: bastaba un token,
// así que un grupo al que se le quitara el permiso seguía leyendo sus avisos
// por el API aunque el frontend no le dejara abrir la pantalla. No era una fuga
// de datos ajenos —cada ruta solo devuelve lo propio— pero sí un permiso que se
// podía revocar sin que nada cambiara, que es exactamente lo que no debe pasar.
//
// Dentro, el service distingue por `list_system_notifications` quién ve el
// panorama del sistema y quién sus propias tareas. Eso sigue igual.
router.get('/', authenticateToken, requirePermission('list_notifications'), notificationController.getAll);

// Punto verde de la campana.
router.get('/unread', authenticateToken, requirePermission('list_notifications'), notificationController.unread);
router.post('/seen', authenticateToken, requirePermission('list_notifications'), notificationController.markSeen);

export default router;
