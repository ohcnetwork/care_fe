import PatientPrescription from "../../pageobject/Patient/PatientPrescription";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

const patientPrescription = new PatientPrescription();
const loginPage = new LoginPage();
const patientPage = new PatientPage();
const medicineName = "DOLO";
const medicineBaseDosage = "4";
const medicineTargetDosage = "9";
const medicineFrequency = "Twice daily";
const medicineAdministerNote = "Medicine Administration Note";

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

  it("Add a new titrated medicine for a patient | Individual Administeration |", () => {
    patientPage.visitPatient("Dummy Patient 5");
    patientPrescription.visitMedicineTab();
    patientPrescription.visitEditPrescription();
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineName);
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
      medicineName,
      medicineBaseDosage,
      medicineTargetDosage,
    ]);
    patientPrescription.clickReturnToDashboard();
    // Go to medicine tab and administer it again
    patientPrescription.visitMedicineTab();
    cy.verifyAndClickElement("#0", medicineName);
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
    patientPrescription.selectMedicine(medicineName);
    patientPrescription.enterDosage(medicineBaseDosage);
    patientPrescription.selectDosageFrequency(medicineFrequency);
    cy.submitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // verify the duplicate medicine error message
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineName);
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
