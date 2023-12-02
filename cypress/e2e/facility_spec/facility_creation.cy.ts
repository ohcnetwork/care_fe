// FacilityCreation
import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";

describe("Facility Creation", () => {
  let facilityUrl1: string;
  let facilityUrl2: string;
  let facilityUrl3: string;
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const manageUserPage = new ManageUserPage();
  const facilityFeature = [
    "CT Scan",
    "X-Ray",
    "Maternity Care",
    "Neonatal Care",
    "Operation Theater",
    "Blood Bank",
  ];
  const bedCapacity = "10";
  const bedOccupancy = "5";
  const oxygenCapacity = "100";
  const oxygenExpected = "80";
  const totalCapacity = "200";
  const totalOccupancy = "160";
  const doctorCapacity = "5";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Create a new facility with multiple bed and doctor capacity", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName("cypress facility with multiple bed");
    facilityPage.clickfacilityfeatureoption();
    facilityFeature.forEach((featureText) => {
      cy.get("[role='option']").contains(featureText).click();
    });
    facilityPage.fillPincode("682001");
    facilityPage.selectState("Kerala");
    facilityPage.selectDistrict("Ernakulam");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress("cypress address");
    facilityPage.fillPhoneNumber("9898469865");
    facilityPage.fillOxygenCapacity(oxygenCapacity);
    facilityPage.fillExpectedOxygenRequirement(oxygenExpected);
    facilityPage.fillBTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedBTypeCylinderRequirement(oxygenExpected);
    facilityPage.fillCTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedCTypeCylinderRequirement(oxygenExpected);
    facilityPage.fillDTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedDTypeCylinderRequirement(oxygenExpected);
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    // create multiple bed capacity and verify card reflection
    facilityPage.selectBedType("Oxygen beds");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    facilityPage.selectBedType("Ordinary Bed");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    cy.get("#total-bed-capacity").contains(totalCapacity);
    cy.get("#total-bed-capacity").contains(totalOccupancy);
    facilityPage.clickcancelbutton();
    // create multiple bed capacity and verify card reflection
    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    facilityPage.selectAreaOfSpecialization("Pulmonology");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    cy.get("#total-doctor-capacity").contains(doctorCapacity);
    facilityPage.clickcancelbutton();
    facilityPage.verifyfacilitynewurl();
    cy.url().then((newUrl) => {
      facilityUrl3 = newUrl;
    });
    // verify the facility card
    cy.get("#facility-name").contains("cypress").should("be.visible");
    cy.get("#address-details-view").contains("cypress").should("be.visible");
    cy.get("#phone-number-view").contains("9898469865").should("be.visible");
    cy.get("#facility-available-features")
      .invoke("text")
      .then((text) => {
        facilityFeature.forEach((feature) => {
          expect(text).to.contain(feature);
        });
      });
    cy.get("#facility-oxygen-info").scrollIntoView();
    cy.get("#facility-oxygen-info").contains("100").should("be.visible");
  });

  it("Create a new facility with single bed and doctor capacity", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName("cypress facility with single bed");
    facilityPage.fillPincode("682001");
    facilityPage.selectState("Kerala");
    facilityPage.selectDistrict("Ernakulam");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress("cypress address");
    facilityPage.fillPhoneNumber("9898469865");
    facilityPage.submitForm();
    // add the bed capacity
    facilityPage.selectBedType("Oxygen beds");
    facilityPage.fillTotalCapacity("10");
    facilityPage.fillCurrentlyOccupied("5");
    facilityPage.saveAndExitBedCapacityForm();
    // add the doctor capacity
    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount("5");
    facilityPage.saveAndExitDoctorForm();
    facilityPage.verifyfacilitynewurl();
    cy.url().then((newUrl) => {
      facilityUrl1 = newUrl;
    });
    // verify the created facility details
    cy.get("#facility-name").contains("cypress").should("be.visible");
    cy.get("#address-details-view").contains("cypress").should("be.visible");
    cy.get("#phone-number-view").contains("9898469865").should("be.visible");
  });

  it("Create a new facility with no bed and doctor capacity", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName("cypress facility with no bed");
    facilityPage.fillPincode("682001");
    facilityPage.selectState("Kerala");
    facilityPage.selectDistrict("Ernakulam");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress("cypress Address");
    facilityPage.fillPhoneNumber("9898469865");
    facilityPage.submitForm();
    // add no bed capacity
    facilityPage.isVisibleselectBedType();
    cy.get("#cancel").click();
    // add no doctor capacity
    facilityPage.isVisibleAreaOfSpecialization();
    cy.get("#cancel").click();
    cy.url().then((newUrl) => {
      facilityUrl2 = newUrl;
    });
    // verify the created facility details
    cy.get("#facility-name").contains("cypress").should("be.visible");
    cy.get("#address-details-view").contains("cypress").should("be.visible");
    cy.get("#phone-number-view").contains("9898469865").should("be.visible");
    // verify the facility homepage
    cy.visit("/facility");
    manageUserPage.typeFacilitySearch("cypress");
    facilityPage.verifyFacilityBadgeContent("cypress");
    manageUserPage.assertFacilityInCard("cypress");
    facilityHome.verifyURLContains("cypress");
  });

  it("Update the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.clickUpdateFacilityType("Request Approving Center");
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    cy.url().should("not.include", "/update");

    //
    facilityPage.visitUpdateFacilityPage(facilityUrl2);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.clickUpdateFacilityType("Request Approving Center");
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    cy.url().should("not.include", "/update");

    //

    facilityPage.visitUpdateFacilityPage(facilityUrl3);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.clickUpdateFacilityType("Request Approving Center");
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    cy.url().should("not.include", "/update");
  });

  it("Configure the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickConfigureFacilityOption();
    facilityPage.fillMiddleWareAddress("dev_middleware.coronasafe.live");
    facilityPage.clickupdateMiddleWare();
    facilityPage.verifySuccessNotification("Facility updated successfully");
  });

  it("Delete a facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickDeleteFacilityOption();
    facilityPage.confirmDeleteFacility();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
