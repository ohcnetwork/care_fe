import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";

const patientPrescription = new PatientPrescription();
const loginPage = new LoginPage();
const patientPage = new PatientPage();
const medicineNameOne = "AGCON";
const medicineNameTwo = "FDEP PLUS";
const medicineBaseDosage = "4";
const medicineTargetDosage = "9";
const medicineFrequency = "Twice daily";
const medicineAdministerNote = "Medicine Administration Note";
const medicineIndicator = "Test Indicator";

describe("Patient Medicine Administration", () => {
  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Add a new medicine | Verify the Edit and Discontinue Medicine workflow |", () => {
    patientPage.visitPatient("Dummy Patient 9");
    patientPrescription.visitMedicineTab();
    patientPrescription.visitEditPrescription();
    // Add a normal Medicine to the patient
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineNameOne);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.selectDosageFrequency(medicineFrequency);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // Edit the existing medicine & Verify they are properly moved to discontinue position
    patientPrescription.clickReturnToDashboard();
    patientPrescription.visitMedicineTab();
    cy.verifyAndClickElement("#0", medicineNameOne);
    cy.verifyContentPresence("#submit", ["Discontinue"]); // To verify the pop-up is open
    cy.submitButton("Edit");
    patientPrescription.enterDosage(medicineTargetDosage);
    cy.submitButton("Submit");
    cy.verifyNotification("Prescription edited successfully");
    cy.closeNotification();
    // Discontinue a medicine & Verify the notification
    cy.verifyAndClickElement("#0", medicineNameOne);
    cy.submitButton("Discontinue");
    patientPrescription.enterDiscontinueReason("Medicine is been discontinued");
    cy.submitButton("Confirm Discontinue");
    cy.verifyNotification("Prescription discontinued");
    cy.closeNotification();
    // verify the discontinue medicine view
    cy.verifyContentPresence("#discontinued-medicine", [
      "discontinued prescription(s)",
    ]);
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
    cy.wait(2000);
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
