import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { ConversationEngine } from "./conversation/ConversationEngine";

dotenv.config();
const app = express();
app.use(express.json());

const engine = new ConversationEngine();

app.get("/", (_, res) => {
    res.json({ status: "ok" });
});

app.get("/webhook", (req, res) => {
    if (
        req.query["hub.mode"] === "subscribe" &&
        req.query["hub.verify_token"] === process.env.META_VERIFY_TOKEN
    ) {
        return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
    res.sendStatus(200); // Respuesta inmediata a Meta

    try {
        const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message) return;

        let customerMessage = "";

        // Identificar el tipo de mensaje entrante sin bloquear el flujo
        if (message.text?.body) {
            customerMessage = message.text.body;
        } else if (message.type === "image") {
            customerMessage = "[El cliente envió una foto de la etiqueta de su televisor o del equipo]";
        } else if (message.type === "audio") {
            customerMessage = "[El cliente envió un mensaje de audio]";
        } else {
            customerMessage = "[El cliente envió un archivo multimedia no soportado]";
        }

        const phone = message.from;
        
        // Procesar la conversación con el único motor lógico (OpenAI)
        const reply = await engine.process(phone, customerMessage);

        // 1. Enviar respuesta al cliente en WhatsApp
        await axios.post(
            `https://facebook.com{process.env.PORT === "3000" ? process.env.META_PHONE_NUMBER_ID : process.env.META_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                text: { body: reply }
            },
            {
                headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` }
            }
        );

        // 2. LÓGICA DE DETECCIÓN DE CALIFICACIÓN Y ENVÍO AL TÉCNICO
        // Volvemos a consultar el estado guardado por el motor para saber si ya calificó
        const currentState = (engine as any).repository.get(phone);
        
        if (
            currentState && 
            currentState.city && 
            currentState.brand && 
            currentState.symptom && 
            currentState.displayFailure === false && 
            currentState.manipulated === false
        ) {
            const numeroTecnico = "595981121588";
            const enlaceWhatsapp = `https://wa.me{phone}`;
            
            const mensajeAlTecnico = `⚠️ *NUEVO CLIENTE CALIFICADO - ZENI* \n\n` +
                                     `• *Cliente:* ${enlaceWhatsapp}\n` +
                                     `• *Ciudad:* ${currentState.city}\n` +
                                     `• *Marca:* ${currentState.brand}\n` +
                                     `• *Tamaño:* ${currentState.size || "No especificado"}\n` +
                                     `• *Síntoma:* ${currentState.symptom}`;

            // Enviar alerta interna al técnico desde el número del bot
            await axios.post(
                `https://facebook.com{process.env.META_PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: numeroTecnico,
                    text: { body: mensajeAlTecnico }
                },
                {
                    headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` }
                }
            );
        }

    } catch (error) {
        console.error("Error en webhook:", error);
    }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`🚀 ZENI iniciado en puerto ${PORT}`);
});
