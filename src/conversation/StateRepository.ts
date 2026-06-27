import { ConversationState } from "./ConversationState";

export class StateRepository {
    private readonly conversations = new Map<string, ConversationState>();

    get(phone: string): ConversationState | undefined {
        return this.conversations.get(phone);
    }

    save(state: ConversationState): void {
        this.conversations.set(state.phone, {
            ...state,
            updatedAt: Date.now()
        });
    }

    clear(phone: string): void {
        this.conversations.delete(phone);
    }
}
