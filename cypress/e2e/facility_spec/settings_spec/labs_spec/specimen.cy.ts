import { faker } from "@faker-js/faker";

import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  FacilitySpecimen,
  SpecimenDefinitionData,
} from "@/pageObject/facility/Labs/FacilitySpecimen";

const SPECIMEN_STATUS = ["Active", "Draft", "Retired"] as const;
const SPECIMEN_TYPES = ["Air Sample", "Abscess", "Allograft"] as const;
const COLLECTION_METHODS = [
  "Finger stick",
  "Timed urine collection",
  "Aspiration - action",
] as const;
const PATIENT_PREPARATIONS = [
  "Day before procedure",
  "Fractionated dose",
  "Full strength dose",
] as const;
const TESTED_PREFERENCES = ["Preferred", "Alternate"] as const;
const CAP_COLORS = ["black", "red", "blue", "green"] as const;

let slugCounter = 0;
const generateUniqueSlug = () =>
  `spec_${faker.string.alphanumeric(4)}_${++slugCounter}`;

const generateMandatoryFields = () => ({
  title: faker.science.chemicalElement().name,
  slug: generateUniqueSlug(),
  description: faker.lorem.sentence(),
  status: faker.helpers.arrayElement(SPECIMEN_STATUS),
  typeCollected: faker.helpers.arrayElement(SPECIMEN_TYPES),
});

const generateTestData = () => ({
  default: {
    ...generateMandatoryFields(),
    derivedFromUri: faker.internet.url(),
    collection: faker.helpers.arrayElement(COLLECTION_METHODS),
    patientPreparation: faker.helpers.arrayElement(PATIENT_PREPARATIONS),
    testedPreference: faker.helpers.arrayElement(TESTED_PREFERENCES),
    retentionTime: faker.number.int({ min: 12, max: 48 }).toString(),
    requirement: faker.lorem.sentence(),
    containerDescription: faker.lorem.sentence(),
    cap: faker.helpers.arrayElement(CAP_COLORS),
    capacity: faker.number.int({ min: 5, max: 20 }).toString(),
    minimumVolume: faker.number.int({ min: 1, max: 10 }).toString(),
    preparation: faker.lorem.paragraph(),
  },
  mandatoryOnly: generateMandatoryFields(),
});

describe("Facility Specimen Management", () => {
  const facilityCreation = new FacilityCreation();
  const facilitySpecimen = new FacilitySpecimen();

  beforeEach(() => {
    cy.loginByApi("facility_admin");
    cy.visit("/");
  });

  it("Create specimen with mandatory fields and confirm deletion of specimen", () => {
    facilityCreation.selectFirstRandomFacility();

    // Use mandatory fields data
    const specimenData = generateTestData().mandatoryOnly;

    facilitySpecimen
      .navigateToSpecimenDefinitions()
      .clickAddDefinition()
      .fillSpecimenDefinitionForm(specimenData)
      .saveSpecimenDefinition()
      .verifySpecimenDefinitionsUrl()
      .verifySpecimenCreatedNotification();

    // Search for created specimen
    facilitySpecimen
      .searchSpecimen(specimenData.title)
      .verifySpecimenInList(specimenData.title)
      .openSpecimenDetails()
      .clickDeleteSpecimen()
      .confirmDeleteSpecimen()
      .verifySpecimenRetiredNotification();
  });

  it("Create a new specimen definition with mandatory fields only & Search | Edit | Status filter", () => {
    facilityCreation.selectFirstRandomFacility();

    // Store test data for later verification
    const specimenData = generateTestData().mandatoryOnly;

    // Create specimen with mandatory fields
    facilitySpecimen
      .navigateToSpecimenDefinitions()
      .clickAddDefinition()
      .fillSpecimenDefinitionForm(specimenData)
      .saveSpecimenDefinition()
      .verifySpecimenDefinitionsUrl()
      .verifySpecimenCreatedNotification();

    // Search and filter
    facilitySpecimen
      .searchSpecimen(specimenData.title)
      .filterByStatus(specimenData.status)
      .verifySpecimenInList(specimenData.title)
      .openSpecimenDetails();

    // Verify details
    facilitySpecimen.verifySpecimenDetails(specimenData);

    // Edit specimen
    facilitySpecimen.clickEditSpecimen();

    // Update with new data
    const updatedData: Partial<SpecimenDefinitionData> = {
      title: faker.science.chemicalElement().name,
      derivedFromUri: faker.internet.url(),
      status: faker.helpers.arrayElement(SPECIMEN_STATUS),
      cap: faker.helpers.arrayElement(CAP_COLORS),
      slug: generateUniqueSlug(),
      description: faker.lorem.sentence(),
      typeCollected: faker.helpers.arrayElement(SPECIMEN_TYPES),
    };

    facilitySpecimen
      .fillSpecimenDefinitionForm(updatedData as SpecimenDefinitionData)
      .saveSpecimenDefinition()
      .verifySpecimenUpdatedNotification();

    // Verify updated data
    facilitySpecimen
      .searchSpecimen(updatedData.title)
      .verifySpecimenInList(updatedData.title)
      .openSpecimenDetails()
      .verifySpecimenDetails(updatedData);
  });

  it("Create a new specimen definition all fields with validation and verify creation", () => {
    facilityCreation.selectFirstRandomFacility();

    facilitySpecimen
      .navigateToSpecimenDefinitions()
      .clickAddDefinition()
      .saveSpecimenDefinition()
      .verifyRequiredFieldErrors()
      .fillSpecimenDefinitionForm(generateTestData().default)
      .saveSpecimenDefinition()
      .verifySpecimenDefinitionsUrl()
      .verifySpecimenCreatedNotification();
  });
});
