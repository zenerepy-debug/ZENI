export type Stage =
  | "CITY"
  | "SYMPTOM"
  | "BRAND_SIZE"
  | "QUALIFIED"
  | "DISQUALIFIED";

export interface ConversationState {

  phone: string;

  stage: Stage;

  city?: string;

  inCoverage?: boolean;

  symptom?: string;

  brand?: string;

  size?: string;

  model?: string;

  displayFailure?: boolean;

  manipulated?: boolean;

  qualified?: boolean;

  transferred?: boolean;

  lastCustomerMessage?: string;

  createdAt: number;

  updatedAt: number;

}

export function createConversationState(phone: string): ConversationState {

  const now = Date.now();

  return {

    phone,

    stage: "CITY",

    city: undefined,

    inCoverage: undefined,

    symptom: undefined,

    brand: undefined,

    size: undefined,

    model: undefined,

    displayFailure: undefined,

    manipulated: undefined,

    qualified: false,

    transferred: false,

    lastCustomerMessage: "",

    createdAt: now,

    updatedAt: now

  };

}