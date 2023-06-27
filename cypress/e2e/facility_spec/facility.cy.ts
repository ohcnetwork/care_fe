// FacilityCreation
import FacilityPage from "../../pageobject/Facility/FacilityCreation";

describe("Facility Creation", () => {
  let facilityUrl: string;
  const facilityPage = new FacilityPage();

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Create a new facility", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName("cypress facility");
    facilityPage.fillPincode("682001");
    facilityPage.selectState("Kerala");
    facilityPage.selectDistrict("Ernakulam");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress("Cypress Address");
    facilityPage.fillPhoneNumber("9898469865");
    facilityPage.submitForm();

    facilityPage.selectBedType("Non-Covid Oxygen beds");
    facilityPage.fillTotalCapacity("10");
    facilityPage.fillCurrentlyOccupied("5");
    facilityPage.saveAndExitBedCapacityForm();

    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount("5");
    facilityPage.saveAndExitDoctorForm();

    cy.url().then((initialUrl) => {
      cy.get("button#save-and-exit").should("not.exist");
      cy.url()
        .should("not.equal", initialUrl)
        .then((newUrl) => {
          facilityUrl = newUrl;
        });
    });
  });

  it("Update the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();

    cy.url().should("not.include", "/update");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
