import { Router } from 'express';
import { verifyWebhook, handleWebhookMessage } from '../controllers/whatsappController.js';

const router = Router();

// Puente de compatibilidad para tus variables del archivo .env
process.env.VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
process.env.WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN;
process.env.PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

// Ruta de verificación obligatoria para Meta (GET)
router.get('/webhook', verifyWebhook);

// Ruta de recepción de mensajes reales de los clientes (POST)
router.post('/webhook', handleWebhookMessage);

export default router;
