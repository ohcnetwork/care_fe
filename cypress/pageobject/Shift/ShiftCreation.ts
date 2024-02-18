export class ShiftCreation {
  typeCurrentFacilityPerson(name: string) {
    cy.get("#refering_facility_contact_name").click().type(name);
  }

  typeCurrentFacilityPhone(number: string) {
    cy.get("#refering_facility_contact_number").click().type(number);
  }

  typeShiftReason(reason: string) {
    cy.get("#reason").click().type(reason);
  }

  submitShiftForm() {
    cy.get("#submit").contains("Submit").click();
  }
}
export default ShiftCreation;
