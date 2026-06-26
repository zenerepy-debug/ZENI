import {
  ConversationState,
  createConversationState
} from "./ConversationState";

export class StateRepository {

  private readonly conversations = new Map<string, ConversationState>();

  get(phone: string): ConversationState {

    let state = this.conversations.get(phone);

    if (!state) {

      state = createConversationState(phone);

      this.conversations.set(phone, state);

    }

    return state;

  }

  save(state: ConversationState): void {

    state.updatedAt = Date.now();

    this.conversations.set(state.phone, state);

  }

  delete(phone: string): void {

    this.conversations.delete(phone);

  }

}