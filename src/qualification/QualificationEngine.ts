import { ConversationState } from "../conversation/ConversationState";

export class QualificationEngine {

    next(state: ConversationState): ConversationState {

        if (!state.city) {
            state.stage = "CITY";
            return state;
        }

        if (!state.symptom) {
            state.stage = "SYMPTOM";
            return state;
        }

        if (!state.brand || !state.size) {
            state.stage = "BRAND_SIZE";
            return state;
        }

        state.stage = "QUALIFIED";
        state.qualified = true;

        return state;

    }

}