import PatientPrescription from "../../pageobject/Patient/PatientPrescription";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

const patientPrescription = new PatientPrescription();
const loginPage = new LoginPage();
const patientPage = new PatientPage();

describe("Patient Medicine Administration", () => {
  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Add a new medicine for a patient and verify the duplicate medicine validation", () => {
    patientPage.visitPatient("Dummy Patient 4");
    patientPrescription.visitMedicineTab();
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine("DOLO");
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // verify the duplicate medicine error message
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine("DOLO");
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.verifyNotification(
      "Medicine - This medicine is already prescribed to this patient. Please discontinue the existing prescription to prescribe again."
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
