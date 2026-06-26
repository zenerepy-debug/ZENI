import { StateRepository } from "./StateRepository";
import { EntityExtractor } from "./EntityExtractor";
import { QualificationEngine } from "../qualification/QualificationEngine";
import { OpenAIService } from "../ai/OpenAIService";

export class ConversationEngine {

    private repository = new StateRepository();
    private extractor = new EntityExtractor();
    private qualification = new QualificationEngine();
    private ai = new OpenAIService();

    async process(phone: string, message: string): Promise<string> {

        const state = this.repository.get(phone);

        this.extractor.update(state, message);

        this.qualification.next(state);

        this.repository.save(state);

        switch (state.stage) {

            case "CITY":
                return "¿En qué ciudad se encuentra el televisor?";

            case "SYMPTOM":
                return "¿Qué síntoma presenta el televisor?";

            case "BRAND_SIZE":
                return "Indique la marca y el tamaño exacto del televisor. Si no los conoce, envíe una foto de la etiqueta del TV.";

            case "DISQUALIFIED":

                if (state.displayFailure) {
                    return "Muchas gracias por la información. Ese caso corresponde a una falla de display y ZENER no realiza ese tipo de reparación. Si tiene otra TV con un inconveniente diferente, con gusto la revisaremos.";
                }

                if (state.manipulated) {
                    return "Muchas gracias por la información. Por política de trabajo no recibimos televisores que hayan sido manipulados previamente.";
                }

                return "Muchas gracias por la información.";

            case "QUALIFIED":
                return await this.ai.answer(state);

        }

        return "¿Podría repetir su mensaje?";
    }

}