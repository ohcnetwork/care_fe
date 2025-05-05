import { UserCreation } from "@/pageObject/Users/UserCreation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  generateEmailDomain,
  generateName,
  generatePhoneNumber,
  generateUsername,
} from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

describe("User Creation", () => {
  const facilityCreation = new FacilityCreation();
  const userCreation = new UserCreation();
  const userRole = "Doctor";
  const defaultPassword = "Test@123";

  // Define location constants to avoid duplication
  const LOCATIONS = {
    DISTRICT: "Ernakulam",
    LOCAL_BODY: "Aluva",
    WARD: "4",
  };

  const locationTestCases = [
    {
      description: "without any location data",
      geoData: {},
    },
    {
      description: "with district only",
      geoData: {
        district: LOCATIONS.DISTRICT,
      },
    },
    {
      description: "with district and local body",
      geoData: {
        district: LOCATIONS.DISTRICT,
        localBody: LOCATIONS.LOCAL_BODY,
      },
    },
    {
      description: "with district, local body and ward",
      geoData: {
        district: LOCATIONS.DISTRICT,
        localBody: LOCATIONS.LOCAL_BODY,
        ward: LOCATIONS.WARD,
      },
    },
  ];

  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("orgadmin");
    cy.visit("/");
  });

  locationTestCases.forEach(({ description, geoData }) => {
    it(`creates a new user ${description}`, () => {
      // Generate fresh data for each test
      const fullName = generateName();
      const [firstName, lastName] = fullName.split(" ");
      const username = generateUsername(firstName);

      const baseUserData = {
        firstName,
        lastName,
        username,
        password: defaultPassword,
        confirmPassword: defaultPassword,
        email: `${username}@${generateEmailDomain()}`,
        phoneNumber: generatePhoneNumber(),
        userType: "Doctor",
        gender: "Male",
      };

      facilityCreation.navigateToGovernance("Kerala");

      userCreation
        .navigateToUsersTab()
        .clickAddUserButton()
        .fillEmail(baseUserData.email)
        .submitUserForm()
        .verifyValidationErrors()
        .fillUserDetails({ ...baseUserData, ...geoData })
        .interceptUserCreationRequest()
        .submitUserForm()
        .verifyUserCreationApiCall()
        .selectUserRole(userRole)
        .interceptOrganizationUserLinking()
        .clickLinkToOrganization()
        .verifyOrganizationUserLinkingApiCall();
    });
  });
});
