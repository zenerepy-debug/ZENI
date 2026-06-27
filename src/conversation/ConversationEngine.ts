import { createConversationState, ConversationState } from "./ConversationState";
import { StateRepository } from "./StateRepository";
import { OpenAIService } from "../ai/OpenAIService";

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

const DISPLAY = [
    "display",
    "pantalla rota",
    "pantalla quebrada",
    "quebrada",
    "quebrado",
    "golpe",
    "rajada",
    "rajado",
    "lineas",
    "líneas",
    "manchas",
    "tinta"
];

const MANIPULATED = [
    "abrí",
    "abri",
    "desarmé",
    "desarme",
    "desarmamos",
    "manipulé",
    "manipule",
    "cambié",
    "cambie",
    "reemplacé",
    "reemplace"
];

export class ConversationEngine {

    private repository = new StateRepository();
    private ai = new OpenAIService();

    async process(
        phone: string,
        message: string
    ): Promise<string> {

        let state: ConversationState =
            this.repository.get(phone) ??
            createConversationState(phone);

        const text = message
            .toLowerCase()
            .trim();

        state.lastCustomerMessage = message;
        state.updatedAt = Date.now();

        const city = CITIES.find(c => text.includes(c));

        if (city && !state.city) {
            state.city = city;
            state.inCoverage = true;
        }

        const brand = BRANDS.find(b => text.includes(b));

        if (brand && !state.brand) {
            state.brand = brand.toUpperCase();
        }

        const size = text.match(
            /\b(19|20|21|22|24|28|29|32|39|40|42|43|48|49|50|55|58|60|65|70|75|77|82|85|86|98)\b/
        );

        if (size && !state.size) {
            state.size = size[1];
        }

        if (
            state.displayFailure === null &&
            DISPLAY.some(x => text.includes(x))
        ) {
            state.displayFailure = true;
        }

        if (
            state.manipulated === null &&
            MANIPULATED.some(x => text.includes(x))
        ) {
            state.manipulated = true;
        }

        state = await this.ai.extract(
            state,
            message
        );

        this.repository.save(state);        if (!state.city) {
            return "¿En qué ciudad se encuentra el televisor?";
        }

        if (state.inCoverage === false) {
            return "Muchas gracias por contactarnos. La ciudad indicada está fuera de nuestra zona de cobertura.";
        }

        if (state.displayFailure === true) {
            return "Muchas gracias por la información. Ese caso corresponde a una falla de display y ZENER no realiza ese tipo de reparación. Si tiene otra TV con un inconveniente diferente, con gusto la revisaremos.";
        }

        if (state.manipulated === true) {
            return "Muchas gracias por la información. Por política de ZENER no trabajamos con televisores que hayan sido manipulados previamente.";
        }

        if (!state.symptom) {
            return "¿Qué síntoma presenta el televisor?";
        }

        if (!state.brand && !state.size) {
            return "¿Cuál es la marca y el tamaño exacto del televisor?";
        }

        if (!state.brand) {
            return "¿Cuál es la marca del televisor?";
        }

        if (!state.size) {
            return "¿Cuál es el tamaño exacto del televisor en pulgadas?";
        }

        const response = await this.ai.answer(state);

        state.qualified = true;
        state.transferred = true;

        this.repository.save(state);

        return response;

    }

}