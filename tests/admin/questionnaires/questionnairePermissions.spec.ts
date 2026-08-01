import { expect, test } from "@playwright/test";
import { getQuestionnaireIdBySlug } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/nurse.json" });

/**
 * Observed care-nurse reality (verified against a freshly seeded backend —
 * migrate + default fixtures + the questionnaire E2E fixture script): the
 * nurse reads exactly the facility questionnaires org-tagged to General
 * Medicine (the fixture script's tag_orgs set: kitchen-sink-facility, the
 * subject-* trio, e2e-units). Untagged facility questionnaires and
 * instance questionnaires without a matching org grant are hidden, not
 * 403'd. canWrite is false everywhere — no Create/Save/Edit
 * Questions/Clone affordances, disabled identity fields, while Preview and
 * Download JSON stay available.
 */
test.describe("Questionnaire v2 permissions (nurse)", () => {
  test("facility list shows only org-granted questionnaires, no create affordance", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);

    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    // Org-tagged fixture questionnaires are readable…
    await expect(page.locator('[data-slot="table-body"]')).toContainText(
      "e2e-kitchen-sink-facility",
    );
    // …while unauthorized ones are hidden, not errored.
    await expect(page.locator('[data-slot="table-body"]')).not.toContainText(
      "e2e-pagination-001",
    );
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).not.toBeVisible();
  });

  test("admin list is empty with no create button", async ({ page }) => {
    await page.goto("/admin/questionnaires");

    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    // The nurse's readable set is facility-scoped (org-tagged fixture
    // questionnaires — see the facility list test); the admin mount lists
    // none of them and instance questionnaires without a matching org grant
    // are hidden, not errored.
    await expect(page.getByText("No questionnaires found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).not.toBeVisible();
  });

  test("detail page renders read-only for a readable questionnaire", async ({
    page,
  }) => {
    const id = await getQuestionnaireIdBySlug("e2e-kitchen-sink-facility");
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
    const id = await getQuestionnaireIdBySlug("e2e-kitchen-sink-facility");
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
