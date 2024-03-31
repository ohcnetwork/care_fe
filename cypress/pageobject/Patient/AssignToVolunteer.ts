import { cy } from "local-cypress";
export class AssignToVolunteer {
  visitAssignToVolunteer() {
    cy.get("#volunteer_assign").click({ force: true });
  }
  selectVolunteer(volunteer: string) {
    cy.searchAndSelectOption("#assign_volunteer input", volunteer);
  }
  clickSubmitButton() {
    cy.get("#submit").click();
  }
  clickCancelButton() {
    cy.get("#cancel").click();
  }
}
