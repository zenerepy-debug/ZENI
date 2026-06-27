import {
    ConversationState,
    createConversationState
} from "./ConversationState";

import { StateRepository } from "./StateRepository";
import { OpenAIService } from "../ai/OpenAIService";

export class ConversationEngine {

    private readonly repository =
        new StateRepository();

    private readonly ai =
        new OpenAIService();

    async process(

        phone: string,

        message: string

    ): Promise<string> {

        const previousState: ConversationState =

            this.repository.get(phone)

            ??

            createConversationState(phone);

        const {

            state,

            reply

        } = await this.ai.processConversation(

            previousState,

            message

        );

        this.repository.save(state);

        return reply;

    }

}