describe("External Results Filters", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/external_results");
    cy.contains("Filters").click();
  });

  it("Advance Filter", () => {
    cy.clickAndSelectOption("#local_bodies", "Aluva");
    cy.get("#local_bodies").click();
    cy.clickAndSelectOption("#wards", "4");
    cy.get("#wards").click();
    cy.contains("Apply").click();
  });

  it("filter by date", () => {
    cy.get("input[name='created_date_start']").click();
    cy.get("[data-test-id='increment-date-range']").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.get("[data-test-id='slide-over-container']").click(0, 0);
    cy.get("input[name='result_date_start']").click();
    cy.get("[data-test-id='increment-date-range']").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.get("[data-test-id='slide-over-container']").click(0, 0);
    cy.get("input[name='sample_collection_date_start']").click();
    cy.get("[data-test-id='increment-date-range']").click();
    cy.get("div[id='date-1']").click();
    cy.get("div[id='date-8']").click();
    cy.contains("Apply").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
