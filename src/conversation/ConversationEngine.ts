import { StateRepository } from "./StateRepository";
import { EntityExtractor } from "./EntityExtractor";
import { OpenAIService } from "../ai/OpenAIService";
import { QualificationEngine } from "../qualification/QualificationEngine";

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

        return await this.ai.answer(state);

    }

}