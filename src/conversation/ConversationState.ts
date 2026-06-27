export interface ConversationState {

    phone: string;

    city: string | null;

    brand: string | null;

    size: string | null;

    model: string | null;

    symptom: string | null;

    displayFailure: boolean | null;

    manipulated: boolean | null;

    lastCustomerMessage: string;

    conversationSummary: string;

    createdAt: number;

    updatedAt: number;

}

export function createConversationState(
    phone: string
): ConversationState {

    const now = Date.now();

    return {

        phone,

        city: null,

        brand: null,

        size: null,

        model: null,

        symptom: null,

        displayFailure: null,

        manipulated: null,

        lastCustomerMessage: "",

        conversationSummary: "",

        createdAt: now,

        updatedAt: now

    };

}