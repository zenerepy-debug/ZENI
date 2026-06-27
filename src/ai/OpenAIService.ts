import OpenAI from "openai";
import { ConversationState, ChatMessage } from "../conversation/ConversationState";

export interface ConversationResult {
    state: ConversationState;
    reply: string;
}

export class OpenAIService {
    private readonly client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    async processConversation(
        previousState: ConversationState,
        message: string
    ): Promise<ConversationResult> {
        
        // Estructuración exacta bajo el estándar estricto de desarrollo de OpenAI
        const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "developer",
                content: `
Tu nombre es ZENI, el agente virtual humano de ZENER Servicio Técnico.
Atiendes por WhatsApp las 24 horas. Tu único objetivo es calificar clientes de forma lógica y humana, basándote exclusivamente en el siguiente entrenamiento del negocio. No actúes como un formulario ni repitas preguntas rígidas.

# ENTRENAMIENTO EXCLUSIVO DE TU NEGOCIO (ZENER):
- Cobertura: Asunción, Lambaré, Villa Elisa, Ñemby, San Antonio, Fernando de la Mora, Capiatá, San Lorenzo, Areguá, Luque, Limpio, Mariano Roque Alonso. (Reconoce errores ortográficos y abreviaciones). Si el cliente menciona estar en cualquiera de estas ciudades, está DENTRO de la cobertura. Si está fuera, descalifica amablemente.
- Fallas de Display (pantalla rota, rota, rajada, golpes, manchas fijas): NO CALIFICA. Cierra amablemente.
- TVs manipuladas por el cliente: NO CALIFICA.
- Fallas de Fuente, Placa o Iluminación LED (política: se cambian TODOS los LED): CALIFICA para transferir.
- No das presupuestos ni agendas visitas. No digas "no damos presupuesto por whatsapp", solo deriva al técnico para que él lo dé por WhatsApp.

# FLUJO RECOMENDADO:
1. Saludo (solo primer mensaje) y consultar ciudad.
2. Consultar síntoma o falla para descartar display de inmediato.
3. Consultar marca y tamaño exacto (si no sabe, pedir foto de la etiqueta trasera).

# REGLA DE TRANSFERENCIA INTERNA:
Si el cliente proporcionó los datos correctos y califica para reparación de placa/fuente/leds dentro de las ciudades de cobertura (incluyendo Villa Elisa, Lambaré, etc.), debes incluir obligatoriamente la frase exacta "derivado al técnico" al final de tu respuesta de texto.
`
            }
        ];

        // Carga fidedigna del historial de WhatsApp en la línea de ejecución
        for (const msg of previousState.history) {
            conversationMessages.push({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content
            });
        }

        // Mensaje actual del cliente
        conversationMessages.push({
            role: "user",
            content: message
        });

        // Petición directa al motor cognitivo
        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationMessages,
            temperature: 0.3 // Reduce la creatividad de la IA para que no invente ni ignore las ciudades
        });

        const replyText = response.choices[0]?.message?.content || "";

        const updatedHistory: ChatMessage[] = [
            ...previousState.history,
            { role: "user", content: message },
            { role: "assistant", content: replyText }
        ];

        const updatedState: ConversationState = {
            ...previousState,
            city: previousState.city || "CONVERSACION_EN_CURSO",
            brand: previousState.brand || "CONVERSACION_EN_CURSO",
            symptom: previousState.symptom || "CONVERSACION_EN_CURSO",
            history: updatedHistory.slice(-20),
            lastCustomerMessage: message,
            updatedAt: Date.now()
        };

        return {
            state: updatedState,
            reply: replyText
        };
    }
}
