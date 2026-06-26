import { ConversationState } from "./ConversationState";

const COVERAGE = [
  "asunción",
  "asuncion",
  "lambaré",
  "lambare",
  "villa elisa",
  "ñemby",
  "nemby",
  "san antonio",
  "fernando de la mora",
  "capiatá",
  "capiata",
  "san lorenzo",
  "aregua",
  "luque",
  "limpio",
  "mariano roque alonso"
];

export class EntityExtractor {

  update(state: ConversationState, message: string): ConversationState {

    const text = message.toLowerCase().trim();

    state.lastCustomerMessage = message;

    if (!state.city) {

      const city = COVERAGE.find(c => text.includes(c));

      if (city) {
        state.city = city;
        state.inCoverage = true;
        state.stage = "SYMPTOM";
      }
    }

    return state;

  }

}