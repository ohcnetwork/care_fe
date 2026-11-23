import { createTagConfigViaUi } from "tests/helper/admin";
import { expectToast } from "tests/helper/ui";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Tag expiry", () => {
  test(
    "configures expiry on an instance tag config",
    { tag: ["@atomic", "@cap:admin.tag.create"] },
    async ({ page }) => {
      const tagName = `Expiry Tag ${Date.now()}`;
      await page.goto("/admin/tag_config");

      await test.step("Require a duration when expiring automatically", async () => {
        await page.getByRole("button", { name: "Add tag config" }).click();
        await page
          .getByRole("textbox", { name: "Display name *" })
          .fill(tagName);
        await page
          .getByRole("switch", { name: "Expire automatically" })
          .click();
        await page.getByRole("button", { name: "Create tag config" }).click();
        await expect(
          page.getByText("Enter a duration greater than zero"),
        ).toBeVisible();
        await page.getByRole("spinbutton", { name: "Days" }).fill("4000");
        await page.getByRole("button", { name: "Create tag config" }).click();
        await expect(
          page.getByText("Expiry can't be longer than 3650 days"),
        ).toBeVisible();
      });

      await test.step("Save the expiry rule", async () => {
        await page.getByRole("spinbutton", { name: "Days" }).fill("2");
        await page.getByRole("spinbutton", { name: "Hours" }).fill("6");
        await page
          .getByRole("switch", { name: "Allow changing expiry" })
          .click();
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
        await expect(
          page.getByRole("spinbutton", { name: "Days" }),
        ).toHaveValue("2");
        await expect(
          page.getByRole("spinbutton", { name: "Hours" }),
        ).toHaveValue("6");
      });
    },
  );

  test(
    "applies a facility tag with a custom expiry to a patient",
    { tag: ["@atomic", "@cap:patient.tags.assign"] },
    async ({ page, facilityId, isolatedPatient }) => {
      // A throwaway patient: tagging the shared fixture patient would leak the
      // tag into every other spec that reads it.
      const { patientId } = isolatedPatient;
      const tagName = `Expiry Facility Tag ${Date.now()}`;

      // Create a facility tag config with a default expiry
      await createTagConfigViaUi(page, {
        name: tagName,
        facilityId,
        expiry: { days: "1", allowChange: true },
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
    },
  );
});
