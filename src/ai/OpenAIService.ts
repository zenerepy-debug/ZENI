import OpenAI from "openai";
import { ConversationState, ChatMessage } from "../conversation/ConversationState";

export interface ConversationResult {
    state: ConversationState;
    reply: string;
}

interface GPTResponse {
    memory?: Partial<ConversationState>;
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
        
        // Alimentamos el historial nativo de OpenAI con los mensajes previos
        const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `
# ENTRENAMIENTO DE ZENI
Eres ZENI, el asistente cognitivo humano de ZENER Servicio Técnico. Tu objetivo es filtrar y calificar clientes para reparación de televisores las 24/7.
No actúas como un formulario. Piensa y deduzca de forma lógica basándote en la conversación completa.

# CONOCIMIENTO DEL NEGOCIO
- Cobertura (Estricta): Asunción, Lambaré, Villa Elisa, Ñemby, San Antonio, Fernando de la Mora, Capiatá, San Lorenzo, Areguá, Luque, Limpio, Mariano Roque Alonso. (Reconoce errores ortográficos). Si está fuera, descalifica amablemente.
- Fallas de Display (Pantalla rota, golpeada, rota, rajada, manchas negras fijas): NO CALIFICA. Descalifica amablemente y cierra el caso (sin cerrar el chat).
- Manipulación por el cliente (Abierto, desarmado, intento de reparación propia): NO CALIFICA.
- Fallas de Fuente, Placa o Iluminación LED (Política: se cambian TODOS los LED, no tiras sueltas): CALIFICA para transferir.
- ZENI nunca da presupuestos ni agenda visitas. No digas "no damos presupuesto por whatsapp", solo deriva diciendo: "Voy a derivar tu caso ahora al técnico asignado a tu caso, te va escribir desde su número."

# FLUJO RECOMENDADO
1. Saludo (solo primer mensaje) y consultar ciudad.
2. Consultar síntoma o falla (para descartar display antes que marca o tamaño).
3. Consultar marca y tamaño exacto (si no sabe, pedir foto de la etiqueta trasera).

# FORMATO DE RESPUESTA OBLIGATORIO (JSON)
Debes devolver única y estrictamente un objeto JSON con esta estructura:
{
  "reply": "Tu respuesta humana y empática en texto para el WhatsApp del cliente.",
  "memory": {
    "city": "nombre de la ciudad identificada o null",
    "brand": "marca identificada o null",
    "size": "tamaño identificado o null",
    "model": "modelo si lo dio o null",
    "symptom": "resumen del síntoma o null",
    "displayFailure": true/false/null,
    "manipulated": true/false/null
  }
}
`
            }
        ];

        // Añadir los mensajes previos que se guardaron en la memoria del cliente
        for (const msg of previousState.history) {
            conversationMessages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Añadir el mensaje que acaba de enviar el cliente en este momento
        conversationMessages.push({
            role: "user",
            content: message
        });

        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: conversationMessages
        });

        const content = response.choices[0].message.content || "{}";
        const parsed: GPTResponse = JSON.parse(content);

        // Mantenemos la consistencia de los datos históricos para que no se borren por valores vacíos
        const updatedMemory = {
            city: parsed.memory?.city || previousState.city,
            brand: parsed.memory?.brand || previousState.brand,
            size: parsed.memory?.size || previousState.size,
            model: parsed.memory?.model || previousState.model,
            symptom: parsed.memory?.symptom || previousState.symptom,
            displayFailure: parsed.memory?.displayFailure !== undefined && parsed.memory?.displayFailure !== null ? parsed.memory.displayFailure : previousState.displayFailure,
            manipulated: parsed.memory?.manipulated !== undefined && parsed.memory?.manipulated !== null ? parsed.memory.manipulated : previousState.manipulated,
        };

        // Guardamos de forma literal este intercambio en el historial de chat de la variable
        const updatedHistory: ChatMessage[] = [
            ...previousState.history,
            { role: "user", content: message },
            { role: "assistant", content: parsed.reply }
        ];

        const updatedState: ConversationState = {
            ...previousState,
            ...updatedMemory,
            history: updatedHistory.slice(-20), // Mantenemos los últimos 20 mensajes para optimizar costos de tokens
            lastCustomerMessage: message,
            updatedAt: Date.now()
        };

        return {
            state: updatedState,
            reply: parsed.reply
        };
    }
}
