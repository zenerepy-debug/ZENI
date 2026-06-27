import express from 'express';
import dotenv from 'dotenv';
import whatsappRouter from './routes/whatsappRoutes.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// Middleware obligatorio para procesar los JSON que envía Meta
app.use(express.json());

// Enlazar las rutas del chatbot bajo la dirección base /whatsapp
app.use('/whatsapp', whatsappRouter);

// Ruta de diagnóstico simple para comprobar que el servidor está encendido
app.get('/', (req, res) => {
  res.send('Servidor del Chatbot Zener funcionando correctamente.');
});

// Configurar puerto dinámico para Railway o local (puerto 3000)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Zener activo en el puerto ${PORT}`);
});
