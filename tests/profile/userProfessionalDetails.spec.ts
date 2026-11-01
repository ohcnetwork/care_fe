import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

import { Code } from "@/types/base/code/code";
import { UserRead } from "@/types/user/user";

test.use({ storageState: "tests/.auth/user.json" });

test("saves professional details, preserves credential metadata and clears removed entries", async ({
  page,
  request,
}) => {
  const headers = getApiHeaders();
  const degreesResponse = await request.get(
    `${getApiUrl()}/api/v1/users/degrees/`,
    { headers },
  );
  expect(degreesResponse.ok()).toBe(true);
  const degrees: Code[] = await degreesResponse.json();
  test.skip(
    !degrees.length,
    "This deployment has no qualification degrees configured",
  );
  const degree = degrees[0];
  const username = `profile-${faker.string.alphanumeric(8).toLowerCase()}`;
  const url = `${getApiUrl()}/api/v1/users/${username}/`;
  const meta = {
    credentialing: {
      verified: true,
      evidence: ["external-reference"],
      notes: null,
    },
  };
  const created = await request.post(`${getApiUrl()}/api/v1/users/`, {
    headers,
    data: {
      username,
      password: "ProfileTest@123",
      email: faker.internet.email(),
      first_name: "Profile",
      last_name: "Test",
      phone_number: `+919${faker.string.numeric(9)}`,
      gender: "non_binary",
      role_orgs: [],
      communication: [
        {
          language: { code: "eng", system: "urn:iso:std:iso:639:-3" },
          preferred: true,
          proficiency: null,
        },
      ],
      qualification: [
        {
          degree: { code: degree.code, system: degree.system },
          issuer: "Test Council",
          registration_number: "REG-ORIGINAL",
          meta,
        },
      ],
    },
  });
  expect(created.status(), await created.text()).toBe(200);
  const readUser = async (): Promise<UserRead> => {
    const response = await request.get(url, { headers });
    expect(response.ok()).toBe(true);
    return response.json();
  };
  const dialog = page.getByRole("dialog", { name: "Edit User", exact: true });
  const save = async () => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url() === url && response.request().method() === "PUT",
      ),
      dialog.getByRole("button", { name: "Update User", exact: true }).click(),
    ]);
    expect(response.ok()).toBe(true);
    await expect(dialog).not.toBeVisible();
  };
  try {
    await page.goto(`/users/${username}`);
    await expect(
      page.getByRole("region", { name: "Qualifications", exact: true }),
    ).toContainText("REG-ORIGINAL");
    await page
      .getByRole("button", { name: "Edit Languages", exact: true })
      .click();
    await expect(
      dialog.getByRole("group", { name: "Languages", exact: true }),
    ).toBeFocused();
    await dialog
      .getByRole("button", { name: "Add language", exact: true })
      .click();
    const language = dialog.getByRole("group", {
      name: "Language 2",
      exact: true,
    });
    await language.getByRole("combobox", { name: /^Language/ }).click();
    await expect(
      page.getByRole("option", { name: "Afar", exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Search languages").fill("Malayalam");
    await expect(
      page.getByRole("option", { name: "Malayalam", exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Search languages").press("Escape");
    await expect(page.getByPlaceholder("Search languages")).not.toBeVisible();
    await expect(dialog).toBeVisible();
    await language.getByRole("combobox", { name: /^Language/ }).click();
    await expect(page.getByPlaceholder("Search languages")).toHaveValue("");
    await expect(
      page.getByRole("option", { name: "Afar", exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Search languages").fill("English");
    await page.getByRole("option", { name: "English", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Update User", exact: true })
      .click();
    await expect(
      language.getByText("Each language can only be added once.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      language.getByRole("combobox", { name: /^Language/ }),
    ).toHaveAttribute("aria-invalid", "true");
    await language.getByRole("combobox", { name: /^Language/ }).click();
    await page.getByPlaceholder("Search languages").fill("Malayalam");
    await page.getByRole("option", { name: "Malayalam", exact: true }).click();
    await expect(page.getByPlaceholder("Search languages")).not.toBeVisible();
    await language.getByRole("combobox", { name: /^Language/ }).click();
    await expect(page.getByPlaceholder("Search languages")).toHaveValue("");
    await expect(
      page.getByRole("option", { name: "Afar", exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Search languages").press("Escape");
    await expect(page.getByPlaceholder("Search languages")).not.toBeVisible();
    await expect(
      dialog.getByText("Each language can only be added once.", {
        exact: true,
      }),
    ).not.toBeVisible();
    await language
      .getByRole("combobox", { name: "Proficiency", exact: true })
      .click();
    await page
      .getByRole("option", { name: "B2 · Upper intermediate", exact: true })
      .click();
    await language
      .getByRole("switch", { name: "Preferred language", exact: true })
      .check();
    await dialog
      .getByRole("textbox", { name: "Registration number", exact: true })
      .fill("REG-UPDATED");
    await dialog
      .getByRole("button", { name: "Add qualification", exact: true })
      .click();
    const secondQualification = dialog.getByRole("group", {
      name: "Qualification 2",
      exact: true,
    });
    await secondQualification
      .getByRole("combobox", { name: /^Degree/ })
      .click();
    await page
      .getByRole("option", { name: degree.display || degree.code, exact: true })
      .click();
    await secondQualification
      .getByRole("textbox", { name: "Issuing authority", exact: true })
      .fill("Additional Council");

    // A failed transport must keep the draft available for a real server retry.
    await page.route(`**/api/v1/users/${username}/`, async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({ status: 500, json: { detail: "Save failed" } });
      } else await route.continue();
    });
    const failed = page.waitForResponse(
      (response) =>
        response.url() === url && response.request().method() === "PUT",
    );
    await dialog
      .getByRole("button", { name: "Update User", exact: true })
      .click();
    expect((await failed).status()).toBe(500);
    await expect(dialog).toBeVisible();
    await expect(
      dialog
        .getByRole("group", { name: "Qualification 1", exact: true })
        .getByRole("textbox", { name: "Registration number", exact: true }),
    ).toHaveValue("REG-UPDATED");
    expect((await readUser()).qualification[0].registration_number).toBe(
      "REG-ORIGINAL",
    );
    await page.unroute(`**/api/v1/users/${username}/`);
    await save();
    await page.reload();
    await expect(
      page.getByRole("region", { name: "Languages", exact: true }),
    ).toContainText("Malayalam");
    const persisted = await readUser();
    expect(persisted.communication).toEqual([
      {
        language: { code: "eng", system: "urn:iso:std:iso:639:-3" },
        preferred: true,
        proficiency: null,
      },
      {
        language: { code: "mal", system: "urn:iso:std:iso:639:-3" },
        preferred: true,
        proficiency: "B2",
      },
    ]);
    expect(persisted.qualification[0]).toMatchObject({
      registration_number: "REG-UPDATED",
      meta,
    });
    expect(persisted.qualification[1]).toMatchObject({
      degree: { code: degree.code, system: degree.system },
      issuer: "Additional Council",
      meta: {},
    });

    // Saved credentials can outlive entries in the selectable degree catalogue.
    await page.route("**/api/v1/users/degrees/", async (route) => {
      const response = await route.fetch();
      const catalogue: Code[] = await response.json();
      await route.fulfill({
        response,
        json: catalogue.filter(
          (entry) =>
            entry.code !== degree.code || entry.system !== degree.system,
        ),
      });
    });
    await page.reload();
    await page
      .getByRole("button", { name: "Edit Personal Information", exact: true })
      .click();
    await expect(
      dialog.getByRole("group", { name: "Personal Information", exact: true }),
    ).toBeFocused();
    const existingDegree = dialog
      .getByRole("group", { name: "Qualification 1", exact: true })
      .getByRole("combobox", { name: /^Degree/ });
    await expect(existingDegree).toContainText(degree.code);
    await existingDegree.click();
    await page.getByRole("option", { name: degree.code, exact: true }).click();
    await expect(existingDegree).toContainText(degree.code);

    const historicalQualification = dialog.getByRole("group", {
      name: "Qualification 1",
      exact: true,
    });
    await historicalQualification
      .getByRole("textbox", { name: "Issuing authority", exact: true })
      .fill("Updated Council");
    await dialog
      .getByRole("button", { name: "Update User", exact: true })
      .click();
    await expect(existingDegree).toHaveAttribute("aria-invalid", "true");
    await expect(
      historicalQualification.getByText(
        "This degree is no longer available. Choose an available degree or remove this qualification before updating qualifications.",
        { exact: true },
      ),
    ).toBeVisible();
    expect((await readUser()).qualification).toEqual(persisted.qualification);

    // Reopening must refresh the cached editor before an unrelated edit is saved.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    const refreshedPhone = `+919${faker.string.numeric(9)}`;
    const externalUpdate = await request.put(url, {
      headers,
      data: {
        first_name: persisted.first_name,
        last_name: "Refreshed Test",
        phone_number: refreshedPhone,
        gender: "female",
      },
    });
    expect(externalUpdate.ok(), await externalUpdate.text()).toBe(true);
    await page.getByRole("button", { name: "Edit User", exact: true }).click();
    await expect(
      dialog.getByRole("textbox", { name: /^Last Name/ }),
    ).toHaveValue("Refreshed Test");
    await dialog
      .getByRole("textbox", { name: /^First Name/ })
      .fill("Updated Profile");
    await save();
    const afterNameEdit = await readUser();
    expect(afterNameEdit).toMatchObject({
      first_name: "Updated Profile",
      last_name: "Refreshed Test",
      phone_number: refreshedPhone,
      gender: "female",
    });
    expect(afterNameEdit.communication).toEqual(persisted.communication);
    expect(afterNameEdit.qualification).toEqual(persisted.qualification);
    await page.unroute("**/api/v1/users/degrees/");

    await page.getByRole("button", { name: "Edit User", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Remove language 2", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove language 1", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove qualification 1", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove qualification 1", exact: true })
      .click();
    // Closing the sheet discards an unsaved removal.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Edit User", exact: true }).click();
    await expect(
      dialog.getByRole("group", { name: "Language 2", exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Remove language 2", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove language 1", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove qualification 1", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove qualification 1", exact: true })
      .click();
    await save();
    await page.reload();
    await expect(
      page.getByText("No qualifications added.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No communication languages added.", { exact: true }),
    ).toBeVisible();
    const cleared = await readUser();
    expect(cleared.communication).toEqual([]);
    expect(cleared.qualification).toEqual([]);
  } finally {
    const deleted = await request.delete(url, { headers });
    expect(deleted.ok()).toBe(true);
  }
});

test.describe("Profile access", () => {
  test.use({ storageState: "tests/.auth/staff.json" });

  test("keeps another user's profile read only and account settings private", async ({
    page,
  }) => {
    await page.goto("/users/care-doctor");
    await expect(page.locator("#username")).toHaveText("care-doctor");
    await expect(
      page.getByRole("button", { name: "Edit User", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Change Avatar", exact: true }),
    ).toHaveCount(0);
    for (const tab of ["Security", "Preferences", "Theme"]) {
      await expect(
        page.getByRole("tab", { name: tab, exact: true }),
      ).toHaveCount(0);
      await page.goto(`/users/care-doctor/${tab.toLowerCase()}`);
      await expect(
        page.getByRole("heading", { name: "Page Not Found", exact: true }),
      ).toBeVisible();
    }
  });
});
