import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import {
  emergency_phone_number,
  phone_number,
} from "../../pageobject/constants";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";

describe("Patient Creation with consultation", () => {
  const patientConsultationPage = new PatientConsultationPage();
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const facilityPage = new FacilityPage();
  const patientDateOfBirth = "01012001";
  const patientOneName = "Patient With Consultation";
  const patientOneGender = "Male";
  const patientOneAddress = "Test Patient Address";
  const patientOnePincode = "682001";
  const patientOneState = "Kerala";
  const patientOneDistrict = "Ernakulam";
  const patientOneLocalbody = "Aluva";
  const patientOneWard = "4";
  const patientOneBloodGroup = "O+";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a patient with consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility 40");
    patientPage.patientformvisibility();
    patientPage.typePatientPhoneNumber(phone_number);
    patientPage.typePatientEmergencyNumber(emergency_phone_number);
    patientPage.typePatientDateOfBirth(patientDateOfBirth);
    patientPage.typePatientName(patientOneName);
    patientPage.selectPatientGender(patientOneGender);
    patientPage.typePatientAddress(patientOneAddress);
    facilityPage.fillPincode(patientOnePincode);
    facilityPage.selectStateOnPincode(patientOneState);
    facilityPage.selectDistrictOnPincode(patientOneDistrict);
    facilityPage.selectLocalBody(patientOneLocalbody);
    facilityPage.selectWard(patientOneWard);
    patientPage.clickNoneMedicialHistory();
    patientPage.selectPatientBloodGroup(patientOneBloodGroup);
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    patientConsultationPage.fillIllnessHistory("history");
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");

    patientConsultationPage.enterConsultationDetails(
      "Stable",
      "Examination details and Clinical conditions",
      "70",
      "170",
      "IP007",
      "generalnote",
      "Dev Doctor"
    );
    patientConsultationPage.submitConsultation();

    // Below code for the prescription module only present while creating a new consultation
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.interceptMediaBase();
    patientConsultationPage.selectMedicinebox();
    patientConsultationPage.waitForMediabaseStatusCode();
    patientConsultationPage.prescribefirstMedicine();
    patientConsultationPage.enterDosage("3");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescriptionAndReturn();
    patientConsultationPage.verifyConsultationPatientName(patientOneName);
  });

  it("Edit created consultation to existing patient", () => {
    // temporary fixing, whole file will be refactored soon
    cy.get("[data-cy='patient']").first().click();
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.fillIllnessHistory("editted");
    patientConsultationPage.updateSymptoms("FEVER");
    patientConsultationPage.setSymptomsDate("01082023");
    patientConsultationPage.updateConsultation();
    patientConsultationPage.verifySuccessNotification(
      "Consultation updated successfully"
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
