import { cy, it, describe, afterEach } from 'local-cypress'

describe('authentication', () => {
    afterEach(() => {
        cy.log('Logging the user out')
        cy.get('p').contains('Sign Out').click()
        cy.url().should('include', '/login')
    })

    it('Login as distict admin', () => {
        cy.visit('http://localhost:4000/')

        // Login
        cy.get('input[name="username"]').type('karadmin')
        cy.get('input[name="password"]').type('passwordR0FL')
        cy.get('button').contains('Login').click()

        // Check URL
        cy.url().should('include', '/facility')

        // Assert user
        cy.get('a').contains('Profile').click()
        cy.url().should('include', '/user/profile')
        cy.get('dd').should('contain', 'karadmin')
        cy.get('dd').should('contain', 'DistrictAdmin')
    })

    it('Login as disctrict admin - read only', () => {
        cy.visit('http://localhost:4000/')

        // Login
        cy.get('input[name="username"]').type('karadminro')
        cy.get('input[name="password"]').type('passwordR0FL')
        cy.get('button').contains('Login').click()

        // Check URL
        cy.url().should('include', '/facility')

        // Assert user
        cy.get('a').contains('Profile').click()
        cy.url().should('include', '/user/profile')
        cy.get('dd').should('contain', 'karadminro')
        cy.get('dd').should('contain', 'DistrictReadOnlyAdmin')
    })
})
