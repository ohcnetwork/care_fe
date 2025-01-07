export class PatientSearch {
  // Selectors
  private selectors = {
    patientsButton: '[data-cy="patients-button"]',
    searchInput: "#patient-search",
    patientCard: "#patient-search-results",
    patientName: '[data-cy="patient-name"]',
    patientDetails: "#patient-search-results",
  };

  // Actions
  searchPatient(searchQuery: string) {
    cy.get(this.selectors.searchInput).type(searchQuery);

    // Wait for results to load
    cy.get(this.selectors.patientCard).should("be.visible");
    return this;
  }

  verifySearchResults(patientDetails: {
    name: string;
    sex: string;
    phone: string;
  }) {
    // Convert object values to an array of strings
    const detailsArray = Object.values(patientDetails);
    cy.verifyContentPresence(this.selectors.patientDetails, detailsArray);
  }

  selectFacility(facilityName: string) {
    cy.verifyAndClickElement("[data-cy='facility-list']", facilityName);
    return this;
  }

  clickSearchPatients() {
    cy.get('[data-sidebar="content"]').contains("Search Patients").click();
    return this;
  }
}

export const patientSearch = new PatientSearch();
