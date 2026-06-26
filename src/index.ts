import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

  const message =
    req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message?.text?.body) return;

  const from = message.from;
  const text = message.text.body;

  const completion = await openai.responses.create({
    model: "gpt-5.5",
    input: text
  });

  const reply = completion.output_text;

  await axios.post(
    `https://graph.facebook.com/v23.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: from,
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

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`🚀 ZENI http://localhost:${PORT}`);
});
