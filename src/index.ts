import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (_, res) => {
    res.json({
        proyecto: "ZENI",
        estado: "OK",
        mensaje: "Servidor funcionando"
    });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`🚀 ZENI iniciado en http://localhost:${PORT}`);
});
