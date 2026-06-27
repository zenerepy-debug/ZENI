export interface ConversationState {

    phone: string;

    city: string | null;

    inCoverage: boolean | null;

    brand: string | null;

    size: string | null;

    model: string | null;

    symptom: string | null;

    displayFailure: boolean | null;

    manipulated: boolean | null;

    qualified: boolean;

    transferred: boolean;

    lastCustomerMessage: string;

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

        inCoverage: null,

        brand: null,

        size: null,

        model: null,

        symptom: null,

        displayFailure: null,

        manipulated: null,

        qualified: false,

        transferred: false,

        lastCustomerMessage: "",

        createdAt: now,

        updatedAt: now

    };

}