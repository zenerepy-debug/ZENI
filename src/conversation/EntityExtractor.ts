import { ConversationState } from "./ConversationState";

const CITIES = [
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

const BRANDS = [
  "samsung",
  "lg",
  "sony",
  "philips",
  "aoc",
  "tokyo",
  "jam",
  "james",
  "xiaomi",
  "hisense",
  "midas",
  "aiwa",
  "haier",
  "hyundai",
  "electrostar",
  "back",
  "matsui",
  "megastar",
  "fama",
  "hd play",
  "tcl"
];

const DISPLAY_WORDS = [
  "pantalla rota",
  "display",
  "golpe",
  "quebrada",
  "quebrado",
  "rajada",
  "rajado",
  "líneas",
  "lineas",
  "manchas",
  "tinta",
  "vidrio"
];

const MANIPULATION_WORDS = [
  "abrí",
  "abri",
  "abrimos",
  "desarmé",
  "desarme",
  "desarmamos",
  "cambié",
  "cambie",
  "reemplacé",
  "reemplace",
  "manipulé",
  "manipule"
];

export class EntityExtractor {

  update(state: ConversationState, message: string): ConversationState {

    const text = message.toLowerCase().trim();

    state.lastCustomerMessage = message;
        if (!state.city) {

      const city = CITIES.find(c => text.includes(c));

      if (city) {

        state.city = city;
        state.inCoverage = true;

      }

    }

    if (!state.brand) {

      const brand = BRANDS.find(b => text.includes(b));

      if (brand) {

        state.brand = brand.toUpperCase();

      }

    }

    if (!state.size) {

      const size = text.match(/\b(19|20|21|22|24|28|29|32|39|40|42|43|48|49|50|55|58|60|65|70|75|77|82|85|86|98)\b/);

      if (size) {

        state.size = size[1];

      }

    }

    if (!state.displayFailure) {

      state.displayFailure = DISPLAY_WORDS.some(word =>
        text.includes(word)
      );

    }

    if (!state.manipulated) {

      state.manipulated = MANIPULATION_WORDS.some(word =>
        text.includes(word)
      );

    }

    if (!state.symptom) {

      if (
        !text.includes("hola") &&
        !text.includes("buenas") &&
        !text.includes("buen día") &&
        !text.includes("buen dia")
      ) {

        state.symptom = message;

      }

    }
        if (!state.city) {

      state.stage = "CITY";

    } else if (!state.symptom) {

      state.stage = "SYMPTOM";

    } else if (!state.brand || !state.size) {

      state.stage = "BRAND_SIZE";

    } else if (state.displayFailure) {

      state.stage = "DISQUALIFIED";
      state.qualified = false;

    } else if (state.manipulated) {

      state.stage = "DISQUALIFIED";
      state.qualified = false;

    } else {

      state.stage = "QUALIFIED";
      state.qualified = true;

    }

    return state;

  }

}