import { expect, test } from "@playwright/test";
import { getQuestionnaireIdBySlug } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/nurse.json" });

/**
 * Observed care-nurse reality (verified against the live backend before
 * writing these assertions): the nurse carries no questionnaire
 * organization grants, so the facility questionnaire list is EMPTY (objects
 * are hidden, not 403'd), the instance list shows only the org-tagged
 * bundled "heigh-weight" questionnaire, and canWrite is false everywhere —
 * no Create/Save/Edit Questions/Clone affordances, disabled identity
 * fields, while Preview and Download JSON stay available.
 */
test.describe("Questionnaire v2 permissions (nurse)", () => {
  test("facility list is empty with no create affordance", async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);

    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    // Unauthorized questionnaires are hidden, not errored.
    await expect(page.getByText("No questionnaires found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).not.toBeVisible();
  });

  test("admin list shows only readable questionnaires and no create button", async ({
    page,
  }) => {
    await page.goto("/admin/questionnaires");

    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    // The bundled org-tagged questionnaire is readable…
    await expect(page.locator('[data-slot="table-body"]')).toContainText(
      "heigh-weight",
    );
    // …but instance questionnaires without a matching org grant are hidden.
    await expect(page.locator('[data-slot="table-body"]')).not.toContainText(
      "e2e-kitchen-sink-instance",
    );
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).not.toBeVisible();
  });

  test("detail page renders read-only for a readable questionnaire", async ({
    page,
  }) => {
    const id = await getQuestionnaireIdBySlug("heigh-weight");
    await page.goto(`/admin/questionnaires/${id}`);

    await test.step("No write affordances", async () => {
      await expect(page.getByRole("textbox", { name: "Title" })).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Save Questionnaire" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Edit Questions" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Clone Questionnaire" }),
      ).not.toBeVisible();
      const statusGroup = page.getByRole("radiogroup", { name: "Status" });
      await expect(
        statusGroup.getByRole("radio", { name: "Draft" }),
      ).toBeDisabled();
    });

    await test.step("Read affordances stay available", async () => {
      await expect(
        page.getByRole("button", { name: "Preview questionnaire" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Download JSON" }),
      ).toBeVisible();
    });
  });

  test("builder deep-link offers no save for a read-only user", async ({
    page,
  }) => {
    const id = await getQuestionnaireIdBySlug("heigh-weight");
    await page.goto(`/admin/questionnaires/${id}/edit`);

    // The editor renders (deep link isn't blocked) but there is nothing to
    // save with.
    await expect(
      page.getByRole("textbox", { name: "Question Title" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).not.toBeVisible();
  });

  test("create page deep-link shows the permission-denied state", async ({
    page,
  }) => {
    await page.goto("/admin/questionnaires/new");

    await expect(
      page.getByText("You do not have permission to perform this action"),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Title" }),
    ).not.toBeVisible();
  });
});
