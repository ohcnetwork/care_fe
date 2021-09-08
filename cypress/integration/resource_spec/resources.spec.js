/// <reference types="cypress" />


describe("Edit Profile Testing", () => {
    before(() => {
      cy.login('devdistrictadmin', 'Coronasafe@123');
      cy.saveLocalStorage();
    });
  
    beforeEach(() => {
      cy.restoreLocalStorage();
      cy.visit('http://localhost:4000');
      cy.get("a").contains("Resource").click();
      cy.url().should("include", "/resource");
    });
  
    it("checks if all download button works", () => {
      cy.get('svg.MuiSvgIcon-root.cursor-pointer').then((downloadButtons) => {
          downloadButtons.forEach((button) => {
              button.click()
          })
      })
    });
  
    it("switch between list view and board view", () => {
      cy.contains('List View').click();
      cy.wait(1000);
      cy.contains('Board View').click();
    })
  
    it("switch between active/completed", () => {
      cy.contains('Completed').click().wait(2000)
      cy.contains('Active').should('have.class', 'bg-gray-200')
      cy.contains('Completed').should('have.class', 'bg-white')
  
      cy.contains('Active').click().wait(2000)
      cy.contains('Active').should('have.class', 'bg-white')
      cy.contains('Completed').should('have.class', 'bg-gray-200')
    })
  
    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
  