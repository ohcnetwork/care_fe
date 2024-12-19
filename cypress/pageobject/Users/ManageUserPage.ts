export class ManageUserPage {
  assertHomeFacility(expectedText: string) {
    cy.get("#home-facility").should("contain.text", expectedText);
  }

  selectFacilityFromDropdown(facilityName: string) {
    cy.typeAndSelectOption("input[name='facility']", facilityName);
  }

  selectSkillFromDropdown(skill: string) {
    cy.intercept("GET", "/api/v1/skill/*").as("getSkills");
    cy.typeAndSelectOption("input[name='skill']", skill);
    cy.wait("@getSkills").its("response.statusCode").should("eq", 200);
  }

  assertLinkedFacility(facilityName: string) {
    cy.get("#linked-facility-list").should("contain.text", facilityName);
  }

  assertnotLinkedFacility(facilityName: string) {
    cy.get("#linked-facility-list").should("not.contain", facilityName);
  }

  linkedfacilitylistnotvisible() {
    cy.get("#linked-facility-list").should("not.exist");
  }

  assertHomeFacilitylink(facilityName: string) {
    cy.get("#home-facility").should("contain.text", facilityName);
  }

  assertFacilityNotInDropdown(facilityName: string) {
    cy.get("input[name='facility']").click().type(facilityName);
    cy.get("[role='option']").should("not.exist");
  }

  clickLinkedFacilitySettings() {
    cy.get("#linked-facility-settings").click();
  }

  clickSetHomeFacility() {
    cy.get("#set-home-facility").click();
  }

  clickUnlinkFacilityButton() {
    cy.get("#unlink-facility").click();
  }

  clickConfirmUnlinkSkill() {
    cy.get("button[name='confirm-unlink-skill']").click();
  }

  clickLinkFacility() {
    cy.get("#link-facility").click();
  }

  clickSubmit() {
    cy.get("#submit").click();
  }

  verifyErrorText(expectedError: string) {
    cy.get(".error-text").first().scrollIntoView();
    cy.get(".error-text")
      .should("be.visible")
      .then(($elements) => {
        const errorTextArray = Array.from($elements).map(
          (el) => el.textContent,
        );
        expect(errorTextArray).to.include(expectedError);
      });
  }

  clearUserBasicInfo() {
    cy.get("input[name='first_name']").click().clear();
    cy.get("input[name='last_name']").click().clear();
  }

  editUserBasicInfo(
    fName: string,
    lName: string,
    dateOfBirth: string,
    gender: string,
  ) {
    cy.get("input[name='first_name']").click().type(fName);
    cy.get("input[name='last_name']").click().type(lName);
    cy.clickAndTypeDate("#date_of_birth", dateOfBirth);
    cy.get("#gender").click();
    cy.get("[role='option']").contains(gender).click();
  }

  verifyEditUserDetails(
    fName: string,
    lName: string,
    dateOfBirth: string,
    gender: string,
  ) {
    cy.get("#view-first_name").should("contain.text", fName);
    cy.get("#view-last_name").should("contain.text", lName);
    cy.get("#view-date_of_birth").should("contain.text", dateOfBirth);
    cy.get("#view-gender").should("contain.text", gender);
  }

  clearUserContactInfo() {
    cy.get("input[name='email']").click().clear();
    cy.get("input[name='phone_number']").click().clear();
    cy.get("input[name='phone_number_is_whatsapp']").should("be.checked");
  }

  editUserContactInfo(email: string, phoneNumber: string) {
    cy.get("input[name='email']").click().type(email);
    cy.get("input[name='phone_number']").click().type(phoneNumber);
    cy.get("input[name='phone_number_is_whatsapp']").should("be.checked");
  }

  verifyEditUserContactInfo(email: string, phoneNumber: string) {
    cy.get("#view-email").should("contain.text", email);
    cy.get("#view-phone_number").should("contain.text", phoneNumber);
    cy.get("#view-whatsapp_number").should("contain.text", phoneNumber);
  }

  clearDoctorOrNurseProfessionalInfo(yoeAndCouncilRegistration: boolean) {
    cy.get("input[name='qualification']").click().clear();
    if (yoeAndCouncilRegistration) {
      cy.get("input[name='doctor_experience_commenced_on']").click().clear();
      cy.get("input[name='doctor_medical_council_registration']")
        .click()
        .clear();
    }
  }

  clearProfessionalInfo() {
    cy.get("input[name='weekly_working_hours']").scrollIntoView();
    cy.get("input[name='weekly_working_hours']").click().clear();
    cy.get("input[name='video_connect_link']").click().clear();
  }

  editUserProfessionalInfo(
    qualification: string,
    yearsOfExperience?: string,
    medicalCouncilRegistration?: string,
  ) {
    cy.get("input[name='qualification']").click().type(qualification);
    if (yearsOfExperience) {
      cy.get("input[name='doctor_experience_commenced_on']")
        .click()
        .type(yearsOfExperience);
    }
    if (medicalCouncilRegistration) {
      cy.get("input[name='doctor_medical_council_registration']")
        .click()
        .type(medicalCouncilRegistration);
    }
  }

  verifyEditUserProfessionalInfo(
    qualification: string,
    yearsOfExperience?: string,
    medicalCouncilRegistration?: string,
  ) {
    cy.get("#view-qualification").should("contain.text", qualification);
    if (yearsOfExperience) {
      cy.get("#view-years_of_experience").should(
        "contain.text",
        yearsOfExperience,
      );
    }
    if (medicalCouncilRegistration) {
      cy.get("#view-doctor_medical_council_registration").should(
        "contain.text",
        medicalCouncilRegistration,
      );
    }
  }

  verifyPasswordEditButtonNotExist() {
    cy.get("#change-edit-password-button").should("not.exist");
  }

  changePassword(oldPassword: string, newPassword: string) {
    cy.get("input[name='old_password']").click().type(oldPassword);
    cy.get("input[name='new_password_1']").click().type(newPassword);
    cy.get("input[name='new_password_2']").click().type(newPassword);
  }

  typeInWeeklyWorkingHours(hours: string) {
    cy.get("input[name='weekly_working_hours']").scrollIntoView();
    cy.get("input[name='weekly_working_hours']").click().type(hours);
  }

  navigateToProfile() {
    cy.intercept("GET", "**/api/v1/users/**").as("getUsers");
    cy.get("#user-profile-name").click();
    cy.get("#profile-button").click();
    cy.wait("@getUsers").its("response.statusCode").should("eq", 200);
  }

  verifyWorkingHours(expectedHours: string) {
    cy.verifyContentPresence("#view-average_weekly_working_hours", [
      expectedHours,
    ] as string[]);
  }

  verifyProfileWorkingHours(expectedHours: string) {
    cy.verifyContentPresence("#averageworkinghour-profile-details", [
      expectedHours,
    ] as string[]);
  }

  navigateToManageUser() {
    cy.visit("/users");
  }

  clickFacilityPatients() {
    cy.get("#facility-patients").should("be.visible");
    cy.get("#facility-patients").click();
  }

  interceptLinkedSkillTab() {
    cy.intercept("GET", "**/api/v1/users/*/skill").as("getUserSkill");
  }

  verifyLinkedSkillResponse() {
    cy.wait("@getUserSkill").its("response.statusCode").should("eq", 200);
  }

  clickLinkedSkillTab() {
    cy.get("#skills").click();
  }

  clickLinkedFacilitiesTab() {
    cy.get("#facilities").click();
  }

  clickMoreDetailsButton(username: string) {
    cy.intercept("GET", "**/api/v1/users/**").as("getUserDetails");
    cy.get(`#more-details-${username}`).click();
    cy.wait("@getUserDetails");
  }

  verifyMoreDetailsPage(hasPermissions = true) {
    cy.get("#username").should("be.visible");
    cy.get("#role").should("be.visible");
    cy.get("#usermanagement_tab_nav").should("be.visible");
    cy.get("#profile").should("be.visible");
    if (hasPermissions) {
      cy.get("#facilities").should("be.visible");
      cy.get("#skills").should("be.visible");
    }
    cy.get("#view-username").scrollIntoView();
    cy.get("#view-username").should("be.visible");
  }

  verifyChangeAvatarButtonVisible() {
    cy.get("#change-avatar").should("be.visible");
  }

  clickChangeAvatarButton() {
    cy.get("#change-avatar").click();
  }

  clickBasicInfoViewButton() {
    cy.get("#basic-info-view-button").scrollIntoView();
    cy.get("#basic-info-view-button").should("be.visible");
    cy.get("#basic-info-view-button").click();
  }

  clickBasicInfoEditButton() {
    cy.get("#basic-info-edit-button").scrollIntoView();
    cy.get("#basic-info-edit-button").should("be.visible");
    cy.get("#basic-info-edit-button").click();
  }

  clickContactInfoViewButton() {
    cy.get("#contact-info-view-button").scrollIntoView();
    cy.get("#contact-info-view-button").should("be.visible");
    cy.get("#contact-info-view-button").click();
  }

  clickContactInfoEditButton() {
    cy.get("#contact-info-edit-button").scrollIntoView();
    cy.get("#contact-info-edit-button").should("be.visible");
    cy.get("#contact-info-edit-button").click();
  }

  clickProfessionalInfoViewButton() {
    cy.get("#professional-info-view-button").scrollIntoView();
    cy.get("#professional-info-view-button").should("be.visible");
    cy.get("#professional-info-view-button").click();
  }

  clickProfessionalInfoEditButton() {
    cy.get("#professional-info-edit-button").scrollIntoView();
    cy.get("#professional-info-edit-button").should("be.visible");
    cy.get("#professional-info-edit-button").click();
  }

  clickPasswordEditButton() {
    cy.get("#change-edit-password-button").scrollIntoView();
    cy.get("#change-edit-password-button").should("be.visible");
    cy.get("#change-edit-password-button").click();
  }

  verifyQualificationDoesntExist() {
    cy.get("input[name='qualification']").should("not.exist");
  }

  verifyQualificationExist() {
    cy.get("#view-qualification").should("be.visible");
  }

  verifyYoeAndCouncilRegistrationDoesntExist() {
    cy.get("#view-years_of_experience").should("not.exist");
    cy.get("#view-doctor_medical_council_registration").should("not.exist");
  }

  verifyYoeAndCouncilRegistrationExist() {
    cy.get("#view-years_of_experience").should("be.visible");
    cy.get("#view-doctor_medical_council_registration").should("be.visible");
  }

  verifyUsername(username: string) {
    cy.get("#view-username").should("contain", username);
  }

  verifyBasicInfoEditButtonNotExist() {
    cy.get("#basic-info-edit-button").should("not.exist");
  }

  verifyContactInfoEditButtonNotExist() {
    cy.get("#contact-info-edit-button").should("not.exist");
  }

  verifyProfessionalInfoEditButtonNotExist() {
    cy.get("#professional-info-edit-button").should("not.exist");
  }

  verifyProfileTabPage() {
    cy.get("#user-edit-form").should("be.visible");
  }

  verifyDoctorQualification() {
    cy.get("#view-qualification").should("be.visible");
  }

  verifyDoctorQualificationDoesNotExist() {
    cy.get("#view-qualification").should("not.exist");
  }

  verifyLinkedSkillsTabPage() {
    cy.get("#select-skill").scrollIntoView();
    cy.get("#select-skill").should("be.visible");
  }

  verifyLinkedFacilitiesTabPage() {
    cy.get("#select-facility").should("be.visible");
  }

  verifyDeleteButtonNotExist() {
    cy.get("[data-testid='user-delete-button']").should("not.exist");
  }

  verifyDeleteButtonVisible() {
    cy.get("[data-testid='user-delete-button']").scrollIntoView();
    cy.get("[data-testid='user-delete-button']").should("be.visible");
  }

  clickDeleteButton() {
    cy.get("[data-testid='user-delete-button']").click();
  }

  clickAddSkillButton(username: string) {
    cy.intercept("GET", `**/api/v1/users/${username}/skill/**`).as("getSkills");
    cy.get("#add-skill-button").click();
  }

  interceptAddSkill() {
    cy.intercept("GET", "**/api/v1/users/*/skill").as("getUserSkills");
  }

  verifyAddSkillResponse() {
    cy.wait("@getUserSkills").its("response.statusCode").should("eq", 200);
  }
  assertSkillInAlreadyLinkedSkills(skillName: string) {
    cy.get("#already-linked-skills")
      .contains(skillName)
      .should("have.length", 1);
  }

  assertSkillIndoctorconnect(skillName: string) {
    cy.get("#doctor-connect-home-doctor")
      .contains(skillName)
      .should("have.length", 1);
  }

  clickDoctorConnectButton() {
    cy.get("#doctor-connect-patient-button").click();
  }

  clickUnlinkSkill() {
    cy.get("#unlink-skill").click();
  }

  verifyUnlinkSkillModal() {
    cy.get("#unlink-skill-modal-description").should("be.visible");
    cy.get("button[name='confirm-unlink-skill']").should("be.visible");
  }

  assertSkillInAddedUserSkills(skillName: string) {
    cy.get("#added-user-skills").should("contain", skillName);
  }

  assertSkillNotInAddedUserSkills(skillName: string) {
    cy.get("#added-user-skills").should("not.contain", skillName);
  }

  assertDoctorConnectVisibility(realName: string) {
    cy.get('*[id="doctor-connect-home-doctor"]').should(
      "contain.text",
      realName,
    );
    cy.get('*[id="doctor-connect-remote-doctor"]').should(
      "contain.text",
      realName,
    );
  }

  assertVideoConnectLink(docName: string, link: string) {
    cy.get("ul#options")
      .find("li")
      .contains(docName)
      .within(() => {
        cy.get("a").should(($a) => {
          const hrefs = $a.map((i, el) => Cypress.$(el).attr("href")).get();
          expect(hrefs).to.include(link);
        });
      });
  }
}

export default ManageUserPage;
