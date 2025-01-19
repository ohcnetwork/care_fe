import { patientCreation } from "pageObject/Patients/PatientCreation";
import { patientDashboard } from "pageObject/Patients/PatientDashboard";
import { patientVerify } from "pageObject/Patients/PatientVerify";
import { FacilityCreation } from "pageObject/facility/FacilityCreation";

import {
  generateAddress,
  generateName,
  generatePhoneNumber,
} from "../../utils/commonUtils";

const facilityCreation = new FacilityCreation();
const ENCOUNTER_TYPE = "Observation";
const ENCOUNTER_STATUS = "In Progress";
const ENCOUNTER_PRIORITY = "ASAP";

describe("Patient Management", () => {
  const TEST_PHONE = "9495031234";
  const PATIENT_DETAILS = {
    name: "Nihal",
    sex: "Male",
    phone: TEST_PHONE,
  };

  const testPatientData = {
    name: generateName(),
    phoneNumber: generatePhoneNumber(),
    gender: "male",
    bloodGroup: "B+",
    dateOfBirth: "01-01-1990",
    address: generateAddress(),
    pincode: "682001",
    localBody: "Aluva",
    ward: "4",
  };

  beforeEach(() => {
    cy.visit("/login");
  });

  it("create a new patient and verify details", () => {
    cy.loginByApi("doctor");
    facilityCreation.selectFacility("GHC Trikaripur");
    patientCreation
      .clickSearchPatients()
      .clickCreateNewPatient()
      .fillPatientDetails(testPatientData)
      .submitPatientForm()
      .assertPatientRegistrationSuccess();
    patientVerify
      .verifyPatientName(testPatientData.name)
      .verifyCreateEncounterButton()
      .clickCreateEncounter()
      .selectEncounterType(ENCOUNTER_TYPE)
      .selectEncounterStatus(ENCOUNTER_STATUS)
      .selectEncounterPriority(ENCOUNTER_PRIORITY)
      .clickSubmitEncounter()
      .assertEncounterCreationSuccess();
    patientDashboard.verifyEncounterPatientInfo([
      ENCOUNTER_TYPE,
      ENCOUNTER_STATUS,
      ENCOUNTER_PRIORITY,
    ]);
  });

  it("search patient with phone number and verifies details", () => {
    cy.loginByApi("staff");
    facilityCreation.selectFacility("GHC Trikaripur");
    patientCreation
      .clickSearchPatients()
      .searchPatient(TEST_PHONE)
      .verifySearchResults(PATIENT_DETAILS);
  });
});
