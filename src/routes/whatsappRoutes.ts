import { Router } from 'express';
import { verifyWebhook, handleWebhookMessage } from '../controllers/whatsappController.js';

const router = Router();

// Ruta de verificación obligatoria para Meta (GET)
router.get('/webhook', verifyWebhook);

// Ruta de recepción de mensajes reales de los clientes (POST)
router.post('/webhook', handleWebhookMessage);

export default router;
