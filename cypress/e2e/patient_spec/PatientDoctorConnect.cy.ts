import { DoctorConnect } from "pageobject/Patient/PatientDoctorConnect";

import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

describe("Patient Doctor Connect in consultation page", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const doctorconnect = new DoctorConnect();
  const patientName = "Dummy Patient Eleven";
  const doctorUser = "Dev Doctor";
  const nurseUser = "Dev Staff";
  const teleIcuUser = "Tester Doctor";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Patient Doctor connect phone redirection and sort by filter", () => {
    // click on the slideover and verify icon redirection
    patientPage.visitPatient(patientName);
    doctorconnect.clickDoctorConnectButton();
    // verify all the users are visible under the all section
    cy.verifyContentPresence("#doctor-connect-home-doctor", [doctorUser]);
    cy.verifyContentPresence("#doctor-connect-home-nurse", [nurseUser]);
    cy.verifyContentPresence("#doctor-connect-remote-doctor", [teleIcuUser]);
    // verify copy content button functionality
    doctorconnect.CopyFunctionTrigger();
    doctorconnect.clickCopyPhoneNumber(
      "#doctor-connect-home-doctor",
      doctorUser,
    );
    doctorconnect.verifyCopiedContent();
    // verify the whatsapp and phone number icon presence
    doctorconnect.verifyIconVisible("#whatsapp-icon");
    doctorconnect.verifyIconVisible("#phone-icon");
    // sort the each datas based on user type
    doctorconnect.clickUsersSortBy("Doctor");
    cy.verifyContentPresence("#doctor-connect-home-doctor", [doctorUser]);
    doctorconnect.clickUsersSortBy("Nurse");
    cy.verifyContentPresence("#doctor-connect-home-nurse", [nurseUser]);
    doctorconnect.clickUsersSortBy("TeleICU Doctor");
    cy.verifyContentPresence("#doctor-connect-remote-doctor", [teleIcuUser]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
