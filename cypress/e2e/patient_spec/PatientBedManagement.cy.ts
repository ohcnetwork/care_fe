import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientLogupdate from "../../pageobject/Patient/PatientLogupdate";

describe("Patient swtich bed functionality", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientLogupdate = new PatientLogupdate();
  const patientConsultationPage = new PatientConsultationPage();
  const switchBedOne = "Dummy Bed 4";
  const switchBedTwo = "Dummy Bed 1";
  const switchBedThree = "Dummy Bed 7";
  const switchPatientOne = "Dummy Patient Six";
  const switchPatientTwo = "Dummy Patient Seven";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Assign a bed for a admitted patient from update consultation page", () => {
    // Open the update consultation page and assign a bed
    patientPage.visitPatient(switchPatientTwo);
    patientConsultationPage.clickEditConsultationButton();
    patientLogupdate.selectBed(switchBedThree);
    // verify the notification
    cy.verifyNotification("Bed allocated successfully");
  });

  it("Assign a bed for a admitted patient from patient dashboard", () => {
    // Assign a bed to a patient
    patientPage.visitPatient(switchPatientOne);
    patientLogupdate.clickSwitchBed();
    patientLogupdate.selectBed(switchBedOne);
    cy.verifyNotification("Bed allocated successfully");
    // Clear the bed and reassign
    patientLogupdate.clickSwitchBed();
    cy.get("#clear-button").click();
    patientLogupdate.selectBed(switchBedTwo);
    cy.verifyNotification("Bed allocated successfully");
    // verify the card is reflected
    patientLogupdate.clickSwitchBed();
    cy.verifyContentPresence("#previousbed-list", [switchBedOne, switchBedTwo]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
