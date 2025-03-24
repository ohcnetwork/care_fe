import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();

describe("Patient Prescription Management", () => {
  beforeEach(() => {
    cy.loginByApi("test-human");
    cy.visit("/");
  });

  it("should add a new medicine for the patient", () => {
    facilityCreation.selectFacility("GHC Payyanur");
    const medicineName = "Estriol 1 mg oral tablet";
    const dosage = 6;
    const dosageInput = "6 Milligram";
    const frequency = "BID (1-0-1)";
    const instructions = "Until symptoms improve";
    const route = "Sublabial route";
    const site = "Structure of left deltoid muscle";
    const method = "Bathe";
    const notes = "testing notes";
    patientEncounter
      .navigateToEncounters()
      .openOngoingEncounter()
      .clickMedicinesTab()
      .clickEditPrescription()
      .addMedication(
        medicineName,
        dosage,
        dosageInput,
        frequency,
        instructions,
        route,
        site,
        method,
        notes,
      )
      .submitQuestionnaire()
      .clickMedicinesTab()
      .verifyMedication(
        medicineName,
        dosageInput,
        frequency,
        instructions,
        route,
        site,
        method,
        notes,
      )
      .clickEditPrescription()
      .removeMedication()
      .submitQuestionnaire()
      .clickMedicinesTab()
      .verifyDeletedMedication(
        medicineName,
        dosageInput,
        frequency,
        instructions,
        route,
        site,
        method,
        notes,
      );
  });
});
