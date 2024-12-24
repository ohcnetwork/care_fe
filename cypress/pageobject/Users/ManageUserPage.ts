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
    this.editFirstName(fName);
    this.editLastName(lName);
    this.editDateOfBirth(dateOfBirth);
    this.editGender(gender);
  }

  clickUserInfoSubmitButton() {
    cy.clickSubmitButton("Submit");
  }

  userInfoUpdateSuccessNotification() {
    cy.verifyNotification("User details updated successfully");
    cy.closeNotification();
  }

  editFirstName(fName: string, clearBeforeTyping = true) {
    cy.typeIntoField("#first_name", fName, { clearBeforeTyping });
  }

  editLastName(lName: string, clearBeforeTyping = true) {
    cy.typeIntoField("#last_name", lName, { clearBeforeTyping });
  }

  editDateOfBirth(dateOfBirth: string) {
    cy.clickAndTypeDate("#date_of_birth", dateOfBirth);
  }

  editGender(gender: string) {
    cy.clickAndSelectOption("#gender", gender);
  }

  verifyEditUserDetails(
    fName: string,
    lName: string,
    dateOfBirth: string,
    gender: string,
  ) {
    cy.verifyContentPresence("#view-first_name", [fName]);
    cy.verifyContentPresence("#view-last_name", [lName]);
    cy.verifyContentPresence("#view-date_of_birth", [dateOfBirth]);
    cy.verifyContentPresence("#view-gender", [gender]);
  }

  clearUserContactInfo() {
    cy.get("input[name='email']").click().clear();
    cy.get("input[name='phone_number']").click().clear();
    cy.get("input[name='phone_number_is_whatsapp']").should("be.checked");
  }

  editUserContactInfo(email: string, phoneNumber: string) {
    this.editEmail(email);
    this.editPhoneNumber(phoneNumber);
  }

  editEmail(email: string, clearBeforeTyping = true) {
    cy.typeIntoField("input[name='email']", email, { clearBeforeTyping });
  }

  editPhoneNumber(
    phoneNumber: string,
    clearBeforeTyping = true,
    skipVerification = true,
  ) {
    cy.typeIntoField("input[name='phone_number']", phoneNumber, {
      clearBeforeTyping,
      skipVerification,
    });
    cy.get("input[name='phone_number_is_whatsapp']").should("be.checked");
  }

  verifyEditUserContactInfo(email: string, phoneNumber: string) {
    cy.verifyContentPresence("#view-email", [email]);
    cy.verifyContentPresence("#view-phone_number", [phoneNumber]);
    cy.verifyContentPresence("#view-whatsapp_number", [phoneNumber]);
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

  editQualification(qualification: string, clearBeforeTyping = true) {
    cy.typeIntoField("input[name='qualification']", qualification, {
      clearBeforeTyping,
    });
  }

  editDoctorYoE(doctorYoE: string, clearBeforeTyping = true) {
    cy.typeIntoField(
      "input[name='doctor_experience_commenced_on']",
      doctorYoE,
      {
        clearBeforeTyping,
      },
    );
  }

  editMedicalCouncilRegistration(
    medicalCouncilRegistration: string,
    clearBeforeTyping = true,
  ) {
    cy.typeIntoField(
      "input[name='doctor_medical_council_registration']",
      medicalCouncilRegistration,
      {
        clearBeforeTyping,
      },
    );
  }

  clearProfessionalInfo() {
    cy.get("input[name='weekly_working_hours']").scrollIntoView();
    cy.get("input[name='weekly_working_hours']").click().clear();
    cy.get("input[name='video_connect_link']").click().clear();
  }

  editWeeklyWorkingHours(weeklyWorkingHours: string, clearBeforeTyping = true) {
    cy.get("input[name='weekly_working_hours']").scrollIntoView();
    cy.typeIntoField("input[name='weekly_working_hours']", weeklyWorkingHours, {
      clearBeforeTyping,
    });
  }

  editVideoConnectLink(videoConnectLink: string, clearBeforeTyping = true) {
    cy.typeIntoField("input[name='video_connect_link']", videoConnectLink, {
      clearBeforeTyping,
    });
  }

  editUserProfessionalInfo(
    qualification: string,
    yearsOfExperience?: string,
    medicalCouncilRegistration?: string,
  ) {
    this.editQualification(qualification);
    if (yearsOfExperience) {
      this.editDoctorYoE(yearsOfExperience);
    }
    if (medicalCouncilRegistration) {
      this.editMedicalCouncilRegistration(medicalCouncilRegistration);
    }
  }

  editHoursAndVideoConnectLink(
    weeklyWorkingHours: string,
    videoConnectLink: string,
  ) {
    this.editWeeklyWorkingHours(weeklyWorkingHours);
    this.editVideoConnectLink(videoConnectLink);
  }

  verifyEditUserProfessionalInfo(
    qualification: string,
    yearsOfExperience?: string,
    medicalCouncilRegistration?: string,
  ) {
    cy.verifyContentPresence("#view-qualification", [qualification]);
    if (yearsOfExperience) {
      cy.verifyContentPresence("#view-years_of_experience", [
        yearsOfExperience,
      ]);
    }
    if (medicalCouncilRegistration) {
      cy.verifyContentPresence("#view-doctor_medical_council_registration", [
        medicalCouncilRegistration,
      ]);
    }
  }

  verifyHoursAndVideoConnectLink(
    weeklyWorkingHours: string,
    videoConnectLink: string,
  ) {
    cy.get("#view-average_weekly_working_hours").scrollIntoView();
    cy.verifyContentPresence("#view-average_weekly_working_hours", [
      weeklyWorkingHours,
    ]);
    cy.verifyContentPresence("#view-video_conference_link", [videoConnectLink]);
  }

  verifyPasswordEditButtonNotExist() {
    cy.get("#change-edit-password-button").should("not.exist");
  }

  changePassword(oldPassword: string, newPassword: string) {
    cy.typeIntoField("input[name='old_password']", oldPassword, {
      clearBeforeTyping: true,
    });
    cy.typeIntoField("input[name='new_password_1']", newPassword, {
      clearBeforeTyping: true,
    });
    cy.typeIntoField("input[name='new_password_2']", newPassword, {
      clearBeforeTyping: true,
    });
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

  clickBasicInfoEditButton() {
    cy.verifyAndClickElement("#basic-info-edit-button", "Edit");
  }

  clickBaicInfoViewButton() {
    cy.verifyAndClickElement("#basic-info-view-button", "View");
  }

  clickContactInfoEditButton() {
    cy.verifyAndClickElement("#contact-info-edit-button", "Edit");
  }

  clickContactInfoViewButton() {
    cy.verifyAndClickElement("#contact-info-view-button", "View");
  }

  clickProfessionalInfoViewButton() {
    cy.verifyAndClickElement("#professional-info-view-button", "View");
  }

  clickProfessionalInfoEditButton() {
    cy.verifyAndClickElement("#professional-info-edit-button", "Edit");
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

  verifyQualificationDoesntExist() {
    cy.get("#view-qualification").should("not.exist");
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
}

export default ManageUserPage;
