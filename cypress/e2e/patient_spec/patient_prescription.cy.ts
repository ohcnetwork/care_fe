import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

const patientPrescription = new PatientPrescription();
const loginPage = new LoginPage();
const patientPage = new PatientPage();
const medicineNameOne = "DOLO";
const medicineNameTwo = "FDEP PLUS";
const medicineBaseDosage = "4";
const medicineTargetDosage = "9";
const medicineFrequency = "Twice daily";
const medicineAdministerNote = "Medicine Administration Note";
const medicineIndicator = "Test Indicator";

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

  it("Add a PRN Prescription medicine | Group Administrate it |", () => {
    patientPage.visitPatient("Dummy Patient 6");
    patientPrescription.visitMedicineTab();
    patientPrescription.visitEditPrescription();
    // Add First Medicine
    patientPrescription.clickAddPrnPrescriptionButton();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameOne);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.enterIndicator(medicineIndicator);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // Add Second Medicine
    patientPrescription.clickAddPrnPrescriptionButton();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameTwo);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.enterIndicator(medicineIndicator);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    patientPrescription.clickReturnToDashboard();
    // Group Administer the PRN Medicine
    patientPrescription.visitMedicineTab();
    patientPrescription.clickAdministerBulkMedicine();
    patientPrescription.clickAllVisibleAdministration();
    patientPrescription.clickAdministerSelectedMedicine();
    cy.verifyNotification("Medicine(s) administered");
    cy.closeNotification();
  });

  it("Add a new titrated medicine for a patient | Individual Administeration |", () => {
    patientPage.visitPatient("Dummy Patient 5");
    patientPrescription.visitMedicineTab();
    patientPrescription.visitEditPrescription();
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameOne);
    patientPrescription.clickTitratedDosage();
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.enterTargetDosage(medicineTargetDosage);
    patientPrescription.selectDosageFrequency(medicineFrequency);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // Administer the medicine in edit form
    patientPrescription.clickAdministerButton();
    patientPrescription.enterAdministerDosage(medicineBaseDosage);
    patientPrescription.enterAdministerNotes(medicineAdministerNote);
    cy.submitButton("Administer Medicine");
    cy.verifyNotification("Medicine(s) administered");
    cy.closeNotification();
    // Verify the Reflection on the Medicine
    cy.verifyContentPresence("#medicine-preview", [
      medicineNameOne,
      medicineBaseDosage,
      medicineTargetDosage,
    ]);
    patientPrescription.clickReturnToDashboard();
    // Go to medicine tab and administer it again
    patientPrescription.visitMedicineTab();
    cy.verifyAndClickElement("#0", medicineNameOne);
    cy.submitButton("Administer");
    patientPrescription.enterAdministerDosage(medicineBaseDosage);
    cy.submitButton("Administer Medicine");
    cy.verifyNotification("Medicine(s) administered");
  });

  it("Add a new medicine for a patient and verify the duplicate medicine validation", () => {
    patientPage.visitPatient("Dummy Patient 4");
    patientPrescription.visitMedicineTab();
    patientPrescription.visitEditPrescription();
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameOne);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.selectDosageFrequency(medicineFrequency);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // verify the duplicate medicine error message
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameOne);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.selectDosageFrequency(medicineFrequency);
    cy.submitButton("Submit");
    cy.verifyNotification(
      "Medicine - This medicine is already prescribed to this patient. Please discontinue the existing prescription to prescribe again.",
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
