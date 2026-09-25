import { expect, test, type Page } from "@playwright/test";
import * as fs from "fs";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaire,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const NURSE_STATE = "tests/.auth/nurse.json";

/** A facility department care-nurse belongs to — resolved at runtime
 *  because it differs between fixture sets. */
async function nurseDepartment(
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const state = JSON.parse(fs.readFileSync(NURSE_STATE, "utf-8"));
  const token = state.origins[0].localStorage.find(
    (item: { name: string }) => item.name === "care_access_token",
  ).value;
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/mine/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(res.ok).toBe(true);
  const { results } = (await res.json()) as {
    results: { id: string; name: string }[];
  };
  expect(results.length).toBeGreaterThan(0);
  return results[0];
}

/** Asserts whether `title` is offered in the facility list and the
 *  encounter Forms picker for the user behind `page`. */
async function expectVisibleToUser(
  page: Page,
  title: string,
  visible: boolean,
) {
  const facilityId = getFacilityId();

  await page.goto(`/facility/${facilityId}/settings/questionnaires`);
  await page.getByPlaceholder("Search questionnaires").fill(title);
  if (visible) {
    await expect(page.locator('[data-slot="table-body"]')).toContainText(title);
  } else {
    await expect(page.getByText("No questionnaires found")).toBeVisible();
  }

  await page.goto(
    `/facility/${facilityId}/patient/${getPatientId()}/encounter/${getEncounterId()}/updates`,
  );
  await page.getByRole("button", { name: "Forms" }).click();
  const picker = page.getByRole("dialog");
  await picker.getByPlaceholder("Search Forms").fill(title);
  if (visible) {
    await expect(
      picker.getByRole("option").filter({ hasText: title }),
    ).toBeVisible();
  } else {
    await expect(picker.getByText("No results")).toBeVisible();
  }
}

