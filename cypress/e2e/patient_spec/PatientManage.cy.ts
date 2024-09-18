import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

describe("Patient", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientConsultationPage = new PatientConsultationPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  // it("Create Patient shift requests.", () => {
  //   patientPage.visitPatient();
  //   patientConsultationPage.visitShiftRequestPage();
  //   patientConsultationPage.enterPatientShiftDetails(
  //     "Test User",
  //     phone_number,
  //     "Dummy Shifting",
  //     "Reason"
  //   );
  //   patientConsultationPage.createShiftRequest();
  //   patientConsultationPage.verifySuccessNotification(
  //     "Shift request created successfully"
  //   );
  // });
  // commented out the shifting request, as logic need to be re-visited

  it("Post discussion notes for an already created patient", () => {
    patientPage.visitPatient("Dummy Patient 3");
    patientConsultationPage.visitDoctorNotesPage();
    patientConsultationPage.addDoctorsNotes("Test Doctor Notes");
    patientConsultationPage.postDoctorNotes();
    cy.verifyNotification("Note added successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
