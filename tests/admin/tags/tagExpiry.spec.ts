import { expect, Page, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function createTagConfigWithExpiry(
  page: Page,
  name: string,
  offset: { days: string; hours?: string },
) {
  await page.getByRole("button", { name: "Add tag config" }).first().click();
  await page.getByRole("textbox", { name: "Display name *" }).fill(name);
  await page.getByRole("switch", { name: "Expire automatically" }).click();
  await page.getByRole("spinbutton", { name: "Days" }).fill(offset.days);
  if (offset.hours) {
    await page.getByRole("spinbutton", { name: "Hours" }).fill(offset.hours);
  }
  await page.getByRole("switch", { name: "Allow changing expiry" }).click();
  await page.getByRole("button", { name: "Create tag config" }).click();
  await expectToast(page, "Tag Config created successfully");
}

test.describe("Tag expiry", () => {
  test("configures expiry on an instance tag config", async ({ page }) => {
    const tagName = `Expiry Tag ${Date.now()}`;
    await page.goto("/admin/tag_config");

    await test.step("Require a duration when expiring automatically", async () => {
      await page.getByRole("button", { name: "Add tag config" }).click();
      await page.getByRole("textbox", { name: "Display name *" }).fill(tagName);
      await page.getByRole("switch", { name: "Expire automatically" }).click();
      await page.getByRole("button", { name: "Create tag config" }).click();
      await expect(
        page.getByText("Enter a duration greater than zero"),
      ).toBeVisible();
    });

    await test.step("Save the expiry rule", async () => {
      await page.getByRole("spinbutton", { name: "Days" }).fill("2");
      await page.getByRole("spinbutton", { name: "Hours" }).fill("6");
      await page.getByRole("switch", { name: "Allow changing expiry" }).click();
      await page.getByRole("button", { name: "Create tag config" }).click();
      await expectToast(page, "Tag Config created successfully");
    });

    await test.step("Show the rule on the tag details page", async () => {
      await page
        .getByRole("textbox", { name: "Search tag configs" })
        .fill(tagName);
      await page
        .getByRole("row", { name: tagName })
        .getByRole("button")
        .click();
      await expect(
        page.getByText(
          "Removed 2 days 6 hours after it is applied; users can change this when applying",
        ),
      ).toBeVisible();
    });

    await test.step("Prefill the rule when editing", async () => {
      await page.getByRole("button", { name: "Edit tag" }).click();
      await expect(
        page.getByRole("switch", { name: "Expire automatically" }),
      ).toBeChecked();
      await expect(page.getByRole("spinbutton", { name: "Days" })).toHaveValue(
        "2",
      );
      await expect(page.getByRole("spinbutton", { name: "Hours" })).toHaveValue(
        "6",
      );
    });
  });

  test("applies a facility tag with a custom expiry to a patient", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const tagName = `Expiry Facility Tag ${Date.now()}`;

    await test.step("Create a facility tag config with a default expiry", async () => {
      await page.goto(`/facility/${facilityId}/settings/tag_config`);
      await createTagConfigWithExpiry(page, tagName, { days: "1" });
    });

    await test.step("Pick a custom expiry while applying the tag", async () => {
      await page.goto(`/facility/${facilityId}/patient/${patientId}`);
      await page
        .locator("#tags")
        .getByRole("button", { name: "Edit", exact: true })
        .click();
      await page.getByPlaceholder("Search tags").fill(tagName);
      await page.getByRole("menuitemcheckbox", { name: tagName }).click();

      await expect(page.getByText(`Set expiry for ${tagName}`)).toBeVisible();
      await expect(page.getByText("Default expiry: 1 day")).toBeVisible();
      const days = page.getByRole("spinbutton", { name: "Days" });
      await expect(days).toHaveValue("1");
      await days.fill("3");
      const setTagsRequest = page.waitForRequest((request) =>
        request.url().includes("/set_facility_tags/"),
      );
      await page.getByRole("button", { name: "Apply tag" }).click();
      expect((await setTagsRequest).postDataJSON().tags).toEqual([
        { tag: expect.any(String), expiry_offset: { days: 3 } },
      ]);
      await expectToast(page, "Tags updated successfully");
    });

    await test.step("Show the expiry on the applied tag", async () => {
      await page.keyboard.press("Escape");
      await expect(
        page.locator('[data-slot="badge"]', { hasText: tagName }).first(),
      ).toHaveAttribute("title", /^Expires on /);
    });
  });
});
