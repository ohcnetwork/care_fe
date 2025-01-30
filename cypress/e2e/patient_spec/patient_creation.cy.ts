import {
  generateAddress,
  generateName,
  generatePhoneNumber,
} from "utils/commonUtils";

import {
  PatientFormData,
  patientCreation,
} from "@/pageObject/Patients/PatientCreation";
import { patientDashboard } from "@/pageObject/Patients/PatientDashboard";
import { patientVerify } from "@/pageObject/Patients/PatientVerify";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

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

  const basePatientData: Partial<PatientFormData> = {
    pincode: "682001",
    state: "Kerala",
    district: "Ernakulam",
    localBody: "Aluva",
    ward: "4",
    sameAsPermanentAddress: true,
    hasEmergencyContact: false,
  };

  const patientTestCases: Array<{
    description: string;
    data: PatientFormData;
  }> = [
    {
      description: "non-binary patient | O+ blood group | multi-line address",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "non_binary",
        bloodGroup: "O+",
        age: "25",
        address: generateAddress(true),
      } as PatientFormData,
    },
    {
      description:
        "transgender patient | AB+ blood group | with emergency contact",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "transgender",
        bloodGroup: "AB+",
        age: "30",
        address: generateAddress(),
      } as PatientFormData,
    },
    {
      description: "female patient | different addresses | same phone number",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "female",
        bloodGroup: "Unknown",
        age: "25",
        sameAsPermanentAddress: false,
        address: generateAddress(),
        permanentAddress: generateAddress(),
      } as PatientFormData,
    },
    {
      description:
        "standard male patient | same address | different emergency contact",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: true,
        emergencyPhoneNumber: generatePhoneNumber(),
        gender: "male",
        bloodGroup: "B+",
        dateOfBirth: "01-01-1990",
        address: generateAddress(),
      } as PatientFormData,
    },
    // ... other test cases ...
  ];

  before(() => {
    cy.loginByApi("doctor");
  });

  beforeEach(() => {
    cy.loginByApi("doctor");
    cy.visit("/");
  });

  patientTestCases.forEach(({ description, data }) => {
    it(`creates a new ${description} and verifies registration`, () => {
      facilityCreation.selectFacility("GHC Trikaripur");
      patientCreation
        .clickSearchPatients()
        .clickCreateNewPatient()
        .fillPatientDetails(data)
        .submitPatientForm()
        .assertPatientRegistrationSuccess();

      // Verify encounter creation
      patientVerify
        .verifyPatientName(data.name)
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
  });

  it("search patient with phone number and verifies details", () => {
    facilityCreation.selectFacility("GHC Trikaripur");
    patientCreation
      .clickSearchPatients()
      .searchPatient(TEST_PHONE)
      .verifySearchResults(PATIENT_DETAILS);
  });
});
