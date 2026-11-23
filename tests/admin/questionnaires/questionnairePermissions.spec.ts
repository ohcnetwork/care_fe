import { expect, test } from "@playwright/test";
import {
  createInstanceQuestionnaireViaApi,
  getQuestionnaireIdBySlug,
} from "tests/helper/questionnaireV2";
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
  test(
    "facility list shows only org-granted questionnaires, no create affordance",
    { tag: ["@atomic", "@cap:questionnaire.author.list"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);

      await expect(
        page.getByRole("heading", { name: "Questionnaires" }),
      ).toBeVisible();
      // Both assertions search first: the unfiltered list is paginated, so
      // against a populated instance a granted questionnaire can sit on a
      // later page (a spurious failure) and — worse — an ungranted one is
      // absent from page 1 whatever the permissions are, which would let the
      // negative assertion below pass without proving anything.
      const search = page.getByPlaceholder("Search questionnaires");
      const body = page.locator('[data-slot="table-body"]');

      // The box filters by TITLE; the row carries the slug, which is what the
      // assertions match on.
      // Org-tagged fixture questionnaires are readable…
      await search.fill("E2E Kitchen Sink (Facility)");
      await expect(body).toContainText("e2e-kitchen-sink-facility");

      // …while unauthorized ones are hidden, not errored. Asserted against the
      // page rather than the table body: a search that matches nothing the user
      // may read renders the empty state, so the body locator itself is gone.
      await search.fill("E2E Pagination 001");
      await expect(page.getByText("e2e-pagination-001")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Create Questionnaire" }),
      ).toBeHidden();
    },
  );

  test(
    "admin list is empty with no create button",
    { tag: ["@atomic", "@cap:questionnaire.author.list"] },
    async ({ page }) => {
      // An instance questionnaire of this test's own, granted to no
      // organization: the nurse must not be able to find it.
      const { title: ungrantedTitle } = await createInstanceQuestionnaireViaApi(
        { title: `QV2 Ungranted ${Date.now()}` },
      );
      await page.goto("/admin/questionnaires");

      await expect(
        page.getByRole("heading", { name: "Questionnaires" }),
      ).toBeVisible();
      // The nurse's readable set is facility-scoped (org-tagged fixture
      // questionnaires — see the facility list test); the admin mount lists
      // none of them and instance questionnaires without a matching org grant
      // are hidden, not errored. Both are asserted through searches rather than
      // the unfiltered list, which any instance questionnaire later granted to
      // the nurse's organizations would populate: the kitchen-sink prefix
      // matches the facility fixture (readable on the facility mount) and the
      // ungranted instance fixture.
      const search = page.getByPlaceholder("Search Questionnaires");
      for (const term of ["E2E Kitchen Sink", ungrantedTitle]) {
        await search.fill(term);
        await expect(page.getByText("No questionnaires found")).toBeVisible();
      }
      await expect(
        page.getByRole("button", { name: "Create Questionnaire" }),
      ).toBeHidden();
    },
  );

  test(
    "detail page renders read-only for a readable questionnaire",
    { tag: ["@atomic", "@cap:questionnaire.author.view"] },
    async ({ page }) => {
      const id = await getQuestionnaireIdBySlug("e2e-kitchen-sink-facility");
      await page.goto(`/admin/questionnaires/${id}`);

      await test.step("No write affordances", async () => {
        await expect(
          page.getByRole("textbox", { name: "Title" }),
        ).toBeDisabled();
        await expect(
          page.getByRole("button", { name: "Save Questionnaire" }),
        ).toBeHidden();
        await expect(
          page.getByRole("button", { name: "Edit Questions" }),
        ).toBeHidden();
        await expect(
          page.getByRole("button", { name: "Clone Questionnaire" }),
        ).toBeHidden();
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
    },
  );

  test(
    "builder deep-link offers no save for a read-only user",
    { tag: ["@atomic", "@cap:questionnaire.author.question.edit"] },
    async ({ page }) => {
      const id = await getQuestionnaireIdBySlug("e2e-kitchen-sink-facility");
      await page.goto(`/admin/questionnaires/${id}/edit`);

      // The deep link isn't blocked — the studio renders the questionnaire —
      // but read-only users get the preview, never the edit surface: there is
      // nothing to save through, so an editable inspector would only collect
      // edits that can never be persisted and then prompt about them on the
      // way out.
      await expect(page.getByText("Kitchen Sink").first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Save Changes" }),
      ).toBeHidden();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toBeHidden();
    },
  );

  test(
    "create page deep-link shows the permission-denied state",
    { tag: ["@atomic", "@cap:questionnaire.author.create"] },
    async ({ page }) => {
      await page.goto("/admin/questionnaires/new");

      await expect(
        page.getByText("You do not have permission to perform this action"),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Title" })).toBeHidden();
    },
  );
});
