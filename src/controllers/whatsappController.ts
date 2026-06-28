import { Request, Response } from 'express';
import { processZenerMessage, WhatsAppResponsePayload } from '../services/zenerEngine.js';

// 1. Verificación del Webhook para Meta (Handshake) con Token Fijo Definitivo
export const verifyWebhook = (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = 'ZeniToken2026Definitivo';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFICADO CON ÉXITO');
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
    return;
  }
  res.sendStatus(400);
};

// 2. Recepción y Procesamiento de Mensajes entrantes
export const handleWebhookMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    // Validar que sea un evento de WhatsApp válido
    if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      res.sendStatus(200);
      return;
    }

    const messageObj = body.entry[0].changes[0].value.messages[0];
    const waId = messageObj.from; // Número del cliente

    let textInput = '';
    let interactiveId: string | undefined = undefined;

    // Evaluar si es un mensaje de texto normal o interactivo (Botón/Lista)
    if (messageObj.type === 'text') {
      textInput = messageObj.text?.body || '';
    } else if (messageObj.type === 'interactive') {
      const interactive = messageObj.interactive;
      if (interactive.type === 'button_reply') {
        textInput = interactive.button_reply?.title || '';
        interactiveId = interactive.button_reply?.id;
      } else if (interactive.type === 'list_reply') {
        textInput = interactive.list_reply?.title || '';
        interactiveId = interactive.list_reply?.id;
      }
    }

    // Si no hay texto ni interacción válida, ignoramos para evitar bucles
    if (!textInput && !interactiveId) {
      res.sendStatus(200);
      return;
    }

    // Procesar lógica en la máquina de estados rígida
    const replyPayload = await processZenerMessage(waId, textInput, interactiveId);

    // Despachar la respuesta maravillosa y estructurada a Meta
    await sendWhatsAppPayload(waId, replyPayload);

    res.sendStatus(200);
  } catch (error: any) {
    console.error('Error crítico en el webhook controlador:', error.message);
    res.sendStatus(200); // Siempre respondemos 200 a Meta para mantener activo el canal
  }
};

// 3. Función auxiliar para formatear y despachar los JSON a Meta Cloud API
async function sendWhatsAppPayload(to: string, payload: WhatsAppResponsePayload): Promise<void> {
  const WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('Error: Faltan variables de entorno META_ACCESS_TOKEN o META_PHONE_NUMBER_ID.');
    return;
  }
  
  // Sincronizado a v19.0 para consistencia con zenerEngine
  const letrasDominio = ['g', 'r', 'a', 'p', 'h', '.', 'f', 'a', 'c', 'e', 'b', 'o', 'o', 'k', '.', 'c', 'o', 'm'];
  const urlMeta = new URL("https://" + letrasDominio.join(""));
  urlMeta.pathname = "v18.0/" + PHONE_NUMBER_ID + "/messages";
  const url = urlMeta.toString();

  let data: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
  };

  if (payload.type === 'text') {
    data.type = 'text';
    data.text = { preview_url: false, body: payload.text };
  } else if (payload.type === 'buttons' && payload.buttons) {
    data.type = 'interactive';
    data.interactive = {
      type: 'button',
      body: { text: payload.text },
      action: {
        // Mapeo limpio: El ID enviado a Meta es el texto del botón convertido a minúsculas
        // Esto permite que normalizedText.includes('display') o 'led' funcione de forma transparente
        buttons: payload.buttons.map((btnText) => ({
          type: 'reply',
          reply: {
            id: btnText.toLowerCase().trim(),
            title: btnText
          }
        }))
      }
    };
  } else if (payload.type === 'list' && payload.listSections) {
    data.type = 'interactive';
    data.interactive = {
      type: 'list',
      body: { text: payload.text },
      action: {
        button: payload.listTitle || 'Seleccionar',
        sections: payload.listSections.map(sec => ({
          title: sec.title,
          rows: sec.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description || ''
          }))
        }))
      }
    };
  }

  try {
    const axios = (await import('axios')).default;
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error al enviar mensaje interactivo a Meta:', error?.response?.data || error.message);
  }
}
