import { cy, it, describe, afterEach, beforeEach } from 'local-cypress'

const username = "devdistrictadmin"
const password = "Coronasafe@123"
const phone_number = "9"+parseInt(Math.random()*(10**9)).toString()
const emergency_phone_number = "9430163282"

describe("Patient Creation", () => {
  it("Create", () => {
    cy.visit("http://localhost:4000/")
    cy.get('input[name="username"]').type(username)
    cy.get('input[name="password"]').type(password)
    cy.get('button').contains('Login').click()
    cy.url().should('include', '/facility')
    cy.visit("http://localhost:4000/facility/2fa3fceb-d54d-455d-949c-e64dde945168")

    cy.get("[data-testid=add-patient-button]").click()
    cy.get("[data-testid=phone-number] input").type(phone_number)
    cy.get("[data-testid=date-of-birth] input").type("12121999")
    cy.get("[data-testid=name] input").type("Test E2E User")
    cy.get("[data-testid=Gender] select").select("Male")
    cy.get("[data-testid=state] select").select("Kerala")
    cy.get("[data-testid=district] select").select("Ernakulam")
    cy.get("[data-testid=localbody] select").select("844")
    cy.get("[data-testid=current-address] textarea").type("Test Patient Address")
    cy.get("[data-testid=permanent-address] input").check()
    cy.get("[data-testid=ward-respective-lsgi] select").select("15015")
    cy.get("[data-testid=pincode] input").type("159015")
    cy.get("[data-testid=blood-group] select").select("O+")
    cy.get("[data-testid=emergency-phone-number] input").type(emergency_phone_number)
    cy.get("[data-testid=submit-button]").click()
  })
})
