import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// The backend's SlugType accepts 5–50 characters. Keep this contract
// independent of the frontend schema so a changed bound cannot bless itself.

test.use({ storageState: "tests/.auth/user.json" });

/** Counts POST requests to the questionnaire create endpoint. */
function trackCreateRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/api\/v1\/questionnaire\/$/.test(new URL(request.url()).pathname)
    ) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe("Questionnaire v2 create form validation", () => {
  test("an empty title blocks the save with field errors", async ({ page }) => {
    const facilityId = getFacilityId();
    const posts = trackCreateRequests(page);

    await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
    await page.getByRole("button", { name: "Save Questionnaire" }).click();

    await expect(page.getByText("This field is required")).toBeVisible();
    await expect(page).toHaveURL(/\/questionnaires\/new$/);
    expect(posts).toHaveLength(0);
  });

  test("slug bounds and format are enforced", async ({ page }) => {
    const facilityId = getFacilityId();
    const posts = trackCreateRequests(page);
    const title = `QV2 Slug Rules ${Date.now()} ${"x".repeat(60)}`;
    const slugInput = page.getByRole("textbox", { name: "Slug" });

    await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);

    await test.step("Typing a title auto-generates a slug", async () => {
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await expect(slugInput).not.toHaveValue("");
      const generated = await slugInput.inputValue();
      expect(generated).toHaveLength(50);
      expect(generated).toMatch(/^[-\w]+$/);
    });

    for (const length of [4, 51]) {
      await test.step(`A ${length}-character slug fails the length rule`, async () => {
        await slugInput.fill("a".repeat(length));
        await page.getByRole("button", { name: "Save Questionnaire" }).click();
        await expect(
          page.getByText(
            "Must be atleast 5 characters and atmost 50 characters",
          ),
        ).toBeVisible();
        expect(posts).toHaveLength(0);
      });
    }

    await test.step("Invalid characters fail the format rule", async () => {
      await slugInput.fill("bad slug!");
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      // The hint text also shows the format sentence, so expect two matches
      // (description + error) once the rule fires.
      await expect(
        page.getByText(
          "Slug must only contain letters, numbers, underscores, and hyphens",
        ),
      ).toHaveCount(2);
      await expect(page).toHaveURL(/\/questionnaires\/new$/);
      expect(posts).toHaveLength(0);
    });
  });
});
