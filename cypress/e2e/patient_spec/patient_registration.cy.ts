import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
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
  const facilityPage = new FacilityPage();
  const age = calculateAge();
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
    cy.wait(3000);
    patientPage.selectPatientGender(patientOneUpdatedGender);
    patientPage.clickPatientAntenatalStatusYes();
    patientPage.selectPatientBloodGroup(patientOneUpdatedBloodGroup);
    // Edit the patient consultation , select none medical history and multiple health ID
    patientPage.clickNoneMedicialHistory();
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId(
      patientOneFirstInsuranceId,
      patientOneFirstSubscriberId
    );
    patientPage.typePolicyId(
      patientOneFirstInsuranceId,
      patientOneFirstPolicyId
    );
    patientPage.typeInsurerId(
      patientOneFirstInsuranceId,
      patientOneFirstInsurerId
    );
    patientPage.typeInsurerName(
      patientOneFirstInsuranceId,
      patientOneFirstInsurerName
    );
    patientPage.clickAddInsruanceDetails();
    patientPage.typeSubscriberId(
      patientOneSecondInsuranceId,
      patientOneSecondSubscriberId
    );
    patientPage.typePolicyId(
      patientOneSecondInsuranceId,
      patientOneSecondPolicyId
    );
    patientPage.typeInsurerId(
      patientOneSecondInsuranceId,
      patientOneSecondInsurerId
    );
    patientPage.typeInsurerName(
      patientOneSecondInsuranceId,
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
    patientPage.verifyNoSymptosPresent("Diabetes");
    // verify insurance details and dedicatd page
    cy.get("[data-testid=patient-details]")
      .contains(patientOneFirstSubscriberId)
      .scrollIntoView();
    cy.wait(2000);
    patientPage.verifyPatientPolicyDetails(
      patientOneFirstSubscriberId,
      patientOneFirstPolicyId,
      patientOneFirstInsurerId,
      patientOneFirstInsurerName
    );
    patientPage.clickPatientInsuranceViewDetail();
    cy.wait(3000);
    patientPage.verifyPatientPolicyDetails(
      patientOneFirstSubscriberId,
      patientOneFirstPolicyId,
      patientOneFirstInsurerId,
      patientOneFirstInsurerName
    );
    patientPage.verifyPatientPolicyDetails(
      patientOneSecondSubscriberId,
      patientOneSecondPolicyId,
      patientOneSecondInsurerId,
      patientOneSecondInsurerName
    );
  });

  it("Patient Registration using the transfer with no consultation", () => {
    // transfer the patient and no consulation
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Shifting Center");
    patientPage.patientformvisibility();
    // cancel and go to patient detail page and verify transferred facility name
  });

  it("Patient Registration using External Result Import", () => {
    // copy the patient external ID from external results
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Shifting Center");
    patientPage.patientformvisibility();
    // import the result and create a new patient

    // verify the patient is successfully created
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
