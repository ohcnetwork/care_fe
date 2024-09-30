import LoginPage from "../../pageobject/Login/LoginPage";
import PatientHome from "../../pageobject/Patient/PatientHome";

describe("Patient Homepage present functionalities", () => {
  const loginPage = new LoginPage();
  const patientHome = new PatientHome();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Verify the functionality of the patient tab pagination", () => {
    let firstPatientPageOne: string;
    cy.get('[data-cy="patient"]')
      .first()
      .invoke("text")
      .then((patientOne: string) => {
        firstPatientPageOne = patientOne.trim();
        patientHome.clickNextPage();
        patientHome.verifySecondPageUrl();
        cy.get('[data-cy="patient"]')
          .first()
          .invoke("text")
          .then((patientTwo: string) => {
            const firstPatientPageTwo = patientTwo.trim();
            expect(firstPatientPageOne).not.to.eq(firstPatientPageTwo);
            patientHome.clickPreviousPage();
          });
      });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
