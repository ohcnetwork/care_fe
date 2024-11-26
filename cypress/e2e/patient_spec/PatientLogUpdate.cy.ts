import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientInvestigation from "../../pageobject/Patient/PatientInvestigation";
import PatientLogupdate from "../../pageobject/Patient/PatientLogupdate";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";

describe("Patient Log Update in Normal, Critical and TeleIcu", () => {
  const loginPage = new LoginPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientPage = new PatientPage();
  const patientLogupdate = new PatientLogupdate();
  const patientInvestigation = new PatientInvestigation();
  const patientPrescription = new PatientPrescription();
  const patientCategory = "Moderate";
  const additionalSymptoms = "Fever";
  const physicalExamination = "physical examination details";
  const otherExamination = "Other";
  const patientSystolic = "149";
  const patientDiastolic = "119";
  const patientModifiedSystolic = "145";
  const patientModifiedDiastolic = "120";
  const patientPulse = "152";
  const patientTemperature = "96.6";
  const patientRespiratory = "140";
  const patientSpo2 = "15";
  const patientRhythmType = "Regular";
  const patientRhythm = "Normal Rhythm";
  const patientEtco2 = "50";
  const patientOxygenFlowRate = "40";
  const patientBloodSugar = "52";
  const patientInsulinDosage = "56";
  const patientFluidBalance = "500";
  const patientNetBalance = "1000";
  const patientOne = "Dummy Patient Nine";
  const bedOne = "Dummy Bed 5";
  const patientTwo = "Dummy Patient Ten";
  const bedTwo = "Dummy Bed 2";
  const patientThree = "Dummy Patient Eight";
  const bedThree = "Dummy Bed 3";
  const domicilaryPatient = "Dummy Patient Eleven";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Create a new TeleIcu log update for a domicilary care patient", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.clickSubmitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.selectRoundType("Tele-medicine Log");
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientLogupdate.selectSymptomsDate("01012024");
    patientLogupdate.typeAndMultiSelectSymptoms("fe", ["Fever"]);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-option-RESPONDS_TO_PAIN").click();
    cy.clickSubmitButton("Save");
    cy.verifyNotification("Tele-medicine Log created successfully");
  });

  it("Create a new Progress log update for a admitted patient and edit it", () => {
    patientPage.visitPatient(patientOne);
    patientLogupdate.clickLogupdate();
    cy.verifyNotification("Please assign a bed to the patient");
    patientLogupdate.selectBed(bedOne);
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    // Only will be using random non-unique progress note fields
    patientLogupdate.selectRoundType("Progress Note");
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.selectSymptomsDate("01012024");
    patientLogupdate.typeAndMultiSelectSymptoms("fe", ["Fever"]);
    patientLogupdate.typeTemperature(patientTemperature);
    // add diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      "1A06",
      "add-icd11-diagnosis-as-differential",
    );
    // add a investigation for the patient
    patientInvestigation.clickAddInvestigation();
    patientInvestigation.selectInvestigation("Vitals (GROUP)");
    patientInvestigation.clickInvestigationCheckbox();
    patientInvestigation.selectInvestigationFrequency("6");
    // add a medicine for the patient
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine("DOLO");
    patientPrescription.enterDosage("4");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.clickSubmitButton("Submit");
    cy.verifyNotification("Medicine prescribed");
    cy.closeNotification();
    // Submit the doctors log update
    cy.clickSubmitButton("Save and Continue");
    cy.wait(2000);
    cy.verifyNotification("Progress Note created successfully");
    cy.closeNotification();
    // modify the relevant critical care log update
    patientLogupdate.selectCriticalCareSection("Neurological Monitoring");
    cy.get("#consciousness_level-option-RESPONDS_TO_PAIN").click();
    cy.get("#left_pupil_light_reaction-option-FIXED").click();
    cy.clickSubmitButton("Update Details");
    cy.verifyNotification(
      "Neurological Monitoring details succesfully updated.",
    );
    cy.closeNotification();
    // Final Submission of the form
    cy.clickSubmitButton("Complete");
    cy.verifyNotification("Progress Note Log Update filed successfully");
    cy.closeNotification();
    // Verify the data reflection
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateViewDetails(
      "#logupdate-entry",
      patientCategory,
    );
    cy.verifyContentPresence("#consultation-preview", [
      patientCategory,
      patientTemperature,
    ]);
    // verify the edit functionality
    patientLogupdate.clickUpdateDetail();
    patientLogupdate.typeSystolic(patientModifiedSystolic);
    patientLogupdate.typeDiastolic(patientModifiedDiastolic);
    cy.clickSubmitButton("Continue");
    cy.verifyNotification("Progress Note updated successfully");
  });

  it("Create a basic critical care log update for a admitted patient and edit it", () => {
    patientPage.visitPatient(patientTwo);
    patientLogupdate.clickLogupdate();
    cy.verifyNotification("Please assign a bed to the patient");
    patientLogupdate.selectBed(bedTwo);
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.selectRoundType("Detailed Update");
    patientLogupdate.selectPatientCategory(patientCategory);
    cy.clickSubmitButton("Save and Continue");
    cy.verifyNotification("Detailed Update created successfully");
    cy.closeNotification();
    // Select two Section - First One is Respiratory Support
    patientLogupdate.selectCriticalCareSection("Respiratory Support");
    patientLogupdate.selectNoBilateralAirFlow();
    patientLogupdate.typeEtco2(patientEtco2);
    patientLogupdate.selectOxygenSupport();
    patientLogupdate.typeOxygenFlowRate(patientOxygenFlowRate);
    patientLogupdate.typeVentilatorSpo2(patientSpo2);
    cy.clickSubmitButton("Update Details");
    cy.verifyNotification("Respiratory Support details succesfully updated.");
    cy.closeNotification();
    // Second Section will be Blood Sugar
    patientLogupdate.selectCriticalCareSection("Blood Sugar");
    patientLogupdate.typeBloodSugar(patientBloodSugar);
    patientLogupdate.typeInsulinDosage(patientInsulinDosage);
    cy.get("#insulin_intake_frequency-option-BD").click();
    cy.clickSubmitButton("Update Details");
    cy.verifyNotification("Blood Sugar details succesfully updated.");
    // Submit the form and verify the details
    cy.clickSubmitButton("Complete");
    cy.verifyNotification("Detailed Log Update filed successfully");
    cy.closeNotification();
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateViewDetails(
      "#logupdate-entry",
      patientCategory,
    );
    cy.verifyContentPresence("#respiratory-support", [
      patientEtco2,
      patientOxygenFlowRate,
    ]);
    cy.verifyContentPresence("#blood-sugar", [
      patientBloodSugar,
      patientInsulinDosage,
    ]);
    // Go back and edit the data on a third section
    patientLogupdate.clickGoBackConsultation();
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateUpdateLog(
      "#logupdate-entry",
      patientCategory,
    );
    patientLogupdate.selectCriticalCareSection("Dialysis");
    patientLogupdate.typeFluidBalance(patientFluidBalance);
    patientLogupdate.typeNetBalance(patientNetBalance);
    cy.clickSubmitButton("Update Details");
    cy.verifyNotification("Dialysis details succesfully updated.");
    cy.closeNotification();
    cy.clickSubmitButton("Complete");
    cy.verifyNotification("Detailed Log Update filed successfully");
    cy.closeNotification();
    //Reverify the editted and newly added data
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateViewDetails(
      "#logupdate-entry",
      patientCategory,
    );
    cy.verifyContentPresence("#respiratory-support", [
      patientEtco2,
      patientOxygenFlowRate,
    ]);
    cy.verifyContentPresence("#blood-sugar", [
      patientBloodSugar,
      patientInsulinDosage,
    ]);
    cy.verifyContentPresence("#dialysis", [
      patientFluidBalance,
      patientNetBalance,
    ]);
  });

  it("Create a new Normal update for a admission patient and verify its reflection in cards", () => {
    patientPage.visitPatient(patientThree);
    patientLogupdate.clickLogupdate();
    cy.verifyNotification("Please assign a bed to the patient");
    patientLogupdate.selectBed(bedThree);
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientLogupdate.selectSymptomsDate("01012024");
    patientLogupdate.typeAndMultiSelectSymptoms("fe", ["Fever"]);
    patientLogupdate.clickAddSymptom();
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-option-RESPONDS_TO_PAIN").click();
    cy.clickSubmitButton("Save");
    cy.wait(2000);
    cy.verifyNotification("Brief Update created successfully");
    // Verify the card content
    cy.get("#basic-information").scrollIntoView();
    cy.verifyContentPresence("#encounter-symptoms", [additionalSymptoms]);
  });

  it("Create a new Normal Log update for a domicilary care patient and edit it", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.clickSubmitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    patientLogupdate.typePhysicalExamination(physicalExamination);
    patientLogupdate.typeOtherDetails(otherExamination);
    patientLogupdate.selectSymptomsDate("01012024");
    patientLogupdate.typeAndMultiSelectSymptoms("fe", ["Fever"]);
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    patientLogupdate.typeSpo2(patientSpo2);
    patientLogupdate.selectRhythm(patientRhythmType);
    patientLogupdate.typeRhythm(patientRhythm);
    cy.get("#consciousness_level-option-RESPONDS_TO_PAIN").click();
    cy.clickSubmitButton("Save");
    cy.verifyNotification("Brief Update created successfully");
    cy.closeNotification();
    // edit the card and verify the data.
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateViewDetails(
      "#logupdate-entry",
      patientCategory,
    );
    cy.verifyContentPresence("#consultation-preview", [
      patientCategory,
      patientDiastolic,
      patientSystolic,
      physicalExamination,
      otherExamination,
      patientPulse,
      patientTemperature,
      patientRespiratory,
      patientSpo2,
      patientRhythm,
    ]);
    patientLogupdate.clickUpdateDetail();
    patientLogupdate.clearIntoElementById("#systolic");
    patientLogupdate.typeSystolic(patientModifiedSystolic);
    patientLogupdate.clearIntoElementById("#diastolic");
    patientLogupdate.typeDiastolic(patientModifiedDiastolic);
    cy.clickSubmitButton("Continue");
    cy.verifyNotification("Brief Update updated successfully");
    cy.contains("button", "Log Updates").click();
    patientLogupdate.clickLogUpdateViewDetails(
      "#logupdate-entry",
      patientCategory,
    );
    cy.verifyContentPresence("#consultation-preview", [
      patientModifiedDiastolic,
      patientModifiedSystolic,
    ]);
  });

  it("Create a Normal Log update to verify MEWS Score Functionality", () => {
    patientPage.visitPatient(domicilaryPatient);
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    cy.clickSubmitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.closeNotification();
    patientLogupdate.clickLogupdate();
    // Verify the MEWS Score reflection
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    patientLogupdate.typeTemperature(patientTemperature);
    patientLogupdate.typeRespiratory(patientRespiratory);
    cy.get("#consciousness_level-option-RESPONDS_TO_PAIN").click();
    cy.clickSubmitButton("Save");
    cy.verifyNotification("Brief Update created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["9"]);
    // Verify the Incomplete data will give blank info
    patientLogupdate.clickLogupdate();
    patientLogupdate.selectPatientCategory(patientCategory);
    patientLogupdate.typeSystolic(patientSystolic);
    patientLogupdate.typeDiastolic(patientDiastolic);
    patientLogupdate.typePulse(patientPulse);
    cy.clickSubmitButton("Save");
    cy.verifyNotification("Brief Update created successfully");
    cy.closeNotification();
    cy.verifyContentPresence("#consultation-buttons", ["-"]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
