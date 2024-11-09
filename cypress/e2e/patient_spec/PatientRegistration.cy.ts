import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientInsurance from "../../pageobject/Patient/PatientInsurance";
import PatientMedicalHistory from "../../pageobject/Patient/PatientMedicalHistory";
import PatientTransfer from "../../pageobject/Patient/PatientTransfer";
import { generatePhoneNumber } from "../../pageobject/utils/constants";

const yearOfBirth = "2001";
const isHCXEnabled = Cypress.env("ENABLE_HCX");

const calculateAge = () => {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfBirth);
};

const getRelativeDateString = (deltaDays = 0) => {
  const date = new Date();
  if (deltaDays) {
    date.setDate(date.getDate() + deltaDays);
  }
  return date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "");
};

describe("Patient Creation with consultation", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const facilityPage = new FacilityPage();
  const patientTransfer = new PatientTransfer();
  const patientInsurance = new PatientInsurance();
  const patientMedicalHistory = new PatientMedicalHistory();
  const phone_number = generatePhoneNumber();
  const age = calculateAge();
  const patientFacility = "Dummy Facility 40";
  const patientDateOfBirth = "01012001";
  const patientMenstruationStartDate = getRelativeDateString(-10);
  const patientDateOfDelivery = getRelativeDateString(-20);
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
  const patientOccupation = "Student";

  before(() => {
    loginPage.loginAsDistrictAdmin();
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
    patientPage.checkPhoneNumberIsEmergencyNumber();
    patientPage.typePatientAge(age.toString());
    patientPage.typePatientName(patientOneName);
    patientPage.selectPatientGender(patientOneGender);
    patientPage.typePatientAddress(patientOneAddress);
    facilityPage.fillPincode(patientOnePincode);
    facilityPage.selectStateOnPincode(patientOneState);
    facilityPage.selectDistrictOnPincode(patientOneDistrict);
    facilityPage.selectLocalBody(patientOneLocalbody);
    facilityPage.selectWard(patientOneWard);
    patientPage.selectPatientOccupation(patientOccupation);
    patientPage.selectSocioeconomicStatus("MIDDLE_CLASS");
    patientPage.selectDomesticHealthcareSupport("FAMILY_MEMBER");
    // Patient Medical History
    patientMedicalHistory.typePatientPresentHealth(patientOnePresentHealth);
    patientMedicalHistory.typePatientOngoingMedication(
      patientOneOngoingMedication,
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
      phone_number,
      yearOfBirth,
      patientOneBloodGroup,
      patientOccupation,
      "Middle Class",
      "Family member",
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
      "Other",
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
    patientPage.typePatientDateOfBirth(patientDateOfBirth);
    patientPage.clickPatientAntenatalStatusYes();
    patientPage.typeLastMenstruationStartDate(patientMenstruationStartDate);
    patientPage.clickPatientPostPartumStatusYes();
    patientPage.typeDateOfDelivery(patientDateOfDelivery);
    patientPage.selectPatientBloodGroup(patientOneUpdatedBloodGroup);
    // Edit the patient consultation , select none medical history and multiple health ID
    patientMedicalHistory.clickNoneMedicialHistory();
    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "subscriber_id",
      patientOneFirstSubscriberId,
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneFirstInsuranceId,
      "policy_id",
      patientOneFirstPolicyId,
    );
    if (isHCXEnabled) {
      patientInsurance.selectInsurer("test");
    } else {
      patientInsurance.typePatientInsuranceDetail(
        patientOneFirstInsuranceId,
        "insurer_id",
        patientOneFirstInsurerId,
      );
      patientInsurance.typePatientInsuranceDetail(
        patientOneFirstInsuranceId,
        "insurer_name",
        patientOneFirstInsurerName,
      );
    }

    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "subscriber_id",
      patientOneSecondSubscriberId,
    );
    patientInsurance.typePatientInsuranceDetail(
      patientOneSecondInsuranceId,
      "policy_id",
      patientOneSecondPolicyId,
    );
    if (isHCXEnabled) {
      patientInsurance.selectInsurer("Care");
    } else {
      patientInsurance.typePatientInsuranceDetail(
        patientOneSecondInsuranceId,
        "insurer_id",
        patientOneSecondInsurerId,
      );
      patientInsurance.typePatientInsuranceDetail(
        patientOneSecondInsuranceId,
        "insurer_name",
        patientOneSecondInsurerName,
      );
    }

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
      phone_number,
      yearOfBirth,
      patientOneUpdatedBloodGroup,
      patientOccupation,
    );
    // Verify No medical history
    patientMedicalHistory.verifyNoSymptosPresent("Diabetes");
    // verify insurance details and dedicatd page
    cy.get("[data-testid=patient-details]")
      .contains("member id")
      .scrollIntoView();
    cy.wait(2000);
    patientInsurance.clickPatientInsuranceViewDetail();
    cy.wait(3000);
    patientInsurance.verifyPatientPolicyDetails(
      patientOneFirstSubscriberId,
      patientOneFirstPolicyId,
      patientOneFirstInsurerId,
      patientOneFirstInsurerName,
      isHCXEnabled,
    );
    patientInsurance.verifyPatientPolicyDetails(
      patientOneSecondSubscriberId,
      patientOneSecondPolicyId,
      patientOneSecondInsurerId,
      patientOneSecondInsurerName,
      isHCXEnabled,
    );
  });

  it("Patient Registration using the transfer with no consultation", () => {
    // transfer the patient with no consulation and verify the transfer to a new facility
    patientPage.createPatient();
    patientPage.selectFacility(patientTransferFacility);
    patientPage.patientformvisibility();
    patientPage.typePatientPhoneNumber(patientTransferPhoneNumber);
    patientTransfer.clickAdmitPatientRecordButton();
    patientTransfer.clickTransferPopupContinueButton();
    patientTransfer.clickTransferPatientNameList(patientTransferName);
    patientTransfer.clickTransferPatientYOB(yearOfBirth);
    patientTransfer.clickTransferSubmitButton();
    cy.verifyNotification(
      "Patient Dummy Patient 10 (Male) transferred successfully",
    );
    patientTransfer.clickConsultationCancelButton();
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
    patientTransfer.clickTransferPatientYOB(yearOfBirth);
    patientTransfer.clickTransferSubmitButton();
    cy.verifyNotification(
      "Patient - Patient transfer cannot be completed because the patient has an active consultation in the same facility",
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
