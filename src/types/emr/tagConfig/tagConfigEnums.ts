// No imports: the router's search schemas load this file at startup.

export enum TagCategory {
  DIET = "diet",
  DRUG = "drug",
  LAB = "lab",
  ADMIN = "admin",
  CONTACT = "contact",
  CLINICAL = "clinical",
  BEHAVIORAL = "behavioral",
  RESEARCH = "research",
  ADVANCE_DIRECTIVE = "advance_directive",
  SAFETY = "safety",
}

export enum TagStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum TagResource {
  ENCOUNTER = "encounter",
  APPOINTMENT = "token_booking",
  ACTIVITY_DEFINITION = "activity_definition",
  SERVICE_REQUEST = "service_request",
  CHARGE_ITEM = "charge_item",
  CHARGE_ITEM_DEFINITION = "charge_item_definition",
  PATIENT = "patient",
  PRESCRIPTION = "medication_request_prescription",
  DELIVERY_ORDER = "supply_delivery_order",
  REQUEST_ORDER = "supply_request_order",
  ACCOUNT = "account",
  LOCATION = "location",
}
