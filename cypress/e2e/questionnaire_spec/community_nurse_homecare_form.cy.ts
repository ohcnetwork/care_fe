import { patientCreation } from "@/pageObject/Patients/PatientCreation";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { patientVerify } from "@/pageObject/Patients/PatientVerify";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { CommunityQuestionnaireForm } from "@/pageObject/questionnaire/CommunityNurseHomecareForm";
import { getRandomMedicineName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const QUESTIONNAIRE_NAME = "Community Nurse Homecare Form";
const PRACTITIONER = "Admin Admin";

const MEDICINE_NAME = getRandomMedicineName();

const ENCOUNTER_TYPE = "Observation";
const ENCOUNTER_STATUS = "In Progress";
const ENCOUNTER_PRIORITY = "ASAP";

const testData = {
  mandatoryFields: [
    { linkId: "7.1", value: "Anal Canal", inputType: "radio" },
    { linkId: "7.2", value: "Diarrhea", inputType: "radio" },
    {
      linkId: "15.1",
      value: "Provide care to the patient",
      inputType: "textarea",
    },
    { linkId: "15.2", value: "Weekly", inputType: "choice" },
    { linkId: "21.1", value: "No", inputType: "radio" },
  ],
  allFields: [
    { linkId: "1", value: "Home Care Team Alpha", inputType: "textarea" },
    { linkId: "3", value: "Independently active", inputType: "choice" },
    { linkId: "6", value: "Satisfactory", inputType: "radio" },
    { linkId: "7.1", value: "Anal Canal", inputType: "radio" },
    { linkId: "7.2", value: "No Difficulty", inputType: "radio" },
    { linkId: "8.1", value: "No Issues", inputType: "radio" },
    { linkId: "8.2", value: "Normal", inputType: "choice" },
    { linkId: "8.2.1", value: "No Issues", inputType: "choice" },
    { linkId: "4.1", value: "Oral", inputType: "choice" },
    { linkId: "4.3", value: "Satisfactory", inputType: "radio" },
    { linkId: "11.1.1", value: "120", inputType: "number" },
    { linkId: "11.1.2", value: "80", inputType: "number" },
    { linkId: "11.2", value: "72", inputType: "number" },
    { linkId: "11.3", value: "98", inputType: "number" },
    { linkId: "11.4", value: "100", inputType: "number" },
    { linkId: "11.5", value: "No Pain", inputType: "radio" },
    { linkId: "16", value: "Oral Care", inputType: "choice" },
    { linkId: "17", value: "Hospital Bed", inputType: "choice" },
    { linkId: "15.1", value: "Comprehensive care plan", inputType: "textarea" },
    { linkId: "15.2", value: "Weekly", inputType: "choice" },
    { linkId: "21.1", value: "No", inputType: "radio" },
  ],
  symptom: {
    symptom: "Chronic",
    status: "Active",
    severity: "Moderate",
    notes: "Patient reports ongoing chronic pain",
  },
  diagnosis: {
    diagnosis: "Acquired",
    status: "Active",
    verification: "Confirmed",
    notes: "Well-controlled with current medications",
  },
  medication: {
    medicine: MEDICINE_NAME,
    status: "Active",
    dosageInstruction: "Take 500mg twice daily with meals",
    notes: "For pain management",
  },
  appointment: {
    reasonForVisit: "Follow-up assessment",
    practitioner: PRACTITIONER,
  },
};

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const communityForm = new CommunityQuestionnaireForm();
const patientPrescription = new PatientPrescription();

describe("Community Nurse Homecare Form Tests", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("doctor");
    cy.visit("/");

    facilityCreation.selectFirstRandomFacility();
  });

  it("should submit successfully with only mandatory fields filled", () => {
    createNewEncounter();
    setupQuestionnaireAndVerifyValidation();

    communityForm.fillQuestionnaireFields(testData.mandatoryFields);
    communityForm.selectAppointment(testData.appointment);

    submitAndVerifyQuestionnaire([
      "Anal Canal",
      "Diarrhea",
      "Provide care to the patient",
    ]);
  });

  it("should successfully submit the form with all fields filled", () => {
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();

    patientEncounter.addQuestionnaire(QUESTIONNAIRE_NAME);

    communityForm.fillQuestionnaireFields(testData.allFields);

    communityForm.addSymptom(testData.symptom);
    communityForm.addDiagnosis(testData.diagnosis);
    communityForm.addMedicationStatement(testData.medication);
    communityForm.selectAppointment(testData.appointment);

    submitAndVerifyQuestionnaire([
      "Home Care Team Alpha",
      "Independently active",
      "Satisfactory",
      "Anal Canal",
      "No Difficulty",
      "No Issues",
      "Normal",
      "No Issues",
      "Oral",
      "Satisfactory",
      "120",
      "80",
      "72",
      "98",
      "100",
      "No Pain",
      "Oral Care",
      "Hospital Bed",
      "Comprehensive care plan",
      "Weekly",
      "No",
    ]);

    patientEncounter
      .clickEncounterMarkAsComplete()
      .clickConfirmEncounterAsComplete();
  });

  function setupQuestionnaireAndVerifyValidation() {
    patientEncounter.addQuestionnaire(QUESTIONNAIRE_NAME);
    patientPrescription.clickSubmitQuestionnaire();
    communityForm.verifyValidationErrors();
  }

  function submitAndVerifyQuestionnaire(verificationValues: string[]) {
    communityForm.interceptQuestionnaireSubmission();
    patientPrescription.submitQuestionnaire();
    communityForm.saveQuestionnaireId();

    communityForm.verifyDataPresence(verificationValues);
  }

  function createNewEncounter() {
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton()
      .clickPatientEditButton()
      .getPatientPhone()
      .getPatientName()
      .getPatientYear();

    cy.get("@patientPhone").then((phoneNumber) => {
      cy.get("@patientName").then((name) => {
        cy.get("@patientYear").then((year) => {
          patientCreation
            .clickSearchPatients()
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
  }
});
