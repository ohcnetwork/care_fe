import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateRandomCharacter } from "@/utils/commonUtils";
import { getRandomAllergyName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

describe("Patient Encounter Questionnaire", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devnurse");
    cy.visit("/");
  });

  it("verify the 500 character limit in input field", () => {
    const characterMaxLimit = generateRandomCharacter({
      charLimit: 510,
    });
    facilityCreation.selectFacility("GHC Payyanur");
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Question Type")
      .fillQuestionnaire({
        text: characterMaxLimit,
      });
    patientPrescription.clickSubmitQuestionnaire();
    cy.verifyNotification("Failed to submit questionnaire");
    cy.verifyErrorMessages([
      { label: "Text", message: "Text too long. Max allowed size is 500" },
    ]);
  });

  it("Create a new ABG questionnaire and verify the values", () => {
    const abgValues = {
      pco2: "120",
      po2: "80",
    };
    facilityCreation.selectFacility("GHC Payyanur");

    // Chain the methods instead of multiple separate calls
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Arterial Blood Gas")
      .fillQuestionnaire(abgValues);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyOverviewValues(Object.values(abgValues));
  });
});

describe("Patient Encounter Allergies", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devnurse5");
    cy.visit("/");
  });

  it("Create and edit an allergy and verify the changes", () => {
    facilityCreation.selectFacility("GHC Payyanur");
    const createAllergyDetails = {
      allergyName: getRandomAllergyName(),
      criticality: "Low",
      status: "Confirmed",
    };
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickEditAllergy()
      .addAllergy(createAllergyDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergy(createAllergyDetails);
    cy.get('[data-cy="allergy-id"]')
      .first()
      .invoke("text")
      .then((text) => {
        const updateAllergyDetails = {
          id: text.trim(),
          allergyName: createAllergyDetails.allergyName,
          criticality: "High",
          status: "Presumed",
          notes: "Edit allergy notes",
        };

        patientEncounter.clickEditAllergy().updateAllergy(updateAllergyDetails);

        patientPrescription.submitQuestionnaire();
        patientEncounter.verifyUpdateAllergy(updateAllergyDetails);

        patientEncounter.clickEditAllergy().deleteAllergy(text.trim());

        patientPrescription.submitQuestionnaire();
        patientEncounter.verifyAllergyDelete(text.trim());
      });
  });
});
