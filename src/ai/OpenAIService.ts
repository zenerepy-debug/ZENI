import OpenAI from "openai";
import { ConversationState } from "../conversation/ConversationState";

export class OpenAIService {

    private client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    async extract(
        state: ConversationState,
        message: string
    ): Promise<ConversationState> {

        const response = await this.client.responses.create({

            model: "gpt-5.5",

            input: [
                {
                    role: "system",
                    content: `
Extrae información del mensaje del cliente.

Devuelve EXCLUSIVAMENTE un objeto JSON válido.

No inventes información.

Si un dato no existe devuelve null.

Formato:

{
  "city": string|null,
  "brand": string|null,
  "size": string|null,
  "model": string|null,
  "symptom": string|null,
  "displayFailure": boolean|null,
  "manipulated": boolean|null
}
`
                },
                {
                    role: "user",
                    content: message
                }
            ]

        });

        const text =
            response.output_text ??
            "{}";

        let data: any = {};

        try {
            data = JSON.parse(text);
        } catch {
            return state;
        }

        if (state.city === null && data.city !== null) {
            state.city = data.city;
        }

        if (state.brand === null && data.brand !== null) {
            state.brand = data.brand;
        }

        if (state.size === null && data.size !== null) {
            state.size = data.size;
        }

        if (state.model === null && data.model !== null) {
            state.model = data.model;
        }

        if (state.symptom === null && data.symptom !== null) {
            state.symptom = data.symptom;
        }

        if (
            state.displayFailure === null &&
            data.displayFailure !== null
        ) {
            state.displayFailure = data.displayFailure;
        }

        if (
            state.manipulated === null &&
            data.manipulated !== null
        ) {
            state.manipulated = data.manipulated;
        }

        return state;
    }

    async answer(        state: ConversationState
    ): Promise<string> {

        const response = await this.client.responses.create({

            model: "gpt-5.5",

            input: [
                {
                    role: "system",
                    content: `
Eres ZENI, asistente virtual de ZENER Servicio Técnico.

Reglas obligatorias:

- Responde únicamente sobre reparación de televisores.
- No inventes información.
- No menciones servicios que ZENER no ofrece.
- Sé breve, profesional y directo.
- No saludes si la conversación ya está iniciada.
`
                },
                {
                    role: "user",
                    content: `
Información del cliente:

Ciudad: ${state.city}
Marca: ${state.brand}
Tamaño: ${state.size}
Modelo: ${state.model}
Síntoma: ${state.symptom}

Genera la respuesta final para el cliente.
`
                }
            ]

        });

        return (
            response.output_text?.trim() ||
            "Muchas gracias por la información. En breve un asesor continuará con su atención."
        );

    }

}