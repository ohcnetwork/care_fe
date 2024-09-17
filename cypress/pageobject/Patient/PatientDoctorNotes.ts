export class PatientDoctorNotes {
  visitDoctorNotesPage() {
    cy.get("#patient_doctor_notes").scrollIntoView();
    cy.get("#patient_doctor_notes").click();
  }

  addDoctorsNotes(notes: string) {
    cy.get("#doctor_notes_textarea").scrollIntoView();
    cy.get("#doctor_notes_textarea").click().type(notes);
  }

  postDoctorNotes() {
    cy.intercept("POST", "**/api/v1/patient/*/notes").as("postDoctorNotes");
    cy.get("#add_doctor_note_button").click();
    cy.wait("@postDoctorNotes").its("response.statusCode").should("eq", 201);
  }
}
