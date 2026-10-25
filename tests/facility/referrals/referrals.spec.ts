import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  openMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function selectDepartment(page: Page, name: string) {
  await openMultiFilter(page, /^Department$/);
  await page
    .getByPlaceholder("Search departments...", { exact: true })
    .fill(name);
  await page.getByRole("menuitem", { name, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(selectedMultiFilterBar(page, /Department/)).toContainText(name);
}

async function selectReferralFilter(page: Page, label: RegExp, value: string) {
  await openMultiFilter(page, label);
  await page.getByRole("menu").getByText(value, { exact: true }).click();
  await page.keyboard.press("Escape");
}

async function setAvailabilityStatus(
  page: Page,
  status: "Draft" | "Active" | "Inactive",
) {
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Status", exact: true })
    .click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

async function searchReferralUnits(page: Page, name: string) {
  const dialog = page.getByRole("dialog", {
    name: "Request form",
    exact: true,
  });
  await dialog
    .getByRole("combobox", { name: "Referral unit", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Search referral units", exact: true })
    .fill(name);
  return dialog;
}

test.describe("Referrals", () => {
  test("configures an availability and preserves a submitted referral across clinical views", async ({
    page,
    request,
  }, testInfo) => {
    // This is one connected clinical workflow with several persisted UI transitions.
    test.slow();
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
    const questionnaireTitle = `Referral intake ${suffix}`;
    const departmentName = `Referral department ${suffix}`;
    const unitPrefix = `Referral service ${suffix}`;
    const availabilityName = `${unitPrefix} Z specialist review`;
    const siblingNames = Array.from(
      { length: 21 },
      (_, index) => `${unitPrefix} A${String(index).padStart(2, "0")}`,
    );
    const referralTitle = `Consultation ${suffix}`;
    const questionLabel = `Clinical reason ${suffix}`;
    const booleanLabel = `Previous specialist review ${suffix}`;
    const historyLabel = `Supporting history ${suffix}`;
    const historyEntryLabel = `History entry ${suffix}`;
    const answer = `Referral assessment requested ${suffix}`;
    const priorAssessment = `Prior clinical assessment ${suffix}`;
    const historyAnswers = [
      `First history entry ${suffix}`,
      `Second history entry ${suffix}`,
    ];
    const note = `Please review the submitted history ${suffix}`;
    const settingsUrl = `/facility/${facilityId}/settings/referrals`;
    const encounterUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`;
    let referralPath: string;
    let departmentId: string;
    let facilityName: string;
    let clinicalResponseId: string;
    let questionnaireId: string;
    let originPatient: { name: string; gender: string };
    const requestSection = page.getByRole("region", {
      name: "Request",
      exact: true,
    });

    const captureResponsiveView = async (
      name: string,
      fullscreenDialog?: Locator,
    ) => {
      const originalViewport = page.viewportSize();
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          )
          .toBe(true);
        if (fullscreenDialog) {
          const withinViewport = async (locator: Locator, vertical = true) => {
            await expect
              .poll(async () => {
                const box = await locator.boundingBox();
                return (
                  !!box &&
                  box.x >= -1 &&
                  box.x + box.width <= viewport.width + 1 &&
                  (!vertical ||
                    (box.y >= -1 && box.y + box.height <= viewport.height + 1))
                );
              })
              .toBe(true);
          };
          await withinViewport(fullscreenDialog);
          await withinViewport(
            fullscreenDialog.getByRole("tab", {
              name: "Request form",
              exact: true,
            }),
          );
          for (const label of ["Back to editing", "Send referral"]) {
            await withinViewport(
              fullscreenDialog.getByRole("button", {
                name: label,
                exact: true,
              }),
            );
          }
          for (const text of [referralTitle, answer, note]) {
            await withinViewport(
              fullscreenDialog
                .getByText(text, { exact: true })
                .filter({ visible: true }),
              false,
            );
          }
        }
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${viewport.width}.png`),
          fullPage: !fullscreenDialog,
        });
        if (fullscreenDialog && viewport.width === 390) {
          const patientHeader = fullscreenDialog.getByLabel("Patient Details", {
            exact: true,
          });
          await patientHeader.scrollIntoViewIfNeeded();
          const initialHeader = await patientHeader.boundingBox();
          expect(initialHeader).not.toBeNull();
          await fullscreenDialog
            .getByRole("heading", { name: "Review referral", exact: true })
            .hover();
          await page.mouse.wheel(0, 1200);
          await expect
            .poll(
              async () => (await patientHeader.boundingBox())?.y ?? Infinity,
            )
            .toBeLessThan(initialHeader!.y - 50);
          for (const label of ["Back to editing", "Send referral"]) {
            await expect(
              fullscreenDialog.getByRole("button", {
                name: label,
                exact: true,
              }),
            ).toBeInViewport({ ratio: 1 });
          }
          await page.screenshot({
            path: testInfo.outputPath(`${name}-scrolled-${viewport.width}.png`),
          });
          await patientHeader.scrollIntoViewIfNeeded();
        }
      }
      if (originalViewport) await page.setViewportSize(originalViewport);
    };

    const captureDestinationPicker = async (dialog: Locator) => {
      const originalViewport = page.viewportSize();
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        const unitPicker = dialog.getByRole("combobox", {
          name: "Referral unit",
          exact: true,
        });
        await expect(async () => {
          await unitPicker.scrollIntoViewIfNeeded();
          await expect(unitPicker).toBeInViewport({ ratio: 1 });
        }).toPass();
        await expect(unitPicker).toBeEnabled();
        await page.screenshot({
          path: testInfo.outputPath(
            `referral-destination-${viewport.width}.png`,
          ),
          animations: "disabled",
        });
        await searchReferralUnits(page, unitPrefix);
        const firstUnit = page
          .getByRole("option")
          .filter({ hasText: siblingNames[0] });
        await expect(firstUnit).toBeVisible();
        await expect(firstUnit).toBeEnabled();
        const searchInput = page.getByRole("combobox", {
          name: "Search referral units",
          exact: true,
        });
        await expect(searchInput).toBeFocused();
        // The focused search field must fit its visible row; the previous
        // taller input was clipped by the command container on both layouts.
        await expect
          .poll(() =>
            searchInput.evaluate((input) => {
              const field = input.getBoundingClientRect();
              const row = input.parentElement?.getBoundingClientRect();
              return (
                !!row &&
                field.top >= row.top - 1 &&
                field.bottom <= row.bottom + 1 &&
                field.left >= row.left - 1 &&
                field.right <= row.right + 1
              );
            }),
          )
          .toBe(true);
        await expect(
          page.getByRole("button", { name: "Load more", exact: true }),
        ).toBeEnabled();
        await expect
          .poll(async () => {
            const box = await firstUnit.boundingBox();
            return !!box && box.x >= 0 && box.x + box.width <= viewport.width;
          })
          .toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(
            `referral-unit-picker-${viewport.width}.png`,
          ),
          animations: "disabled",
        });
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("combobox", {
            name: "Search referral units",
            exact: true,
          }),
        ).not.toBeVisible();
      }
      if (originalViewport) await page.setViewportSize(originalViewport);
    };

    await test.step("Read independent origin details from the encounter", async () => {
      const response = await request.get(
        `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
        { headers: adminApiHeaders() },
      );
      expect(
        response.ok(),
        (await response.text()).slice(0, 2000),
      ).toBeTruthy();
      const encounter = (await response.json()) as {
        facility: { id: string; name: string };
        patient: { name: string; gender: string };
      };
      originPatient = encounter.patient;
      expect(encounter.facility.id).toBe(facilityId);
      facilityName = encounter.facility.name;
      expect(facilityName).not.toBe("");
    });

    await test.step("Create an isolated receiving department", async () => {
      const response = await request.post(
        `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/`,
        {
          headers: adminApiHeaders(),
          data: {
            name: departmentName,
            description: "Receiving department for the referral workflow",
            org_type: "dept",
            facility: facilityId,
          },
        },
      );
      expect(
        response.ok(),
        (await response.text()).slice(0, 2000),
      ).toBeTruthy();
      departmentId = (await response.json()).id;
    });

    await test.step("Create an active request questionnaire using the backend contract", async () => {
      const response = await request.post(
        `${apiBaseUrl()}/api/v1/questionnaire/`,
        {
          headers: adminApiHeaders(),
          data: {
            auth_context: "instance",
            slug: `referral-${suffix}`,
            title: questionnaireTitle,
            description: "Referral intake for the end-to-end workflow",
            status: "active",
            subject_type: "encounter",
            actions: [],
            questions: [
              {
                id: faker.string.uuid(),
                link_id: "clinical-reason",
                text: questionLabel,
                type: "string",
                required: true,
              },
              {
                id: faker.string.uuid(),
                link_id: "previous-specialist-review",
                text: booleanLabel,
                type: "boolean",
                required: true,
              },
              {
                id: faker.string.uuid(),
                link_id: "supporting-history",
                text: historyLabel,
                type: "group",
                repeats: true,
                questions: [
                  {
                    id: faker.string.uuid(),
                    link_id: "history-entry",
                    text: historyEntryLabel,
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
          },
        },
      );
      expect(response.ok(), await response.text()).toBeTruthy();
      const form = (await response.json()) as {
        id: string;
        questions: { id: string; link_id: string }[];
      };
      questionnaireId = form.id;
      const clinical = await request.post(
        `${apiBaseUrl()}/api/v1/questionnaire/${form.id}/submit/`,
        {
          headers: adminApiHeaders(),
          data: {
            patient: patientId,
            encounter: encounterId,
            resource_id: encounterId,
            results: [
              {
                question_id: form.questions.find(
                  (question) => question.link_id === "clinical-reason",
                )!.id,
                values: [{ value: priorAssessment }],
              },
              {
                question_id: form.questions.find(
                  (question) =>
                    question.link_id === "previous-specialist-review",
                )!.id,
                values: [{ value: "false" }],
              },
            ],
          },
        },
      );
      expect(clinical.ok(), await clinical.text()).toBeTruthy();
      clinicalResponseId = (await clinical.json()).id;
    });

    await test.step("Require a request form before publishing and save a draft", async () => {
      await page.goto(settingsUrl);
      await selectDepartment(page, departmentName);
      await page
        .getByRole("button", { name: "Add referral availability", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Add referral availability",
        exact: true,
      });
      await dialog
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(availabilityName);
      await setAvailabilityStatus(page, "Active");
      await dialog
        .getByRole("button", { name: "Add referral availability", exact: true })
        .click();
      await expect(dialog.getByRole("alert")).toContainText(
        "Add an active request form before activating",
      );

      await setAvailabilityStatus(page, "Draft");
      await dialog
        .getByRole("combobox", { name: "Search active forms", exact: true })
        .click();
      await page
        .getByPlaceholder("Search option...", { exact: true })
        .fill(questionnaireTitle);
      await page
        .getByRole("option", { name: questionnaireTitle, exact: true })
        .click();
      await expect(
        dialog.getByText(questionnaireTitle, { exact: true }),
      ).toBeVisible();
      const createdAvailability = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname ===
            "/api/v1/referral_availability/" &&
          response.request().method() === "POST",
      );
      await dialog
        .getByRole("button", { name: "Add referral availability", exact: true })
        .click();
      const createResponse = await createdAvailability;
      expect(createResponse.ok()).toBeTruthy();
      expect(await createResponse.json()).toMatchObject({
        entity_type: "internal_organization",
        facility: facilityId,
        internal_organization: departmentId,
      });
      await expect(dialog).not.toBeVisible();
      await page
        .getByRole("textbox", {
          name: "Search referral availability",
          exact: true,
        })
        .fill(availabilityName);
      const row = page.getByRole("listitem").filter({
        has: page.getByRole("heading", {
          name: availabilityName,
          exact: true,
        }),
      });
      await expect(row).toContainText("Draft");

      const facilityScopeResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral_availability_config/" &&
          url.searchParams.get("entity_type") === "facility" &&
          url.searchParams.get("entity_id") === facilityId &&
          url.searchParams.get("name") === availabilityName
        );
      });
      await page
        .getByRole("button", { name: "Remove filter", exact: true })
        .click();
      expect((await facilityScopeResponse).ok()).toBeTruthy();
      await expect(row).not.toBeVisible();
      await expect(
        selectedMultiFilterBar(page, /Department/),
      ).not.toBeVisible();
    });

    await test.step("Reload the saved configuration and activate it", async () => {
      await page.reload();
      await selectDepartment(page, departmentName);
      await page
        .getByRole("textbox", {
          name: "Search referral availability",
          exact: true,
        })
        .fill(availabilityName);
      await page
        .getByRole("button", { name: `Edit ${availabilityName}`, exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Edit referral availability",
        exact: true,
      });
      await expect(
        dialog.getByRole("textbox", { name: "Name", exact: true }),
      ).toHaveValue(availabilityName);
      await expect(
        dialog.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText("Draft");
      await expect(
        dialog.getByText(questionnaireTitle, { exact: true }),
      ).toBeVisible();
      await setAvailabilityStatus(page, "Active");
      await dialog
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(dialog).not.toBeVisible();
      const row = page.getByRole("listitem").filter({
        has: page.getByRole("heading", {
          name: availabilityName,
          exact: true,
        }),
      });
      await expect(row).toContainText("Active");
    });

    await test.step("Publish enough sibling units to exercise destination pagination", async () => {
      const responses = await Promise.all(
        siblingNames.map((name) =>
          request.post(`${apiBaseUrl()}/api/v1/referral_availability/`, {
            headers: adminApiHeaders(),
            data: {
              name,
              status: "active",
              is_public: true,
              referral_type: "consultation",
              entity_type: "internal_organization",
              facility: facilityId,
              internal_organization: departmentId,
              care_team: [],
              questionnaires: [
                {
                  questionnaire: questionnaireId,
                  questionnaire_type: "request",
                },
              ],
            },
          }),
        ),
      );
      for (const response of responses) {
        expect(response.ok(), await response.text()).toBeTruthy();
      }
    });

    await test.step("Create a referral with required text, a negative answer, and repeated history", async () => {
      let createRequests = 0;
      page.on("request", (request) => {
        if (
          new URL(request.url()).pathname === "/api/v1/referral/" &&
          request.method() === "POST"
        ) {
          createRequests++;
        }
      });
      await page.goto(`${encounterUrl}/referrals`);
      await page
        .getByRole("button", { name: "New referral", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Request form",
        exact: true,
      });
      const patientDetails = dialog.getByLabel("Patient Details", {
        exact: true,
      });
      await expect(patientDetails).toContainText(originPatient.name);
      await expect(patientDetails).toContainText(
        originPatient.gender.charAt(0).toUpperCase() +
          originPatient.gender.slice(1),
      );
      await patientDetails
        .getByRole("button", { name: originPatient.name, exact: true })
        .click();
      const profile = page.getByRole("link", {
        name: "View Profile",
        exact: true,
      });
      await expect(profile).toHaveAttribute("href", `/patient/${patientId}`);
      await page.keyboard.press("Escape");
      await expect(profile).not.toBeVisible();
      const encounterDetails = patientDetails.getByLabel("Encounter", {
        exact: true,
      });
      await expect(encounterDetails).toContainText(facilityName);
      await expect(
        encounterDetails.getByText("Start date", { exact: true }),
      ).toBeVisible();
      await expect(
        encounterDetails.getByText("End date", { exact: true }),
      ).toBeVisible();
      await dialog
        .getByRole("combobox", { name: "Refer to", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Departments", exact: true })
        .click();
      await captureDestinationPicker(dialog);
      await searchReferralUnits(page, unitPrefix);
      await expect(page.getByRole("option")).toHaveCount(20);
      const targetUnit = page
        .getByRole("option")
        .filter({ hasText: availabilityName });
      await expect(targetUnit).toHaveCount(0);
      await page
        .getByRole("button", { name: "Load more", exact: true })
        .click();
      await expect(targetUnit).toBeVisible();
      await page
        .getByRole("combobox", {
          name: "Search referral units",
          exact: true,
        })
        .fill(availabilityName);
      await expect(page.getByRole("option")).toHaveCount(1);
      await expect(
        page.getByRole("button", {
          name: "Load more",
          exact: true,
        }),
      ).toHaveCount(0);
      await targetUnit.click();
      await dialog
        .getByRole("textbox", { name: "Referral title", exact: true })
        .fill(referralTitle);
      await dialog
        .getByRole("textbox", {
          name: "Additional note (optional)",
          exact: true,
        })
        .fill(note);
      await dialog
        .getByRole("button", { name: "Review referral", exact: true })
        .click();
      await expect(
        dialog.getByText(
          "Please review the highlighted answers before sending the referral.",
          { exact: true },
        ),
      ).toBeVisible();
      await questionBlock(page, questionLabel)
        .getByRole("textbox")
        .fill(answer);
      await questionBlock(page, booleanLabel)
        .getByRole("radio", { name: "No", exact: true })
        .click();
      for (const [index, historyAnswer] of historyAnswers.entries()) {
        await dialog
          .getByRole("button", { name: "Add Another", exact: true })
          .click();
        await questionBlock(page, historyEntryLabel)
          .nth(index)
          .getByRole("textbox")
          .fill(historyAnswer);
      }
      const historyTab = dialog.getByRole("tab", {
        name: "Patient Clinical History",
        exact: true,
      });
      const requestTab = dialog.getByRole("tab", {
        name: "Request form",
        exact: true,
      });
      await historyTab.click();
      await dialog.getByRole("tab", { name: "Responses", exact: true }).click();
      await expect(
        dialog.getByText(priorAssessment, { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("referral-clinical-history.png"),
      });
      const historyViewport = page.viewportSize();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(requestTab).toBeInViewport({ ratio: 1 });
      await expect(historyTab).toBeInViewport({ ratio: 1 });
      await expect(
        dialog.getByRole("button", { name: "Close", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      await page.screenshot({
        path: testInfo.outputPath("referral-clinical-history-390.png"),
      });
      if (historyViewport) await page.setViewportSize(historyViewport);
      await dialog
        .locator(`#response-${clinicalResponseId}`)
        .getByRole("button", { name: "More Actions", exact: true })
        .click();
      const printOpened = page.waitForEvent("popup");
      await page
        .getByRole("menuitem", { name: "Print this response", exact: true })
        .click();
      const printPage = await printOpened;
      await expect(printPage).toHaveURL(
        (url) =>
          url.pathname ===
          `/facility/${facilityId}/patient/${patientId}/questionnaire_response/${clinicalResponseId}/print`,
      );
      await printPage.close();
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(`${encounterUrl}/referrals`);
      await requestTab.click();
      await expect(
        questionBlock(page, questionLabel).getByRole("textbox"),
      ).toHaveValue(answer);
      await expect(
        questionBlock(page, booleanLabel).getByRole("radio", {
          name: "No",
          exact: true,
        }),
      ).toBeChecked();
      await dialog
        .getByRole("button", { name: "Review referral", exact: true })
        .click();
      await expect(
        dialog.getByRole("button", { name: "Send referral", exact: true }),
      ).toBeVisible();
      await expect(dialog).toContainText(answer);
      await expect(dialog).toContainText(questionnaireTitle);
      await expect(patientDetails).toContainText(originPatient.name);
      await expect(encounterDetails).toContainText(facilityName);
      expect(createRequests).toBe(0);
      await historyTab.click();
      await expect(
        dialog.getByText(priorAssessment, { exact: true }),
      ).toBeVisible();
      await requestTab.click();
      await expect(
        dialog.getByRole("button", { name: "Send referral", exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Review referral", exact: true }),
      ).toHaveCount(0);
      await expect(dialog.getByText(answer, { exact: true })).toBeVisible();
      await dialog
        .getByRole("button", { name: "Back to editing", exact: true })
        .click();
      await expect(
        questionBlock(page, questionLabel).getByRole("textbox"),
      ).toHaveValue(answer);
      await expect(dialog).toContainText(questionnaireTitle);
      await dialog
        .getByRole("button", { name: "Review referral", exact: true })
        .click();
      expect(createRequests).toBe(0);
      await captureResponsiveView("referral-review", dialog);
      const createdReferral = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/referral/" &&
          response.request().method() === "POST",
      );
      await dialog
        .getByRole("button", { name: "Send referral", exact: true })
        .click();
      const createResponse = await createdReferral;
      expect(createResponse.ok()).toBeTruthy();
      expect(createRequests).toBe(1);
      expect(createResponse.request().postDataJSON()).toMatchObject({
        patient: patientId,
        encounter: encounterId,
        questionnaire: questionnaireId,
        title: referralTitle,
      });
      expect(await createResponse.json()).toMatchObject({ assignees: [] });
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: referralTitle }),
      ).toBeVisible();
    });

    await test.step("Open and reload the standalone referral page with all submitted answers", async () => {
      const row = page.getByRole("row").filter({ hasText: referralTitle });
      await expect(row).toContainText(availabilityName);
      await expect(row).toContainText("Pending");
      await row.getByRole("link", { name: referralTitle, exact: true }).click();
      await expect(page).toHaveURL(
        (url) =>
          /^\/referrals\/[0-9a-f-]+$/.test(url.pathname) &&
          url.searchParams.get("sourceUrl") === `${encounterUrl}/referrals`,
      );
      referralPath = new URL(page.url()).pathname;
      await page.reload();
      await expect(
        page.getByRole("heading", {
          name: referralTitle,
          level: 1,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(questionLabel, { exact: true }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(answer, { exact: true }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(booleanLabel, { exact: true }),
      ).toBeVisible();
      await expect(
        requestSection.getByText("No", { exact: true }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(historyLabel, { exact: true }),
      ).toBeVisible();
      for (const historyAnswer of historyAnswers) {
        await expect(
          requestSection.getByText(historyAnswer, { exact: true }),
        ).toBeVisible();
      }
      await expect(page.getByText(note, { exact: true })).toBeVisible();
      await captureResponsiveView("referral-detail");
      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(`${encounterUrl}/referrals`);
    });

    await test.step("Open the submitted referral from the encounter overview widget", async () => {
      await page.goto(`${encounterUrl}/updates`);
      const widget = page.locator('[data-cy="referral-list"]');
      const referralLink = widget
        .getByRole("link")
        .filter({ hasText: referralTitle });
      await referralLink.click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === referralPath &&
          url.searchParams.get("sourceUrl") === `${encounterUrl}/updates`,
      );
      await expect(
        requestSection.getByText(answer, { exact: true }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(`${encounterUrl}/updates`);
      await page
        .getByRole("button", { name: "View all referrals", exact: true })
        .click();
      await expect(page).toHaveURL(`${encounterUrl}/referrals`);
      await expect(
        page.getByRole("row").filter({ hasText: referralTitle }),
      ).toBeVisible();
    });

    await test.step("Find the same referral in patient history and its receiving department", async () => {
      const patientReferralsUrl = `/facility/${facilityId}/patient/${patientId}/referrals`;
      await page.goto(patientReferralsUrl);
      const patientRow = page
        .getByRole("row")
        .filter({ hasText: referralTitle });
      await expect(patientRow).toContainText(availabilityName);
      await patientRow
        .getByRole("link", { name: referralTitle, exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === referralPath &&
          url.searchParams.get("sourceUrl") === patientReferralsUrl,
      );
      await expect(
        page.getByRole("heading", {
          name: referralTitle,
          level: 1,
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(patientReferralsUrl);

      const facilityReferralsUrl = `/facility/${facilityId}/referrals`;
      await page.goto(facilityReferralsUrl);
      await page
        .getByRole("heading", { name: "Referrals", level: 1, exact: true })
        .hover();
      await selectDepartment(page, departmentName);
      await expect(page).toHaveURL(
        (url) => url.searchParams.get("referralDepartment") === departmentId,
      );
      const scopedUrl = new URL(page.url());
      const departmentReferralsUrl = scopedUrl.pathname + scopedUrl.search;
      await page.reload();
      await expect(selectedMultiFilterBar(page, /Department/)).toContainText(
        departmentName,
      );
      const row = page.getByRole("row").filter({ hasText: referralTitle });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText("Pending");
      // Moving into the results dismisses the app shell's unpinned hover navigation.
      await row.hover();
      await row.getByRole("link", { name: referralTitle, exact: true }).click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === referralPath &&
          url.searchParams.get("sourceUrl") === departmentReferralsUrl,
      );
      await expect(
        requestSection.getByText(answer, { exact: true }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(departmentReferralsUrl);
      await expect(selectedMultiFilterBar(page, /Department/)).toContainText(
        departmentName,
      );
      // Back leaves the pointer over the remounted shell's hover navigation.
      // Move into the results before opening filters beneath that preview.
      await row.hover();
      const list = page.locator('[data-cy="referral-list"]');

      // Changing a filter must reset a bookmarked later page in this scope.
      const laterPageUrl = new URL(page.url());
      laterPageUrl.searchParams.set("referralPage", "7");
      laterPageUrl.searchParams.set(
        "referralScope",
        `internal_organization:${departmentId}`,
      );
      const laterPageResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral/" &&
          url.searchParams.get("entity_id") === departmentId &&
          url.searchParams.get("offset") === "90"
        );
      });
      await page.goto(laterPageUrl.pathname + laterPageUrl.search);
      expect((await laterPageResponse).ok()).toBeTruthy();
      await expect(row).not.toBeVisible();
      const firstPageResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral/" &&
          url.searchParams.get("entity_id") === departmentId &&
          url.searchParams.get("status") === "completed" &&
          url.searchParams.get("offset") === "0"
        );
      });
      await selectReferralFilter(page, /^Status\b/, "Completed");
      expect((await firstPageResponse).ok()).toBeTruthy();
      await expect(list.getByRole("status")).toHaveCount(0);
      await expect(list.getByRole("alert")).toHaveCount(0);
      await expect(row).not.toBeVisible();
      await selectReferralFilter(page, /^Status\b/, "Pending");
      await expect(row).toHaveCount(1);

      const assignedResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral/" &&
          url.searchParams.get("entity_id") === departmentId &&
          url.searchParams.get("status") === "pending" &&
          url.searchParams.get("assigned_to_me") === "true"
        );
      });
      await selectReferralFilter(page, /^Assigned to me\b/, "Yes");
      expect((await assignedResponse).ok()).toBeTruthy();
      await expect(list.getByRole("status")).toHaveCount(0);
      await expect(list.getByRole("alert")).toHaveCount(0);
      await expect(row).not.toBeVisible();
      await selectedMultiFilterBar(page, /^Assigned to me$/)
        .getByRole("button", { name: "Remove filter", exact: true })
        .click();
      await expect(row).toBeVisible();

      await selectReferralFilter(page, /^Assigned to me\b/, "Yes");
      await page.reload();
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("referralDepartment") === departmentId &&
          url.searchParams.get("referralStatus") === "pending" &&
          url.searchParams.get("referralAssignedToMe") === "true",
      );
      await expect(selectedMultiFilterBar(page, /^Department$/)).toContainText(
        departmentName,
      );
      await expect(selectedMultiFilterBar(page, /^Status$/)).toContainText(
        "Pending",
      );
      await expect(
        selectedMultiFilterBar(page, /^Assigned to me$/),
      ).toContainText("Yes");
      await expect(list.getByRole("status")).toHaveCount(0);
      await expect(list.getByRole("alert")).toHaveCount(0);
      await expect(row).not.toBeVisible();

      const facilityScopeResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral/" &&
          url.searchParams.get("entity_type") === "facility" &&
          url.searchParams.get("entity_id") === facilityId &&
          !url.searchParams.has("status") &&
          !url.searchParams.has("assigned_to_me")
        );
      });
      await page
        .getByRole("button", { name: "Clear all", exact: true })
        .click();
      expect((await facilityScopeResponse).ok()).toBeTruthy();
      await expect(page).toHaveURL(
        (url) =>
          !url.searchParams.get("referralDepartment") &&
          !url.searchParams.get("referralStatus") &&
          !url.searchParams.get("referralAssignedToMe"),
      );
      await expect(
        selectedMultiFilterBar(page, /Department/),
      ).not.toBeVisible();
      await expect(selectedMultiFilterBar(page, /^Status$/)).not.toBeVisible();
      await expect(
        selectedMultiFilterBar(page, /^Assigned to me$/),
      ).not.toBeVisible();
      await expect(list.getByRole("status")).toHaveCount(0);
      await expect(list.getByRole("alert")).toHaveCount(0);
      // Facility scope contains referrals addressed to the facility itself;
      // this referral belongs to its selected receiving department.
      await expect(row).not.toBeVisible();
    });

    await test.step("Deactivate the destination without hiding its existing referral", async () => {
      await page.goto(settingsUrl);
      await selectDepartment(page, departmentName);
      await page
        .getByRole("textbox", {
          name: "Search referral availability",
          exact: true,
        })
        .fill(availabilityName);
      await page
        .getByRole("button", { name: `Edit ${availabilityName}`, exact: true })
        .click();
      await setAvailabilityStatus(page, "Inactive");
      const editDialog = page.getByRole("dialog", {
        name: "Edit referral availability",
        exact: true,
      });
      await editDialog
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(editDialog).not.toBeVisible();
      await expect(
        page.getByRole("listitem").filter({
          has: page.getByRole("heading", {
            name: availabilityName,
            exact: true,
          }),
        }),
      ).toContainText("Inactive");

      await page.goto(`${encounterUrl}/referrals`);
      await expect(
        page.getByRole("row").filter({ hasText: referralTitle }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "New referral", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "Request form", exact: true })
        .getByRole("combobox", { name: "Refer to", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Departments", exact: true })
        .click();
      const createDialog = await searchReferralUnits(page, availabilityName);
      await expect(
        page.getByText("No referral units found", {
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        createDialog.getByRole("button", {
          name: "Review referral",
          exact: true,
        }),
      ).toBeDisabled();
    });

    await test.step("Open the shareable referral URL without source context", async () => {
      await page.goto(referralPath);
      await expect(page).toHaveURL(referralPath);
      await expect(
        page.getByRole("heading", {
          name: referralTitle,
          level: 1,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(answer, { exact: true }),
      ).toBeVisible();
    });

    await test.step("Delete the availability while preserving its existing referral", async () => {
      await page.goto(settingsUrl);
      await selectDepartment(page, departmentName);
      const searchAvailability = page.getByRole("textbox", {
        name: "Search referral availability",
        exact: true,
      });
      await searchAvailability.fill(availabilityName);
      const row = page.getByRole("listitem").filter({
        has: page.getByRole("heading", {
          name: availabilityName,
          exact: true,
        }),
      });
      const deleteButton = row.getByRole("button", {
        name: `Delete ${availabilityName}`,
        exact: true,
      });
      await deleteButton.click();
      const dialog = page.getByRole("dialog", {
        name: "Delete availability",
        exact: true,
      });
      await expect(dialog).toContainText("Existing referrals will be kept.");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(row).toBeVisible();
      await deleteButton.click();
      const deletedAvailability = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname.startsWith(
            "/api/v1/referral_availability/",
          ) && response.request().method() === "DELETE",
      );
      await dialog
        .getByRole("button", {
          name: "Delete availability",
          exact: true,
        })
        .click();
      expect((await deletedAvailability).status()).toBe(204);
      await expect(dialog).not.toBeVisible();
      await expect(row).not.toBeVisible();

      await page.reload();
      await selectDepartment(page, departmentName);
      const configurationResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral_availability_config/" &&
          url.searchParams.get("entity_id") === departmentId &&
          url.searchParams.get("name") === availabilityName
        );
      });
      await searchAvailability.fill(availabilityName);
      const response = await configurationResponse;
      expect(response.ok()).toBeTruthy();
      expect((await response.json()).count).toBe(0);
      await expect(row).not.toBeVisible();

      await page.goto(referralPath);
      await expect(
        page.getByRole("heading", {
          name: referralTitle,
          level: 1,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        requestSection.getByText(answer, { exact: true }),
      ).toBeVisible();
      for (const historyAnswer of historyAnswers) {
        await expect(
          requestSection.getByText(historyAnswer, { exact: true }),
        ).toBeVisible();
      }
    });
  });
});
