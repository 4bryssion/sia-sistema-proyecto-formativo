import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const uploadsPath = path.resolve('uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
