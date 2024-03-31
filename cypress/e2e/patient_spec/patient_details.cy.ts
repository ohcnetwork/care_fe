import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientSampleRequest } from "../../pageobject/Patient/PatientSampleRequest";
import { AssignToVolunteer } from "../../pageobject/Patient/AssignToVolunteer";
import { ShiftPatient } from "../../pageobject/Patient/ShiftPatient";

describe("patient details", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientSampleRequest = new PatientSampleRequest();
  const assignToVolunteer = new AssignToVolunteer();
  const shiftPatient = new ShiftPatient();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  const patientName = "Gigin";
  const ICMRlabel = "ICMR";
  const fastTrackRequired = true;
  const fastTrackReason = "dummy reason";
  const atypicalPresentation = true;
  const atypicalDetails = "dummy details";
  const doctorName = "dummy doctor";
  const diagnosis = "dummy diagnosis";
  const etiology = "dummy etiology";
  const differentialDiagnosis = "dummy diagnosis";
  const ari = true;
  const sari = true;
  const isUnusual = true;

  it("Create Patient Sample Test Request", () => {
    patientPage.visitPatient(patientName);
    patientSampleRequest.visitPatientDetails();
    patientSampleRequest.visitSampleRequest();
    patientSampleRequest.selectSampleTestType();
    patientSampleRequest.selectICMRCategory();
    patientSampleRequest.typeICMRLabel(ICMRlabel);
    patientSampleRequest.selectIsFastTrackRequired(fastTrackRequired);
    patientSampleRequest.fastTrackReason(fastTrackRequired, fastTrackReason);
    patientSampleRequest.selectIsATypicalPresentation(atypicalPresentation);
    patientSampleRequest.atypicalDetails(atypicalPresentation, atypicalDetails);
    patientSampleRequest.typeDoctorName(doctorName);
    patientSampleRequest.typeDiagnosis(diagnosis);
    patientSampleRequest.typeEtiologyIdentified(etiology);
    patientSampleRequest.typeDifferentialDiagnosis(differentialDiagnosis);
    patientSampleRequest.selectHasAri(ari);
    patientSampleRequest.selectHasSari(sari);
    patientSampleRequest.selectIsUnusual(isUnusual);
    // patientSampleRequest.clickCancelButton();
    patientSampleRequest.clickSubmitButton();
  });

  const contactPersonName = "Manas";
  const phoneNumber = "9650244789";
  const facilityName = "Govt";
  const patientCategory = "Comfort";
  const shiftReason = "dummy reason";
  const driverName = "Mohit";
  const ambulancePhoneNumber = "7845968745";
  const ambulanceNumber = "201301";
  const comment = "dummy comment";

  it("Create Patient Shift Patient Request", () => {
    patientPage.visitPatient(patientName);
    patientSampleRequest.visitPatientDetails();
    shiftPatient.visitShiftPatient();
    shiftPatient.typeContactPersonName(contactPersonName);
    shiftPatient.typePhoneNumber(phoneNumber);
    shiftPatient.selectFacility(facilityName);
    shiftPatient.selectPatientCategory(patientCategory);
    shiftPatient.typeReasonForShift(shiftReason);
    shiftPatient.typeNameOfDriver(driverName);
    shiftPatient.typeAmbulancePhoneNumber(ambulancePhoneNumber);
    shiftPatient.typeAmbulanceNumber(ambulanceNumber);
    shiftPatient.typeOtherComments(comment);
    shiftPatient.clickSubmitButton();
    // shiftPatient.clickCancelButton();
  });

  const volunteerName = "Volunteer";

  it("assign volunteer", () => {
    patientPage.visitPatient(patientName);
    patientSampleRequest.visitPatientDetails();
    assignToVolunteer.visitAssignToVolunteer();
    assignToVolunteer.selectVolunteer(volunteerName);
    assignToVolunteer.clickCancelButton();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
