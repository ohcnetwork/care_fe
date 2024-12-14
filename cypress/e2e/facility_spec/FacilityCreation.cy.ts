import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

import FacilityPage, {
  FacilityData,
} from "../../pageobject/Facility/FacilityCreation";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import LoginPage from "../../pageobject/Login/LoginPage";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { nonAdminRoles } from "../../pageobject/utils/userConfig";

describe("Facility Creation", () => {
  let facilityUrl1: string;
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
  const totalCapacity = "20";
  const totalOccupancy = "10";
  const doctorCapacity = "5";
  const totalDoctor = "10";
  const facilityName = "Cypress Facility";
  const facilityName2 = "Dummy Facility 40";
  const facilityAddress = "cypress address";
  const facilityUpdateAddress = "cypress updated address";
  const facilityNumber = "9898469865";
  const triageDate = "02122023";
  const initialTriageValue = "60";
  const modifiedTriageValue = "50";
  const facilityErrorMessage = [
    "Required",
    "Required",
    "Invalid Pincode",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Invalid Phone Number",
  ];
  const bedErrorMessage = [
    "This field is required",
    "Total capacity cannot be 0",
    "This field is required",
  ];
  const doctorErrorMessage = [
    "This field is required",
    "This field is required",
  ];
  const triageErrorMessage = ["This field is required"];
  const facilityType = "Primary Health Centres";
  const testFacilityData: FacilityData = {
    basic: {
      name: facilityName,
      type: facilityType,
      features: facilityFeature,
      address: facilityAddress,
      phoneNumber: facilityNumber,
      location: "Kochi, Kerala",
    },
    location: {
      pincode: "682001",
      state: "Kerala",
      district: "Ernakulam",
      localBody: "Aluva",
      ward: "4",
    },
    oxygen: {
      capacity: oxygenCapacity,
      expected: oxygenExpected,
      bType: {
        capacity: oxygenCapacity,
        expected: oxygenExpected,
      },
      cType: {
        capacity: oxygenCapacity,
        expected: oxygenExpected,
      },
      dType: {
        capacity: oxygenCapacity,
        expected: oxygenExpected,
      },
    },
    beds: [
      {
        type: "Oxygen Supported Bed",
        totalCapacity: bedCapacity,
        occupied: bedOccupancy,
      },
      {
        type: "Ordinary Bed",
        totalCapacity: bedCapacity,
        occupied: bedOccupancy,
      },
    ],
    doctors: [
      {
        specialization: "General Medicine",
        count: doctorCapacity,
      },
      {
        specialization: "Pulmonology",
        count: doctorCapacity,
      },
    ],
  };

  before(() => {
    loginPage.loginByRole("districtAdmin");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Verify Facility Triage Function", () => {
    // mandatory field error throw
    facilityHome.typeFacilitySearch(facilityName2);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName2,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName2);
    facilityHome.verifyURLContains(facilityName2);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.scrollToFacilityTriage();
    facilityPage.clickAddFacilityTriage();
    manageUserPage.clickSubmit();
    cy.verifyErrorMessages(triageErrorMessage);
    // create a entry and verify reflection
    facilityPage.fillEntryDate(triageDate);
    facilityPage.fillTriageEntryFields(
      initialTriageValue,
      initialTriageValue,
      initialTriageValue,
      initialTriageValue,
      initialTriageValue,
    );
    manageUserPage.clickSubmit();
    // edit the entry and verify reflection
    facilityPage.scrollToFacilityTriage();
    facilityPage.verifyTriageTableContains(initialTriageValue);
    facilityPage.clickEditButton();
    facilityPage.fillTriageEntryFields(
      modifiedTriageValue,
      modifiedTriageValue,
      modifiedTriageValue,
      modifiedTriageValue,
      modifiedTriageValue,
    );
    manageUserPage.clickSubmit();
    facilityPage.scrollToFacilityTriage();
    facilityPage.verifyTriageTableContains(modifiedTriageValue);
    // validate error of filling data on same date already data exist and verify reflection
    facilityPage.scrollToFacilityTriage();
    facilityPage.clickAddFacilityTriage();
    facilityPage.fillEntryDate(triageDate);
    facilityPage.clickButtonsMultipleTimes("button#submit");
  });

  it("Create a new facility with multiple bed and doctor capacity", () => {
    // create facility with multiple capacity and verify form error message for facility form
    facilityPage.visitCreateFacilityPage();
    facilityPage.submitForm();
    cy.verifyErrorMessages(facilityErrorMessage);
    facilityPage.fillBasicDetails(testFacilityData.basic);
    facilityPage.fillLocationDetails(testFacilityData.location);
    facilityPage.fillOxygenDetails(testFacilityData.oxygen);
    facilityPage.submitForm();
    cy.closeNotification();
    // add the bed capacity
    facilityPage.selectBedType("Oxygen Supported Bed");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    cy.closeNotification();
    facilityPage.selectBedType("Ordinary Bed");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    cy.closeNotification();
    facilityPage.getTotalBedCapacity().contains(totalCapacity);
    facilityPage.getTotalBedCapacity().contains(totalOccupancy);
    facilityPage.clickcancelbutton();
    // create multiple bed capacity and verify card reflection
    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    cy.closeNotification();
    facilityPage.selectAreaOfSpecialization("Pulmonology");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    cy.closeNotification();
    facilityPage.getTotalDoctorCapacity().contains(doctorCapacity);
    facilityPage.clickcancelbutton();
    facilityPage.verifyfacilitynewurl();
    // verify the facility card
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
    facilityPage
      .getFacilityAvailableFeatures()
      .invoke("text")
      .then((text) => {
        facilityFeature.forEach((feature) => {
          expect(text).to.contain(feature);
        });
      });
    facilityPage.getFacilityOxygenInfo().scrollIntoView();
    facilityPage
      .getFacilityOxygenInfo()
      .contains(oxygenCapacity)
      .should("be.visible");
    facilityPage.getFacilityTotalBedCapacity().scrollIntoView();
    facilityPage.getFacilityTotalBedCapacity().contains(totalCapacity);
    facilityPage.getFacilityTotalBedCapacity().contains(totalOccupancy);
    facilityPage.getFacilityTotalDoctorCapacity().scrollIntoView();
    facilityPage.getFacilityTotalDoctorCapacity().contains(totalDoctor);
    // verify the delete functionality
    cy.get("#manage-facility-dropdown button").scrollIntoView();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickDeleteFacilityOption();
    facilityPage.confirmDeleteFacility();
    cy.verifyNotification("Facility deleted successfully");
  });

  it("Create a new facility with single bed and doctor capacity", () => {
    const singleCapacityData = {
      ...testFacilityData,
      // Remove features, location, and oxygen that aren't used in this test
      basic: {
        ...testFacilityData.basic,
        features: undefined,
        location: undefined,
      },
      oxygen: undefined,
      // Override with single bed capacity
      beds: [
        {
          type: "Oxygen Supported Bed",
          totalCapacity: oxygenCapacity,
          occupied: oxygenExpected,
        },
      ],
      // Override with single doctor capacity
      doctors: [
        {
          specialization: "General Medicine",
          count: doctorCapacity,
        },
      ],
    };
    facilityPage.createNewFacility(singleCapacityData);
    // verify the created facility details
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
    // verify the facility homepage
    facilityHome.navigateToFacilityHomepage();
    facilityHome.typeFacilitySearch(facilityName);
    advanceFilters.verifyFilterBadgePresence(
      "Facility/District Name",
      facilityName,
      true,
    );
    facilityHome.assertFacilityInCard(facilityName);
    facilityHome.verifyURLContains(facilityName);
  });

  it("Create a new facility with no bed and doctor capacity", () => {
    const noCapacityData = {
      ...testFacilityData,
      basic: {
        ...testFacilityData.basic,
        features: undefined,
        location: undefined,
      },
      oxygen: undefined,
      beds: [],
      doctors: [],
    };
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillBasicDetails(noCapacityData.basic);
    facilityPage.fillLocationDetails(noCapacityData.location);
    facilityPage.submitForm();
    // add no bed capacity and verify form error message
    facilityPage.isVisibleselectBedType();
    facilityPage.saveAndExitBedCapacityForm();
    cy.verifyErrorMessages(bedErrorMessage);
    facilityPage.clickcancelbutton();
    // add no doctor capacity and verify form error message
    facilityPage.isVisibleAreaOfSpecialization();
    facilityPage.clickdoctorcapacityaddmore();
    cy.verifyErrorMessages(doctorErrorMessage);
    facilityPage.clickcancelbutton();
    cy.url().then((newUrl) => {
      facilityUrl1 = newUrl;
    });
    // verify the created facility details
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
  });

  it("Update the existing facility", () => {
    // update a existing dummy data facility
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.selectFacilityType(facilityType);
    facilityPage.fillAddress(facilityUpdateAddress);
    facilityPage.fillOxygenCapacity(oxygenCapacity);
    facilityPage.fillExpectedOxygenRequirement(oxygenExpected);
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    cy.url().should("not.include", "/update");
    // verify the updated data
    facilityPage.getFacilityOxygenInfo().scrollIntoView();
    facilityPage
      .getFacilityOxygenInfo()
      .contains(oxygenCapacity)
      .should("be.visible");
    facilityPage.getAddressDetailsView().scrollIntoView();
    facilityPage
      .getAddressDetailsView()
      .contains(facilityUpdateAddress)
      .should("be.visible");
  });

  it("Configure the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickConfigureFacilityOption();
    facilityPage.fillMiddleWareAddress("dev_middleware.coronasafe.live");
    facilityPage.clickupdateMiddleWare();
    facilityPage.verifySuccessNotification(
      "Facility middleware updated successfully",
    );
  });

  it("Should display error when district admin tries to create facility in a different district", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName(facilityName);
    facilityPage.selectFacilityType(facilityType);
    facilityPage.fillPincode("682001");
    facilityPage.selectStateOnPincode("Kerala");
    facilityPage.selectDistrictOnPincode("Kottayam");
    facilityPage.selectLocalBody("Arpookara");
    facilityPage.selectWard("5");
    facilityPage.fillAddress(facilityAddress);
    facilityPage.fillPhoneNumber(facilityNumber);
    facilityPage.submitForm();
    facilityPage.verifyErrorNotification(
      "You do not have permission to perform this action.",
    );
  });

  it("Access Restriction for Non-Admin Users to facility creation page", () => {
    nonAdminRoles.forEach((role) => {
      loginPage.loginByRole(role);
      cy.visit("/facility/create");
      facilityPage.verifyErrorNotification(
        "You don't have permission to perform this action. Contact the admin",
      );
      cy.clearCookies();
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
