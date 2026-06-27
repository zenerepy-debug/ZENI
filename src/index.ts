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
    res.sendStatus(200);

    try {
        const changes = req.body?.entry?.[0]?.changes?.[0]?.value;
        const message = changes?.messages?.[0];
        if (!message) return;

        let customerMessage = "";

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
        
        const reply = await engine.process(phone, customerMessage);

        // 1. Envío de respuesta al cliente
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

        // 2. Monitoreo de Transferencia por Contexto Histórico Estables
        const currentState = engine.repository.get(phone);
        
        // Si el estado tiene ciudad y marca fijas guardadas, y la respuesta generó la transferencia interna
        if (currentState && currentState.city && currentState.brand) {
            // El motor detecta la condición de éxito de la IA
            const numeroTecnico = "595981121588";
            const enlaceWhatsapp = `https://wa.me{phone}`;
            
            // Solo notificamos al técnico si ya completamos la validación global
            if (currentState.symptom && reply.includes("derivado al técnico") || reply.includes("derivará su caso")) {
                const mensajeAlTecnico = `⚠️ *NUEVO CLIENTE CALIFICADO - ZENI* \n\n` +
                                         `• *Cliente:* ${enlaceWhatsapp}\n` +
                                         `• *Ciudad:* ${currentState.city}\n` +
                                         `• *Marca:* ${currentState.brand}\n` +
                                         `• *Tamaño:* ${currentState.size || "No especificado"}\n` +
                                         `• *Síntoma:* ${currentState.symptom || "Ver historial de chat"}`;

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
        }

    } catch (error) {
        console.error("Error en la operación del webhook:", error);
    }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`🚀 ZENI iniciado y operativo en puerto ${PORT}`);
});
