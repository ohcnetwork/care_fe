/// <reference types="cypress" />


describe("Edit Profile Testing", () => {
    before(() => {
      cy.login('devdistrictadmin', 'Coronasafe@123');
      cy.saveLocalStorage();
    });
  
    beforeEach(() => {
      cy.restoreLocalStorage();
      cy.visit('http://localhost:4000');
      cy.get("a").contains("External Result").click();
      cy.url().should("include", "/external_results");
    });
  
    // TODO: set identifying attribute for blank tests
    
    it('filter by lsg', () => {
        
    })

    it('filter by ward', () => {
    })

    it('filter by created date', () => {

    })

    it('filter by result date', () => {

    })

    it('filter by sample collection date', () => {

    })

    it('filter by srf id', () => {
        cy.get('[name="srf_id"]').type('432')
        cy.contains('Apply').click()
    })
  
    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
  