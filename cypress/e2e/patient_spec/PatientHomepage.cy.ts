import LoginPage from "../../pageobject/Login/LoginPage";
import PatientHome from "../../pageobject/Patient/PatientHome";

describe("Patient Homepage present functionalities", () => {
  const loginPage = new LoginPage();
  const patientHome = new PatientHome();
  const patientGender = "Male";
  const patientCategory = "Moderate";
  const patientMinimumAge = "18";
  const patientMaximumAge = "24";
  const patientLastAdmittedBed = "No bed assigned";
  const PatientLastConsentType = "No consents";
  const patientTelemedicinePerference = "No";
  const patientReviewStatus = "No";
  const patientMedicoStatus = "Non-Medico-Legal";

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
    patientHome.selectPatientGenderfilter(patientGender);
    patientHome.selectPatientCategoryfilter(patientCategory);
    patientHome.typePatientMinimumAgeFilter(patientMinimumAge);
    patientHome.typePatientMaximumAgeFilter(patientMaximumAge);
    patientHome.selectPatientLastAdmittedBed(patientLastAdmittedBed);
    patientHome.selectPatientLastConsentType(PatientLastConsentType);
    patientHome.selectPatientTelemedicineFilter(patientTelemedicinePerference);
    patientHome.selectPatientReviewFilter(patientReviewStatus);
    patientHome.selectPatientMedicoFilter(patientMedicoStatus);
    patientHome.clickPatientFilterApply();
    cy.get("a[data-cy='patient']").should("contain.text", "Dummy Patient");
    patientHome.verifyTotalPatientCount("1");
    // Verify the presence of badges
    patientHome.verifyGenderBadgeContent(patientGender);
    patientHome.verifyCategoryBadgeContent(patientCategory);
    patientHome.verifyMinAgeBadgeContent(patientMinimumAge);
    patientHome.verifyMaxAgeBadgeContent(patientMaximumAge);
    patientHome.verifyLastAdmittedBedBadgeContent(patientLastAdmittedBed);
    patientHome.verifyLastConsentTypeBadgeContent(PatientLastConsentType);
    patientHome.verifyTelemedicineBadgeContent(patientTelemedicinePerference);
    patientHome.verifyReviewMissedBadgeContent(patientReviewStatus);
    patientHome.verifyMedicoBadgeContent(patientMedicoStatus);
    // Clear the badges and verify the patient count along with badges
    cy.clearAllFilters();
    patientHome.verifyTotalPatientCount("18");
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
