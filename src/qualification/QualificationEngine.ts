import { ConversationState } from "../conversation/ConversationState";

export class QualificationEngine {

    next(state: ConversationState): ConversationState {

        if (!state.city) {
            state.stage = "CITY";
            state.qualified = false;
            return state;
        }

        if (state.inCoverage === false) {
            state.stage = "DISQUALIFIED";
            state.qualified = false;
            return state;
        }

        if (!state.symptom) {
            state.stage = "SYMPTOM";
            state.qualified = false;
            return state;
        }

        if (state.displayFailure === true) {
            state.stage = "DISQUALIFIED";
            state.qualified = false;
            return state;
        }

        if (state.manipulated === true) {
            state.stage = "DISQUALIFIED";
            state.qualified = false;
            return state;
        }

        if (!state.brand || !state.size) {
            state.stage = "BRAND_SIZE";
            state.qualified = false;
            return state;
        }

        state.stage = "QUALIFIED";
        state.qualified = true;

        return state;
    }

}