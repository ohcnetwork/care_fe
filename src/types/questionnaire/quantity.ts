import { Code } from "./code";

export interface Quantity {
  value: number;
  unit: string;
  system?: string;
  code?: string;
  // TODO: Add support for meta parameter for quantity
  // meta?: {};
}

export interface QuestionnaireQuantity {
  value: number;
  unit: Code;
  coding: Code;
}
