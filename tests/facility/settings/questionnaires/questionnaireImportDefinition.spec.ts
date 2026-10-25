import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("full questionnaire import lets authors choose a new slug before creating a draft", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const stamp = Date.now();
  const title = `Imported review ${stamp}`;
  const slug = `imported-review-${stamp}`;
  const posts: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/v1/questionnaire/"
    ) {
      posts.push(request.postDataJSON());
    }
  });

  await page.goto(`/facility/${facilityId}/settings/questionnaires`);
  await page.getByRole("button", { name: "Import Questionnaire" }).click();
  const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "questionnaire.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        id: "source-form",
        title,
        slug: "original-export-slug",
        status: "active",
        subject_type: "encounter",
        auth_context: "facility",
        facility: "source-facility",
        code: null,
        version: 1,
        questions: [
          {
            id: "original-question",
            link_id: "score",
            type: "integer",
            text: "Symptom score",
          },
        ],
        actions: [{ condition: "q_score > 5", instructions: [] }],
      }),
    ),
  });
  await test.step("Review and correct the slug without submitting", async () => {
    await expect(dialog.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "original-export-slug",
    );
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
      title,
    );
    expect(posts).toHaveLength(0);
    await dialog.getByRole("textbox", { name: "Slug" }).fill("bad slug!");
    await dialog.getByRole("button", { name: "Import", exact: true }).click();
    await expect(dialog.getByRole("textbox", { name: "Slug" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(posts).toHaveLength(0);
    await dialog.getByRole("textbox", { name: "Slug" }).fill(slug);
  });
  await test.step("Create the imported draft with the chosen identity and current scope", async () => {
    await dialog.getByRole("button", { name: "Import", exact: true }).click();
    await expectToast(page, "Questionnaire Imported Successfully");
    await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      title,
      slug,
      status: "draft",
      facility: facilityId,
      auth_context: "facility",
      version: "1",
    });
    const questions = posts[0].questions as { id: string; link_id: string }[];
    expect(questions[0].id).not.toBe("original-question");
    expect(questions[0].link_id).not.toBe("score");
    expect(posts[0].actions).toEqual([
      { condition: `q_${questions[0].link_id} > 5`, instructions: [] },
    ]);
    await expect(page.getByRole("textbox", { name: "Slug" })).toHaveValue(slug);
    await expect(
      page.getByText("Symptom score", { exact: true }),
    ).toBeVisible();
  });
});
