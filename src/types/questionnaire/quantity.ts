export interface Quantity {
  value: number;
  unit: string;
  system?: string;
  code?: string;
  // TODO: Add support for meta parameter for quantity
  // meta?: {};
}
