import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Solo lectura: las notificaciones las genera el sistema (ver notify() en el service)
router.get('/', authenticateToken, notificationController.getAll);
router.get('/:id', authenticateToken, notificationController.getById);

export default router;
