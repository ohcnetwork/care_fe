import { LoginPage } from "pageObject/auth/LoginPage";

import { patientSearch } from "../../pageObject/Patients/PatientSearch";

describe("Patient Search", () => {
  const loginPage = new LoginPage();
  const TEST_PHONE = "9495031234";
  const PATIENT_DETAILS = {
    name: "Nihal",
    sex: "Male",
    phone: TEST_PHONE,
  };

  beforeEach(() => {
    loginPage.loginByRole("nurse");
  });

  it("search patient with phone number and verifies details", () => {
    patientSearch
      .selectFacility("PHC Kakkanad -1")
      .clickSearchPatients()
      .searchPatient(TEST_PHONE)
      .verifySearchResults(PATIENT_DETAILS);
  });
});
