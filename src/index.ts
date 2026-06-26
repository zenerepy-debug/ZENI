import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { ConversationEngine } from "./conversation/ConversationEngine";

dotenv.config();

const app = express();

app.use(express.json());

const engine = new ConversationEngine();

app.get("/", (_, res) => {
    res.json({
        status: "ok"
    });
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

    const message =
        req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message?.text?.body) return;

    const phone = message.from;

    const customerMessage = message.text.body;

    const reply = await engine.process(
        phone,
        customerMessage
    );

    await axios.post(
        `https://graph.facebook.com/v23.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to: phone,
            text: {
                body: reply
            }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`
            }
        }
    );

});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
    console.log(`🚀 ZENI iniciado en puerto ${PORT}`);
});