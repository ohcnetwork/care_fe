import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateName, getRandomMedicineName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

describe("Patient Prescription Management", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("test-human");
    cy.visit("/");
  });

  it("Add and remove medicine from patient prescription", () => {
    const dosage = "6";
    const medicationDetails = {
      medicineName: getRandomMedicineName(),
      dosage,
      dosageInput: `${dosage} Milligram`,
      frequency: "BID (1-0-1)",
      instructions: "Until symptoms improve",
      notes: "testing notes",
    };
    facilityCreation.selectFacility("GHC Payyanur");
    const patientName = generateName();
    patientEncounter
      .navigateToEncounters()
      .searchEncounter(patientName)
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
    patientPrescription
      .clickMedicinesTab()
      .clickEditPrescription()
      .addMedication(medicationDetails)
      .submitQuestionnaire()
      .clickMedicinesTab()
      .verifyMedication(medicationDetails)
      .clickEditPrescription()
      .removeMedication()
      .submitQuestionnaire()
      .clickMedicinesTab()
      .verifyDeletedMedication(medicationDetails);
  });
});
