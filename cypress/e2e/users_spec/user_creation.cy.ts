import { UserCreation } from "@/pageObject/Users/UserCreation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  generateName,
  generatePhoneNumber,
  generateUsername,
} from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

describe("User Creation", () => {
  const facilityCreation = new FacilityCreation();
  const userCreation = new UserCreation();
  const userRole = "Doctor";

  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("orgadmin");
    cy.visit("/");
  });

  it("should create a new user successfully", () => {
    // Generate fresh data at the start of each test attempt
    const fullName = generateName();
    const [firstName, lastName] = fullName.split(" ");
    const defaultPassword = "Test@123";

    const testUserData = {
      firstName,
      lastName,
      username: generateUsername(firstName),
      password: defaultPassword,
      confirmPassword: defaultPassword,
      email: `${generateUsername(firstName)}@test.com`,
      phoneNumber: generatePhoneNumber(),
      userType: "Doctor",
      gender: "Male",
      state: "Kerala",
      district: "Ernakulam",
      localBody: "Aluva",
      ward: "4",
    };

    facilityCreation.navigateToGovernance("Kerala");

    userCreation
      .navigateToUsersTab()
      .clickAddUserButton()
      .fillEmail(testUserData.email)
      .submitUserForm()
      .verifyValidationErrors()
      .fillUserDetails(testUserData)
      .interceptUserCreationRequest()
      .submitUserForm()
      .verifyUserCreationApiCall()
      .selectUserRole(userRole)
      .interceptOrganizationUserLinking()
      .clickLinkToOrganization()
      .verifyOrganizationUserLinkingApiCall();
  });
});
