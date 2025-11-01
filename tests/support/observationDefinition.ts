import { faker } from "@faker-js/faker";

const CATEGORIES = [
  "Social History",
  "Vital Signs",
  "Imaging",
  "Laboratory",
  "Procedure",
  "Survey",
  "Exam",
  "Therapy",
  "Activity",
];

const DATA_TYPES = [
  "Boolean",
  "Decimal",
  "Integer",
  "DateTime",
  "Time",
  "String",
];

const STATUSES = ["Active", "Draft", "Retired"];

const LOINC_CODES = [
  "Acyclovir",
  "Cefoperazone",
  "DBG Ab",
  "R wave duration in lead AVR",
];

export interface ObservationDefinitionTestData {
  title: string;
  slug: string;
  description: string;
  category: string;
  dataType: string;
  status: string;
  loincCode: string;
}

export function generateObservationDefinitionData(): ObservationDefinitionTestData {
  return {
    title: faker.lorem.words(3),
    slug: faker.string.alphanumeric(8).toLowerCase(),
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(CATEGORIES),
    dataType: faker.helpers.arrayElement(DATA_TYPES),
    status: faker.helpers.arrayElement(STATUSES),
    loincCode: faker.helpers.arrayElement(LOINC_CODES),
  };
}
