import { patientSearch } from "../../pageObject/Patients/PatientSearch";

describe("Patient Search", () => {
  const TEST_PHONE = "9495031234";
  const PATIENT_DETAILS = {
    name: "Nihal",
    sex: "Male",
    phone: TEST_PHONE,
  };

  beforeEach(() => {
    cy.visit("/login");
    cy.loginByApi("staff");
  });

  it("search patient with phone number and verifies details", () => {
    patientSearch
      .selectFacility("Arike")
      .clickSearchPatients()
      .searchPatient(TEST_PHONE)
      .verifySearchResults(PATIENT_DETAILS);
  });
});
