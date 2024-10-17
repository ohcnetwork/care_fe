export class PatientDoctorNotes {
  visitDiscussionNotesPage() {
    cy.get("#patient_discussion_notes").scrollIntoView();
    cy.get("#patient_discussion_notes").click();
  }

  addDiscussionNotes(notes: string) {
    cy.wait(2000);
    cy.get("#discussion_notes_textarea").scrollIntoView();
    cy.get("#discussion_notes_textarea").click().type(notes);
  }

  selectNurseDiscussion() {
    cy.get("#patient-note-tab-Nurses").scrollIntoView();
    cy.get("#patient-note-tab-Nurses").click();
  }

  verifyDiscussionMessage(text: string) {
    cy.get("#patient-notes-list").contains(text);
  }

  postDiscussionNotes() {
    cy.intercept("POST", "**/api/v1/patient/*/notes").as("postDiscussionNotes");
    cy.get("#add_doctor_note_button").click();
    cy.wait("@postDiscussionNotes")
      .its("response.statusCode")
      .should("eq", 201);
  }

  signout() {
    cy.get("#user-profile-name").click();
    cy.get("#sign-out-button").scrollIntoView();
    cy.get("#sign-out-button").contains("Sign Out").click();
  }
}
