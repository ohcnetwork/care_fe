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

  it("Patient Details based advance filters applied in the patient tab", () => {
    // Patient Filtering based on data
    patientHome.clickPatientAdvanceFilters();
    cy.clickAndSelectOption("#gender-advancefilter", "Male");
    cy.clickAndSelectOption("#category-advancefilter", "Moderate");
    cy.get("#age_min").type("18");
    cy.get("#age_max").type("24");
    cy.clickAndMultiSelectOption(
      "#last_consultation_admitted_bed_type_list",
      "No bed assigned",
    );
    cy.clickAndMultiSelectOption(
      "#last_consultation__consent_types",
      "No consents",
    );
    cy.clickAndSelectOption("#telemedicine-advancefilter", "No");
    cy.clickAndSelectOption("#review-advancefilter", "No");
    cy.clickAndSelectOption("#medico-advancefilter", "Non-Medico-Legal");
    patientHome.clickPatientFilterApply();
    cy.get("a[data-cy='patient']").should("contain.text", "Dummy Patient");
    // Verify the presence of badges
  });

  it("Export the live patient list based on a date range", () => {
    patientHome.clickPatientExport();
    cy.verifyNotification("Please select a seven day period");
    cy.closeNotification();
    patientHome.typePatientModifiedBeforeDate("01122023");
    patientHome.typePatientModifiedAfterDate("07122023");
    patientHome.clickPatientFilterApply();
    patientHome.interceptPatientExportRequest();
    patientHome.clickPatientExport();
    patientHome.verifyPatientExportRequest();
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
