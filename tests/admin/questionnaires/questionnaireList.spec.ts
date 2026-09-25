import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaire,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

interface CreateInstanceQuestionnaireOptions {
  title: string;
  status?: "active" | "draft" | "retired";
}

async function createInstanceQuestionnaire({
  title,
  status = "active",
}: CreateInstanceQuestionnaireOptions) {
  const slug = `qv2-list-${Date.now()}-${faker.string.alphanumeric(6).toLowerCase()}`;
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title,
      slug,
      version: "1.0",
      status,
      subject_type: "encounter",
      auth_context: "instance",
      questions: [],
    }),
  });

  if (!res.ok) {
    throw new Error(`questionnaire create: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; title: string; slug: string };
}

async function createPaginatedAdminSet(prefix: string, count: number) {
  for (let i = 1; i <= count; i++) {
    await createInstanceQuestionnaire({
      title: `${prefix} ${String(i).padStart(2, "0")}`,
      status: "active",
    });
  }
}

test.describe("Questionnaire v2 list", () => {
  test("search + status filter + no-match work, and direct URL state hydrates correctly", async ({
    page,
  }) => {
    const draftTitle = `QV2 List Draft ${Date.now()}`;
    const query = encodeURIComponent(draftTitle);
    let draftSlug = "";

    await test.step("Create one draft questionnaire in instance scope", async () => {
      const created = await createInstanceQuestionnaire({
        title: draftTitle,
        status: "draft",
      });
      draftSlug = created.slug;
    });

    await test.step("Open list by direct URL with search + status and verify filters are available", async () => {
      await page.goto(`/admin/questionnaires?status=draft&search=${query}`);

      await expect(
        page.getByRole("heading", { name: "Questionnaires" }),
      ).toBeVisible();
      await expect(
        page.getByRole("radiogroup", { name: "Status" }),
      ).toBeVisible();
      await expect(page.getByRole("radio", { name: "Active" })).toBeVisible();
      await expect(page.getByRole("radio", { name: "Draft" })).toBeVisible();
      await expect(page.getByRole("radio", { name: "Retired" })).toBeVisible();

      await expect(page.getByRole("radio", { name: "Draft" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(page.getByPlaceholder("Search Questionnaires")).toHaveValue(
        draftTitle,
      );
      const row = page
        .locator('[data-slot="table-row"]')
        .filter({ hasText: draftTitle });
      await expect(row).toContainText(draftTitle);
      // The row also surfaces the slug as a badge — a real column, not
      // just an internal identifier only visible on the detail page.
      await expect(row).toContainText(draftSlug);
    });

    await test.step("No-match search shows empty state", async () => {
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill(faker.string.uuid());
      await expect(page.getByText("No questionnaires found")).toBeVisible();
    });

    await test.step("Reload preserves URL-driven filter state", async () => {
      await page.getByPlaceholder("Search Questionnaires").fill(draftTitle);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        draftTitle,
      );
      await page.reload();
      await expect(page.getByRole("radio", { name: "Draft" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(page.getByPlaceholder("Search Questionnaires")).toHaveValue(
        draftTitle,
      );
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        draftTitle,
      );
    });
  });

  test("pagination works after search filtering, including direct page URL", async ({
    page,
  }) => {
    const prefix = `QV2 Admin Pagination ${Date.now()}`;
    const query = encodeURIComponent(prefix);
    const rows = page.locator('[data-slot="table-body"] tr');

    await test.step("Create 16 active questionnaires under a unique prefix", async () => {
      await createPaginatedAdminSet(prefix, 16);
    });

    await test.step("Search-scoped list paginates to page 2", async () => {
      await page.goto(`/admin/questionnaires?status=active&search=${query}`);
      await expect(rows).toHaveCount(15);
      await expect(page.locator("#page-2")).toBeVisible();
      await page.locator("#page-2").click();
      await expect(page).toHaveURL(/page=2/);
      await expect(rows).toHaveCount(1);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        prefix,
      );
    });

    await test.step("Direct URL to page 2 hydrates the same filter and page state", async () => {
      await page.goto(
        `/admin/questionnaires?status=active&search=${query}&page=2`,
      );
      await expect(page.getByRole("radio", { name: "Active" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(page.getByPlaceholder("Search Questionnaires")).toHaveValue(
        prefix,
      );
      await expect(rows).toHaveCount(1);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        prefix,
      );
    });
  });

  test("can still create from the list page", async ({ page }) => {
    const title = `QV2 List Draft UI ${Date.now()}`;

    await createQuestionnaire(page, {
      basePath: "/admin/questionnaires",
      title,
      status: "Draft",
    });
  });
});
