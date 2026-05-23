import express from "express";
import cors from "cors";
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';

import connectDB from "./config/database.js";
import Routes from './routes/Routes.js';
import errorHandler from './middleware/errorHandler.js';

// Esta es la conexión a la DB
connectDB();

const app = express();
const PORT = 5000;

app.use(cors());

// Desde Express 4.16+, express.json() es internamente el mismo body-parser. Cada request pasa el parseo de JSON dos veces innecesariamente, consumiendo recursos dobles sin ningún beneficio.
// conservar solo express.json().
app.use(express.json());
// app.use(bodyParser.json());// Permite leer datos en modo json
app.use(bodyParser.urlencoded({extended: true}));

// Conexión con prefijo api, al enrutador "global" por así decirlo.
app.use('/api', Routes);

// Este es el único end-point en index.js pero solo es para revisar que el backend este funcionando correctamente durante el desarrollo
app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

// En caso de trabajar con imagenes:
const uploadsPath = path.resolve('uploads');
if(!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, {recursive: true});
}

app.use('/uploads', express.static(uploadsPath));

// Debe registrarse al final de todo para atrapar errores de todas las rutas y middlewares
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});