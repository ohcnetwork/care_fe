import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientDoctorNotes } from "../../pageobject/Patient/PatientDoctorNotes";

describe("Patient Discussion notes in the consultation page", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientDoctorNotes = new PatientDoctorNotes();
  const patientName = "Dummy Patient Four";
  const patientNurseNote = "Test nurse Notes";
  const patientNurseReplyNote = "Test nurse reply Notes";
  const discussionNotesSubscribeWarning =
    "Please subscribe to notifications to get live updates on discussion notes.";
  const discussionNotesSuccessMessage = "Note added successfully";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a nurse note for a patient and verify both ID received the messages", () => {
    // Create a doctor notes a with a district admin
    patientPage.visitPatient(patientName);
    patientDoctorNotes.visitDiscussionNotesPage();
    cy.verifyNotification(discussionNotesSubscribeWarning);
    cy.closeNotification();
    // switch the switch to nurse note, as the bydefault is doctornotes
    patientDoctorNotes.selectNurseDiscussion();
    patientDoctorNotes.addDiscussionNotes(patientNurseNote);
    patientDoctorNotes.postDiscussionNotes();
    cy.verifyNotification(discussionNotesSuccessMessage);
    cy.closeNotification();
    // verify the auto-switching of tab to nurse notes if the user is a nurse
    patientDoctorNotes.signout();
    loginPage.loginManuallyAsNurse();
    loginPage.ensureLoggedIn();
    cy.visit("/patients");
    patientPage.visitPatient(patientName);
    patientDoctorNotes.visitDiscussionNotesPage();
    // verify the message is received from admin
    cy.verifyNotification(discussionNotesSubscribeWarning);
    cy.closeNotification();
    patientDoctorNotes.verifyDiscussionMessage(patientNurseNote);
    // Post a reply comment to the message
    patientDoctorNotes.addDiscussionNotes(patientNurseReplyNote);
    patientDoctorNotes.postDiscussionNotes();
    cy.verifyNotification(discussionNotesSuccessMessage);
    cy.closeNotification();
    patientDoctorNotes.verifyDiscussionMessage(patientNurseReplyNote);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
