import express from 'express';
import cors from 'cors';

// ===============================================

import errorHandler from './middleware/errorHandler.js';

// ===============================================

import userRoutes from './features/users/user.routes.js';

import authRoutes from './features/auth/auth.routes.js';

import accessRoutes from './features/access/access.routes.js';

import documentTypeRoutes from './features/document-types/documentType.routes.js';

import brandRoutes from './features/brands/brand.routes.js';

import categoryRoutes from './features/categories/category.routes.js';

import permissionRoutes from './features/permissions/permission.routes.js';

import groupRoutes from './features/groups/group.routes.js';

import consumableMaterialRoutes from './features/consumable-materials/consumableMaterial.routes.js';

import returnableMaterialRoutes from './features/returnable-materials/returnableMaterial.routes.js';

import loanRoutes from './features/loans/loan.routes.js';

import loanReturnRoutes from './features/loan-returns/loanReturn.routes.js';

import taskRoutes from './features/tasks/task.routes.js';
// (P43) Notificaciones / logs del sistema
import notificationRoutes from './features/notifications/notification.routes.js';

// ===============================================

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

// ===============================================

app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/access', accessRoutes);

app.use('/api/document-types', documentTypeRoutes);

app.use('/api/brands', brandRoutes);

app.use('/api/categories',           categoryRoutes);

app.use('/api/permissions',          permissionRoutes);

app.use('/api/groups', groupRoutes);

app.use('/api/consumable-materials', consumableMaterialRoutes);

app.use('/api/returnable-materials', returnableMaterialRoutes);

app.use('/api/loans', loanRoutes);

app.use('/api/loan-returns',         loanReturnRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// ===============================================

app.get('/', (req, res) => res.json({ status: 'Servidor funcionando', version: '2.0.0' }));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// ===============================================

app.use(errorHandler);

// ===============================================

export default app;
