// FacilityCreation
import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";

describe("Facility Creation", () => {
  let facilityUrl: string;
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
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
    facilityPage.verifyfacilitynewurl();
    cy.url().then((newUrl) => {
      facilityUrl = newUrl;
    });
  });

  it("Update the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.clickUpdateFacilityType();
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();

    cy.url().should("not.include", "/update");
  });

  it("Configure the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickConfigureFacilityOption();
    facilityPage.fillMiddleWareAddress("dev_middleware.coronasafe.live");
    facilityPage.clickupdateMiddleWare();
    facilityPage.verifySuccessNotification("Facility updated successfully");
  });

  it("Delete a facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickDeleteFacilityOption();
    facilityPage.confirmDeleteFacility();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