test.describe("Questionnaire v2 organizations field", () => {
  test("instance variant adds and removes a role organization", async ({
    page,
  }) => {
    const title = `QV2 Orgs Instance ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create an instance questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title,
      });
      // Scoped: the admin sidebar also has an "Organizations" nav item.
      await expect(
        page
          .getByRole("tabpanel", { name: "Questions", exact: true })
          .getByText("Organizations", { exact: true }),
      ).toBeVisible();
    });

    const writes: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /set_organizations|batch_requests/.test(request.url())
      )
        writes.push(request.url());
    });

    // The selected chip renders as a badge; the (still open) suggestion
    // popover repeats the name, so scope every assertion to the badge.
    const chip = page.locator('[data-slot="badge"]', {
      hasText: "Health Department",
    });

    await test.step("Add the Health Department role organization", async () => {
      await page.getByRole("button", { name: "Search Organizations" }).click();
      await page.getByRole("option", { name: "Health Department" }).click();
      await expect(chip).toBeVisible();
      expect(writes).toHaveLength(0);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeEnabled();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Questionnaire updated successfully");
      await expect(chip).toBeVisible();
      expect(writes).toHaveLength(1);
    });

    await test.step("The link persists across a reload", async () => {
      await page.goto(detailUrl);
      await expect(chip).toBeVisible();
    });

    await test.step("Removing the chip unlinks it again", async () => {
      await chip.getByRole("button", { name: "Remove organization" }).click();
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeEnabled();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.goto(detailUrl);
      await expect(chip).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search Organizations" }),
      ).toBeVisible();
    });
  });

  test("facility variant links a facility organization", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Orgs Facility ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create a facility questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
      await expect(
        page
          .getByRole("tabpanel", { name: "Questions", exact: true })
          .getByText("Organizations", { exact: true }),
      ).toBeVisible();
      // The label and the combobox placeholder share the same text.
      await expect(
        page.locator("label").filter({ hasText: "Select Department" }),
      ).toBeVisible();
    });

    await test.step("Pick a department from the All Organizations tab", async () => {
      await page.getByRole("tab", { name: "All Organizations" }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Department" })
        .click();
      await page.getByRole("option", { name: "Pulmonology" }).click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeEnabled();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("The department persists across a reload", async () => {
      await page.goto(detailUrl);
      await expect(page.getByText("Pulmonology")).toBeVisible();
    });
  });

  test("facility selections preserve pending additions and allow remove then re-add", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const names = [`First department ${stamp}`, `Second department ${stamp}`];
    for (const name of names) {
      const response = await request.post(
        `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/`,
        {
          headers: adminApiHeaders(),
          data: {
            name,
            description: "Questionnaire organization regression",
            org_type: "dept",
            facility: facilityId,
          },
        },
      );
      expect(response.ok()).toBeTruthy();
    }
    const detailUrl = await createQuestionnaire(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `Staged organizations ${stamp}`,
    });
    const selectOrganization = async (name: string) => {
      await page.getByRole("tab", { name: "All Organizations" }).click();
      await page.locator("fieldset").getByRole("combobox").click();
      await page.locator('[data-slot="command-input"]').fill(name);
      await page.getByRole("option", { name }).click();
      await page.keyboard.press("Escape");
      await expect(
        page.locator("fieldset p").filter({ hasText: name }),
      ).toBeVisible();
    };
    await test.step("Persist the first selection", async () => {
      await selectOrganization(names[0]);
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.goto(detailUrl);
    });
    await test.step("Keep both pending selections when one was already saved", async () => {
      await selectOrganization(names[1]);
      await expect(
        page.locator("fieldset p").filter({ hasText: names[0] }),
      ).toBeVisible();
      await expect(
        page.locator("fieldset p").filter({ hasText: names[1] }),
      ).toBeVisible();
      await page
        .locator("fieldset p")
        .filter({ hasText: names[0] })
        .locator("..")
        .locator("..")
        .getByRole("button", { name: "Remove organization" })
        .click();
      await expect(
        page.locator("fieldset p").filter({ hasText: names[0] }),
      ).not.toBeVisible();
      await selectOrganization(names[0]);
      await expect(
        page.locator("fieldset p").filter({ hasText: names[1] }),
      ).toBeVisible();
    });
    await test.step("Save the complete selection once and reload", async () => {
      let releaseSave = () => {};
      const saveGate = new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
      await page.route(
        "**/api/v1/batch_requests/",
        async (route) => {
          await saveGate;
          await route.continue();
        },
        { times: 1 },
      );
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expect(
        page
          .locator("fieldset")
          .getByRole("button", { name: "Remove organization" })
          .first(),
      ).toBeDisabled();
      await expect(page.getByRole("textbox", { name: "Title" })).toBeEnabled();
      releaseSave();
      await expectToast(page, "Questionnaire updated successfully");
      await page.goto(detailUrl);
      for (const name of names)
        await expect(
          page.locator("fieldset p").filter({ hasText: name }),
        ).toBeVisible();
    });
  });

  test("tagging the nurse's department makes an encounter questionnaire visible to them, untagging hides it", async ({
    page,
    browser,
  }) => {
    // Two users and six page loads: the default 60s budget is too tight under load.
    test.slow();
    const facilityId = getFacilityId();
    const title = `QV2 Orgs Visibility ${Date.now()}`;
    const department = await nurseDepartment(facilityId);
    const nurseContext = await browser.newContext({
      storageState: NURSE_STATE,
    });
    const nursePage = await nurseContext.newPage();
    let detailUrl = "";

    try {
      await test.step("Admin creates an untagged active encounter questionnaire", async () => {
        // Pickers only offer active questionnaires; new ones default to Draft.
        detailUrl = await createQuestionnaire(page, {
          basePath: `/facility/${facilityId}/settings/questionnaires`,
          title,
          status: "Active",
        });
      });

      await test.step("Untagged: hidden from the nurse", async () => {
        await expectVisibleToUser(nursePage, title, false);
      });

      await test.step("Admin tags the nurse's department", async () => {
        // The nurse's department can be the facility root, which the picker
        // never offers — so tag through the endpoint the picker calls.
        const res = await fetch(
          `${apiBaseUrl()}/api/v1/questionnaire/${detailUrl.split("/").pop()}/set_facility_organizations/`,
          {
            method: "POST",
            headers: adminApiHeaders(),
            body: JSON.stringify({ facility_organizations: [department.id] }),
          },
        );
        expect(res.ok).toBe(true);
      });

      await test.step("Tagged: the nurse sees it in the list and encounter picker", async () => {
        await expectVisibleToUser(nursePage, title, true);
      });

      await test.step("Admin removes the tag in the UI and saves", async () => {
        await page.goto(detailUrl);
        await expect(page.getByText(department.name).first()).toBeVisible();
        await page
          .locator("fieldset")
          .getByRole("button", { name: "Remove organization" })
          .click();
        await page
          .getByRole("button", { name: /Save (Questionnaire|Form)/ })
          .click();
        await expectToast(page, "Questionnaire updated successfully");
      });

      await test.step("Untagged again: hidden from the nurse", async () => {
        await expectVisibleToUser(nursePage, title, false);
      });
    } finally {
      await nurseContext.close();
    }
  });
});
