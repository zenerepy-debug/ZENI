import OpenAI from "openai";
import { ConversationState } from "../conversation/ConversationState";

export class OpenAIService {

    private client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    async answer(state: ConversationState): Promise<string> {

        const prompt = `
Estado actual:

Ciudad: ${state.city ?? "No indicada"}
Cobertura: ${state.inCoverage ?? "Desconocida"}
Síntoma: ${state.symptom ?? "No indicado"}
Marca: ${state.brand ?? "No indicada"}
Tamaño: ${state.size ?? "No indicado"}
Etapa: ${state.stage}

Último mensaje del cliente:
${state.lastCustomerMessage}

Responde únicamente según el estado actual.
Nunca vuelvas a pedir un dato que ya exista.
Si falta ciudad, pide ciudad.
Si falta síntoma, pide síntoma.
Si falta marca o tamaño, pide ambos.
Responde como un humano.
`;

        const response = await this.client.responses.create({
            model: "gpt-5.5",
            input: prompt
        });

        return response.output_text;

    }

}