import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { UpdatePatientPage } from "../../pageobject/Patient/PatientUpdate";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
const yearOfBirth = "2023";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation with consultation", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const updatePatientPage = new UpdatePatientPage();
  const patientConsultationPage = new PatientConsultationPage();
  const phone_number = "9" + Math.floor(100000000 + Math.random() * 900000000);
  const emergency_phone_number = "9430123487";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/patients");
  });

  it("Create a new patient with no consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility");
    patientPage.enterPatientDetails(
      phone_number,
      emergency_phone_number,
      "Test E2E User",
      "Male",
      "Test Patient Address",
      "682001",
      "1: PAZHAMTHOTTAM",
      "O+"
    );
    patientPage.clickCreatePatient();

    patientPage.verifyPatientIsCreated();
    patientPage.saveCreatedPatientUrl();
  });

  it("Patient Detail verification post registration", () => {
    patientPage.visitCreatedPatient();
    const age = calculateAge();
    patientPage.verifyPatientDetails(
      age,
      "Test E2E User",
      phone_number,
      emergency_phone_number,
      yearOfBirth,
      "O+"
    );
  });

  it("Edit the patient details", () => {
    patientPage.visitUpdatePatientUrl();
    updatePatientPage.enterPatientDetails(
      "Test E2E User Edited",
      "9120330220",
      "Test Patient Address Edited",
      "Severe Cough",
      "Paracetamol",
      "Dust",
      ["2 months ago", "1 month ago"],
      "SUB123",
      "P123",
      "GICOFINDIA",
      "GICOFINDIA"
    );
    updatePatientPage.clickUpdatePatient();

    updatePatientPage.verifyPatientUpdated();
    updatePatientPage.saveUpdatedPatientUrl();
  });

  it("Patient Detail verification post edit", () => {
    updatePatientPage.visitUpdatedPatient();
    const patientDetails_values: string[] = [
      "Severe Cough",
      "Paracetamol",
      "Dust",
      "Diabetes",
      "2 months ago",
      "Heart Disease",
      "1 month ago",
    ];

    updatePatientPage.verifyPatientDetails(
      "Test E2E User Edited",
      "+919120330220",
      patientDetails_values
    );
  });

  it("Create a New consultation to existing patient", () => {
    updatePatientPage.visitConsultationPage();
    patientConsultationPage.selectConsultationStatus("Out-patient (walk in)");
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");

    patientConsultationPage.enterConsultationDetails(
      "history",
      "Examination details and Clinical conditions",
      "70",
      "170",
      "192.168.1.11",
      "generalnote",
      "generalnote"
    );
    patientConsultationPage.submitConsultation();
    // Below code for the prescription module only present while creating a new consultation
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.prescribeMedicine();
    patientConsultationPage.enterDosage("3");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescriptionAndReturn();
  });

  it("Edit created consultation to existing patient", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.visitEditConsultationPage();
    patientConsultationPage.selectConsultationStatus(
      "Referred from other hospital"
    );
    patientConsultationPage.updateSymptoms("FEVER");
    patientConsultationPage.setSymptomsDate("01082023");
    patientConsultationPage.updateConsultation();
    patientConsultationPage.verifySuccessNotification(
      "Consultation updated successfully"
    );
  });

  it("Create Patient shift requests.", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.visitShiftRequestPage();
    patientConsultationPage.enterPatientShiftDetails(
      "Test User",
      "+919120330220",
      "Dummy Shifting",
      "Reason"
    );
    patientConsultationPage.createShiftRequest();
    patientConsultationPage.verifySuccessNotification(
      "Shift request created successfully"
    );
  });

  it("Post doctor notes for an already created patient", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.visitDoctorNotesPage();
    patientConsultationPage.addDoctorsNotes("Test Doctor Notes");
    patientConsultationPage.postDoctorNotes();
    patientConsultationPage.verifySuccessNotification(
      "Note added successfully"
    );
  });

  it("Edit prescription for an already created patient", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.visitEditPrescriptionPage();
    patientConsultationPage.discontinuePreviousPrescription();
    patientConsultationPage.verifySuccessNotification(
      "Prescription discontinued"
    );
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.prescribeMedicine();
    patientConsultationPage.enterDosage("4");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescription();
  });

  it("Discharge a patient", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.clickDischargePatient();
    patientConsultationPage.selectDischargeReason("Recovered");
    patientConsultationPage.addDischargeNotes("Discharge notes");
    patientConsultationPage.confirmDischarge();
    patientConsultationPage.verifySuccessNotification(
      "Patient Discharged Successfully"
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
