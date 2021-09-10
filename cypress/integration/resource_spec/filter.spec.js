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
  
    it('filter by origin facility', () => {
        // set name for origin facility field
    })

    it('filter by resource approval facility', () => {
        // set name for shifting approval facility field
    })

    it('filter by assigned facility', () => {

    })

    it('filter by assigned to facility', () => {

    })

    it('filter by ordering', () => {
        ['DESC Created Date', 'ASC Modified Date', 'DESC Modified Date', 'ASC Created Date']
        .forEach((select) => {
            cy.get('[name="ordering"]').select(select)
            cy.contains('Apply').click().wait(1000)
            //click filter
        })
    })

    it('filter by emergency case', () => {
        ['yes', 'no']
        .forEach((select) => {
            cy.get('[name="emergency"]').select(select)
            cy.contains('Apply').click().wait(1000)
            //click filter 
        })
    })

    it('filter by created date', () => {
      cy.get('[name="created_date_after"]').type('22/05/2020')
      cy.get('[name="created_date_before"]').type('09/09/2021')
    })

    it('filter by modified date', () => {
      cy.get('[name="modified_date_after"]').type('22/05/2020')
      cy.get('[name="modified_date_before"]').type('09/09/2021')
    })
  
    afterEach(() => {
      cy.saveLocalStorage();
    });
  });
  