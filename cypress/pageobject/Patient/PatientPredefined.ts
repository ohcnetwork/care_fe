// PatientPredefined.js
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientMedicalHistory from "../../pageobject/Patient/PatientMedicalHistory";
import {
  generateEmergencyPhoneNumber,
  generatePhoneNumber,
} from "../utils/constants";

class PatientPredefined {
  createPatient() {
    const patientPage = new PatientPage();
    const facilityPage = new FacilityPage();
    const patientMedicalHistory = new PatientMedicalHistory();
    const phone_number = generatePhoneNumber();
    const emergency_phone_number = generateEmergencyPhoneNumber();
    patientPage.typePatientPhoneNumber(phone_number);
    patientPage.typePatientEmergencyNumber(emergency_phone_number);
    patientPage.typePatientDateOfBirth("01012001");
    patientPage.typePatientName("Patient With Predefined Data");
    patientPage.selectPatientGender("Male");
    patientPage.typePatientAddress("Test Patient Address");
    facilityPage.fillPincode("682001");
    facilityPage.selectStateOnPincode("Kerala");
    facilityPage.selectDistrictOnPincode("Ernakulam");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    patientMedicalHistory.clickNoneMedicialHistory();
    patientPage.selectPatientBloodGroup("O+");
  }
}

export default PatientPredefined;
