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

  const locationTestCases = [
    {
      description: "without any location data",
      geoData: {},
    },
  ];

  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("superadmin");
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

      facilityCreation.navigateToGovernance("Government");

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
