import {
  generateAddress,
  generateName,
  generatePhoneNumber,
} from "utils/commonUtils";

import {
  PatientFormData,
  patientCreation,
} from "@/pageObject/Patients/PatientCreation";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { patientVerify } from "@/pageObject/Patients/PatientVerify";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const ENCOUNTER_TYPE = "Observation";
const ENCOUNTER_STATUS = "In Progress";
const ENCOUNTER_PRIORITY = "ASAP";

beforeEach(() => {
  cy.viewport(viewPort.desktop1080p.width, viewPort.desktop2k.height);
  cy.loginByApi("doctor");
  cy.visit("/");
});

describe("Patient Creation and modification", () => {
  const basePatientData: Partial<PatientFormData> = {
    pincode: "682001",
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
        gender: "Non_Binary",
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
        gender: "Transgender",
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
        gender: "Female",
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
        gender: "Male",
        bloodGroup: "B+",
        dateOfBirth: "01-01-1990",
        address: generateAddress(),
      } as PatientFormData,
    },
    // ... other test cases ...
  ];

  patientTestCases.forEach(({ description, data }) => {
    it(`creates a new ${description} and verifies registration`, () => {
      facilityCreation.selectFirstRandomFacility();
      patientCreation
        .expandPatientNav()
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
        .selectOrganization()
        .clickSubmitEncounter()
        .assertEncounterCreationSuccess();

      patientEncounter.verifyEncounterPatientInfo([
        ENCOUNTER_TYPE,
        ENCOUNTER_STATUS,
        ENCOUNTER_PRIORITY,
      ]);
    });
  });

  it("Edit a patient details and verify the changes", () => {
    const updatedPatientData: Partial<PatientFormData> = {
      gender: "Female",
      bloodGroup: "AB+",
      address: generateAddress(true),
    };

    facilityCreation.selectFirstRandomFacility();
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton()
      .clickPatientEditButton();

    patientCreation
      .selectGender(updatedPatientData.gender)
      .selectBloodGroup(updatedPatientData.bloodGroup)
      .enterAddress(updatedPatientData.address, true)
      .submitPatientUpdateForm()
      .verifyUpdateSuccess();

    cy.verifyContentPresence("#general-info", [
      updatedPatientData.gender,
      updatedPatientData.address,
    ]);
  });
});

describe("Patient Search and Encounter Creation", () => {
  it("Search patient with phone number and create a new encounter", () => {
    // open a random encounter and get the patient details
    facilityCreation.selectFirstRandomFacility();
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton()
      .clickPatientEditButton()
      .getPatientPhone()
      .getPatientName()
      .getPatientYear();

    // use that patient details to search and create a new encounter
    cy.get("@patientPhone").then((phoneNumber) => {
      cy.get("@patientName").then((name) => {
        cy.get("@patientYear").then((year) => {
          cy.getFacilityIdAndNavigate("patients");
          patientCreation
            .searchPatient(String(phoneNumber))
            .verifySearchResults(String(name))
            .selectPatientFromResults(String(name))
            .enterYearOfBirth(String(year))
            .clickVerifyButton();

          patientVerify
            .verifyPatientName(String(name))
            .verifyCreateEncounterButton()
            .clickCreateEncounter()
            .selectEncounterType(ENCOUNTER_TYPE)
            .selectEncounterStatus(ENCOUNTER_STATUS)
            .selectEncounterPriority(ENCOUNTER_PRIORITY)
            .selectOrganization()
            .clickSubmitEncounter()
            .assertEncounterCreationSuccess();
        });
      });
    });

    patientEncounter
      .verifyEncounterPatientInfo([
        ENCOUNTER_TYPE,
        ENCOUNTER_STATUS,
        ENCOUNTER_PRIORITY,
      ])
      .clickEncounterMarkAsComplete()
      .clickConfirmEncounterAsComplete()
      .verifyEncounterPatientInfo(["Completed"]);
  });
});
