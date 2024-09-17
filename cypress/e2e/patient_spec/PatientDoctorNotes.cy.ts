import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientDoctorNotes } from "../../pageobject/Patient/PatientDoctorNotes";

describe("Patient", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientDoctorNotes = new PatientDoctorNotes();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a nurse note for a patient and verify both ID received the messages", () => {
    // Create a doctor notes a with a district admin
    patientPage.visitPatient("Dummy Patient 3");
    patientDoctorNotes.visitDoctorNotesPage();
    cy.verifyNotification(
      "Please subscribe to notifications to get live updates on discussion notes.",
    );
    cy.closeNotification();
    // switch the switch to nurse note, as the bydefault is doctornotes
    patientDoctorNotes.addDoctorsNotes("Test nurse Notes");
    patientDoctorNotes.postDoctorNotes();
    cy.verifyNotification("Note added successfully");
    cy.closeNotification();
    // verify the auto-switching of tab to nurse notes if the user is a nurse
    cy.get("p").contains("Sign Out").click();
    loginPage.loginManuallyAsNurse();
    loginPage.ensureLoggedIn();
    cy.visit("/patients");
    patientPage.visitPatient("Dummy Patient 3");
    patientDoctorNotes.visitDoctorNotesPage();
    cy.closeNotification();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
