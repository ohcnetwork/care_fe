import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();

describe("Patient Prescription Management", () => {
  beforeEach(() => {
    cy.loginByApi("devnurse");
    cy.visit("/");
  });

  it("should add a new medicine for the patient", () => {
    facilityCreation.selectFacility("GHC payyanur");
    const medicineName = "Senna 15 mg oral tablet";
    const dosage = 6;
    const frequency = "BID (1-0-1)";
    const instructions = "Until symptoms improve";
    const route = "Sublabial route";
    const site = "Structure of left deltoid muscle";
    const method = "Bathe";
    const notes = "testing notes";
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickMedicinesTab()
      .clickEditPrescription()
      .addMedication(
        medicineName,
        dosage,
        frequency,
        instructions,
        route,
        site,
        method,
        notes,
      );
  });
  it("should delete prescription", () => {
    facilityCreation.selectFacility("GHC payyanur");

    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickMedicinesTab()
      .clickEditPrescription()
      .removeMedication();
  });
});
