import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { UpdatePatientPage } from "../../pageobject/Patient/PatientUpdate";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import {
  emergency_phone_number,
  phone_number,
} from "../../pageobject/constants";
const yearOfBirth = "2001";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation with consultation", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const updatePatientPage = new UpdatePatientPage();
  const patientConsultationPage = new PatientConsultationPage();
  const facilityPage = new FacilityPage();
  const age = calculateAge();
  const patientDateOfBirth = "01012001";
  const patientOneName = "Patient With No Consultation";
  const patientOneUpdatedName = "Updated Patient 001";
  const patientOneGender = "Male";
  const patientOneUpdatedGender = "Female";
  const patientOneAddress = "Test Patient Address";
  const patientOnePincode = "682001";
  const patientOneState = "Kerala";
  const patientOneDistrict = "Ernakulam";
  const patientOneLocalbody = "Aluva";
  const patientOneWard = "4";
  const patientOnePresentHealth = "Present Health Condition";
  const patientOneOngoingMedication = "Ongoing Medication";
  const patientOneAllergies = "Allergies";
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

  it("Create a new patient with all field in registration form and no consultation", () => {
    // patient details with all the available fields except covid
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility 40");
    patientPage.patientformvisibility();
    // Patient Details page
    patientPage.typePatientPhoneNumber(phone_number);
    patientPage.typePatientEmergencyNumber(emergency_phone_number);
    patientPage.clickAddInsruanceDetails();
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId("member id 01");
    patientPage.typePolicyId("policy name 01");
    patientPage.typeInsurerId("insurer id 01");
    patientPage.typeInsurerName("insurer name 01");
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId("member id 02");
    patientPage.typePolicyId("policy name 02");
    patientPage.typeInsurerId("insurer id 02");
    patientPage.typeInsurerName("insurer name 02");
    updatePatientPage.clickUpdatePatient();
    updatePatientPage.verifyPatientUpdated();
    updatePatientPage.saveUpdatedPatientUrl();
    patientPage.typePatientDateOfBirth(patientDateOfBirth);
    patientPage.typePatientName(patientOneName);
    patientPage.selectPatientGender(patientOneGender);
    patientPage.typePatientAddress(patientOneAddress);
    facilityPage.fillPincode(patientOnePincode);
    facilityPage.selectStateOnPincode(patientOneState);
    facilityPage.selectDistrictOnPincode(patientOneDistrict);
    facilityPage.selectLocalBody(patientOneLocalbody);
    facilityPage.selectWard(patientOneWard);
    // Patient Medical History
    patientPage.typePatientPresentHealth(patientOnePresentHealth);
    patientPage.typePatientOngoingMedication(patientOneOngoingMedication);
    patientPage.typeMedicalHistory(2, "Diabetes");
    patientPage.typeMedicalHistory(3, "Heart Disease");
    patientPage.typeMedicalHistory(4, "HyperTension");
    patientPage.typeMedicalHistory(5, "Kidney Diseases");
    patientPage.typeMedicalHistory(6, "Lung Diseases/Asthma");
    patientPage.typeMedicalHistory(7, "Cancer");
    patientPage.typeMedicalHistory(8, "Other");
    patientPage.typePatientAllergies(patientOneAllergies);
    patientPage.selectPatientBloodGroup(patientOneBloodGroup);
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    patientPage.saveCreatedPatientUrl();
    // Verify the patient details
    patientPage.clickCancelButton();
    cy.wait(3000);
    patientPage.verifyPatientDashboardDetails(
      patientOneGender,
      age,
      patientOneName,
      phone_number,
      emergency_phone_number,
      yearOfBirth,
      patientOneBloodGroup
    );
    patientPage.verifyPatientMedicalDetails(
      patientOnePresentHealth,
      patientOneOngoingMedication,
      patientOneAllergies,
      "Diabetes",
      "Heart Disease",
      "HyperTension",
      "Kidney Diseases",
      "Lung Diseases/Asthma",
      "Cancer",
      "Other"
    );
    // verify its presence in the patient detail page
    cy.visit("/patients");
    patientPage.typePatientNameList(patientOneName);
    patientPage.verifyPatientNameList(patientOneName);
  });

  it("Edit the patient details with no consultation and verify", () => {
    patientPage.interceptFacilities();
    patientPage.visitUpdatePatientUrl();
    patientPage.verifyStatusCode();
    patientPage.patientformvisibility();
    // change the gender to female and input data to related changed field
    patientPage.clearPatientName();
    patientPage.typePatientName(patientOneUpdatedName);
    patientPage.selectPatientGender(patientOneUpdatedGender);
    patientPage.clickPatientAntenatalStatusYes();
    // Edit the patient consultation , select none medical history and multiple health ID
    patientPage.clickNoneMedicialHistory();
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId("member id 01");
    patientPage.typePolicyId("policy name 01");
    patientPage.typeInsurerId("insurer id 01");
    patientPage.typeInsurerName("insurer name 01");
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId("member id 02");
    patientPage.typePolicyId("policy name 02");
    patientPage.typeInsurerId("insurer id 02");
    patientPage.typeInsurerName("insurer name 02");
    updatePatientPage.clickUpdatePatient();
    updatePatientPage.verifyPatientUpdated();
    updatePatientPage.saveUpdatedPatientUrl();
  });

  it("Create a New consultation to existing patient", () => {
    patientPage.interceptFacilities();
    updatePatientPage.visitConsultationPage();
    patientPage.verifyStatusCode();
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
  });

  it("Edit created consultation to existing patient", () => {
    updatePatientPage.visitUpdatedPatient();
    patientConsultationPage.visitEditConsultationPage();
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
