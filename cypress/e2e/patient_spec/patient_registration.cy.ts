import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import {
  generatePhoneNumber,
  generateEmergencyPhoneNumber,
} from "../../pageobject/constants";
import PatientTransfer from "../../pageobject/Patient/PatientTransfer";
import PatientExternal from "../../pageobject/Patient/PatientExternal";
import PatientInsurance from "../../pageobject/Patient/PatientInsurance";
import PatientMedicalHistory from "../../pageobject/Patient/PatientMedicalHistory";

const yearOfBirth = "2001";

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

describe("Patient Creation with consultation", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const facilityPage = new FacilityPage();
  const patientTransfer = new PatientTransfer();
  const patientExternal = new PatientExternal();
  const patientInsurance = new PatientInsurance();
  const patientMedicalHistory = new PatientMedicalHistory();
  const phone_number = generatePhoneNumber();
  const emergency_phone_number = generateEmergencyPhoneNumber();
  const age = calculateAge();
  const patientFacility = "Dummy Facility 40";
  const patientDateOfBirth = "01012001";
  const patientOneName = "Patient With No Consultation";
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
  const patientOneUpdatedBloodGroup = "AB+";
  const patientOneFirstInsuranceId = "insurance-details-0";
  const patientOneFirstSubscriberId = "member id 01";
  const patientOneFirstPolicyId = "policy name 01";
  const patientOneFirstInsurerId = "insurer id 01";
  const patientOneFirstInsurerName = "insurer name 01";
  const patientOneSecondInsuranceId = "insurance-details-1";
  const patientOneSecondSubscriberId = "member id 02";
  const patientOneSecondPolicyId = "policy name 02";
  const patientOneSecondInsurerId = "insurer id 02";
  const patientOneSecondInsurerName = "insurer name 02";
  const patientTransferPhoneNumber = "9849511866";
  const patientTransferFacility = "Dummy Shifting Center";
  const patientTransferName = "Dummy Patient 10";
  const patientExternalName = "Patient 20";

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
    patientPage.selectFacility(patientFacility);
    patientPage.patientformvisibility();
    // Patient Details page
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
    // Patient Medical History
    patientMedicalHistory.typePatientPresentHealth(patientOnePresentHealth);
    patientMedicalHistory.typePatientOngoingMedication(
      patientOneOngoingMedication
    );
    patientMedicalHistory.typeMedicalHistory(2, "Diabetes");
    patientMedicalHistory.typeMedicalHistory(3, "Heart Disease");
    patientMedicalHistory.typeMedicalHistory(4, "HyperTension");
    patientMedicalHistory.typeMedicalHistory(5, "Kidney Diseases");
    patientMedicalHistory.typeMedicalHistory(6, "Lung Diseases/Asthma");
    patientMedicalHistory.typeMedicalHistory(7, "Cancer");
    patientMedicalHistory.typeMedicalHistory(8, "Other");
    patientMedicalHistory.typePatientAllergies(patientOneAllergies);
    patientPage.selectPatientBloodGroup(patientOneBloodGroup);
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    // Verify the patient details
    patientPage.clickCancelButton();
    cy.wait(3000);
    patientPage.savePatientUrl();
    patientPage.verifyPatientDashboardDetails(
      patientOneGender,
      age,
      patientOneName,
      phone_number,
      emergency_phone_number,
      yearOfBirth,
      patientOneBloodGroup
    );
    patientMedicalHistory.verifyPatientMedicalDetails(
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
    cy.wait(3000);
    patientPage.selectPatientGender(patientOneUpdatedGender);
    patientPage.clickPatientAntenatalStatusYes();
    patientPage.typeLastMenstruationStartDate("01012021");
    patientPage.selectPatientBloodGroup(patientOneUpdatedBloodGroup);
    // Edit the patient consultation , select none medical history and multiple health ID
    patientMedicalHistory.clickNoneMedicialHistory();
    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "subscriber_id",
      patientOneFirstSubscriberId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "policy_id",
      patientOneFirstPolicyId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "insurer_id",
      patientOneFirstInsurerId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "insurer_name",
      patientOneFirstInsurerName
    );
    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "subscriber_id",
      patientOneSecondSubscriberId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "policy_id",
      patientOneSecondPolicyId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "insurer_id",
      patientOneSecondInsurerId
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "insurer_name",
      patientOneSecondInsurerName
    );
    patientPage.clickUpdatePatient();
    cy.wait(3000);
    patientPage.verifyPatientUpdated();
    patientPage.visitPatientUrl();
    // Verify Female Gender change reflection, No Medical History and Insurance Details
    cy.wait(5000);
    patientPage.verifyPatientDashboardDetails(
      patientOneUpdatedGender,
      age,
      patientOneName,
      phone_number,
      emergency_phone_number,
      yearOfBirth,
      patientOneUpdatedBloodGroup
    );
    // Verify No medical history
    patientMedicalHistory.verifyNoSymptosPresent("Diabetes");
    // verify insurance details and dedicatd page
    cy.get("[data-testid=patient-details]")
      .contains(patientOneFirstSubscriberId)
      .scrollIntoView();
    cy.wait(2000);
    patientInsurance.verifyPatientPolicyDetails(
      patientOneFirstSubscriberId,
      patientOneFirstPolicyId,
      patientOneFirstInsurerId,
      patientOneFirstInsurerName
    );
    patientInsurance.clickPatientInsuranceViewDetail();
    cy.wait(3000);
    patientInsurance.verifyPatientPolicyDetails(
      patientOneFirstSubscriberId,
      patientOneFirstPolicyId,
      patientOneFirstInsurerId,
      patientOneFirstInsurerName
    );
    patientInsurance.verifyPatientPolicyDetails(
      patientOneSecondSubscriberId,
      patientOneSecondPolicyId,
      patientOneSecondInsurerId,
      patientOneSecondInsurerName
    );
  });

  it("Patient Registration using the transfer with no consultation", () => {
    // transfer the patient and no consulation
    patientPage.createPatient();
    patientPage.selectFacility(patientTransferFacility);
    patientPage.patientformvisibility();
    patientPage.typePatientPhoneNumber(patientTransferPhoneNumber);
    patientTransfer.clickAdmitPatientRecordButton();
    patientTransfer.clickTransferPopupContinueButton();
    patientTransfer.clickTransferPatientNameList(patientTransferName);
    patientTransfer.clickTransferPatientDob(patientDateOfBirth);
    patientTransfer.clickTransferSubmitButton();
    patientTransfer.verifyFacilitySuccessfullMessage();
    patientTransfer.clickConsultationCancelButton();
    cy.wait(3000);
    // allow the transfer button of a patient
    patientTransfer.clickAllowPatientTransferButton();
    // Verify the patient error message for the same facility
    cy.awaitUrl("/patients");
    patientPage.createPatient();
    patientPage.selectFacility(patientTransferFacility);
    patientPage.patientformvisibility();
    patientPage.typePatientPhoneNumber(patientTransferPhoneNumber);
    patientTransfer.clickAdmitPatientRecordButton();
    patientTransfer.clickTransferPopupContinueButton();
    patientTransfer.clickTransferPatientNameList(patientTransferName);
    patientTransfer.clickTransferPatientDob(patientDateOfBirth);
    patientTransfer.clickTransferSubmitButton();
    patientTransfer.verifyFacilityErrorMessage();
  });

  it("Patient Registration using External Result Import", () => {
    // copy the patient external ID from external results
    cy.awaitUrl("/external_results");
    patientExternal.verifyExternalListPatientName(patientExternalName);
    patientExternal.verifyExternalIdVisible();
    // cypress have a limitation to work only asynchronously
    // import the result and create a new patient
    let extractedId = "";
    cy.get("#patient-external-id")
      .invoke("text")
      .then((text) => {
        extractedId = text.split("Care external results ID: ")[1];
        cy.log(`Extracted Care external results ID: ${extractedId}`);
        cy.awaitUrl("/patients");
        patientPage.createPatient();
        patientPage.selectFacility(patientFacility);
        patientPage.patientformvisibility();
        patientExternal.clickImportFromExternalResultsButton();
        patientExternal.typeCareExternalResultId(extractedId);
        patientExternal.clickImportPatientData();
      });
    // verify the patient is successfully created
    patientExternal.verifyExternalPatientName(patientExternalName);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
