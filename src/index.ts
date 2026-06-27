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
    res.sendStatus(200); // Respuesta inmediata para evitar reintentos de Meta

    try {
        const changes = req.body?.entry?.[0]?.changes?.[0]?.value;
        const message = changes?.messages?.[0];
        if (!message) return;

        let customerMessage = "";

        // Captura multimedia inteligente sin detener la ejecución
        if (message.text?.body) {
            customerMessage = message.text.body;
        } else if (message.type === "image") {
            customerMessage = "[El cliente envió una foto de la etiqueta del modelo o del televisor]";
        } else if (message.type === "audio") {
            customerMessage = "[El cliente envió un mensaje de voz o audio]";
        } else {
            customerMessage = "[El cliente envió un archivo multimedia no soportado]";
        }

        const phone = message.from;
        
        // Ejecución en el motor lógico de OpenAI
        const reply = await engine.process(phone, customerMessage);

        // 1. Despacho del mensaje de respuesta al cliente de WhatsApp
        await axios.post(
            `https://facebook.com{process.env.META_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                text: { body: reply }
            },
            {
                headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` }
            }
        );

        // 2. Verificación de calificación en caliente para alertar al técnico
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
        console.error("Error operativo en el webhook:", error);
    }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`🚀 ZENI operativo en puerto ${PORT}`);
});
