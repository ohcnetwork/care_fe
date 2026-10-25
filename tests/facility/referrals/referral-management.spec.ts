import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { createReferralFixture } from "tests/helper/referrals";

test.use({ storageState: "tests/.auth/user.json" });

test("coordinates a referral with persisted status, team, response, and conversation", async ({
  page,
  request,
}) => {
  test.slow();
  const fixture = await createReferralFixture(request);
  const title = `Updated ${fixture.title}`;
  const note = `Clinical coordination ${fixture.suffix}`;
  const responses = page.getByRole("region", {
    name: "Responses",
    exact: true,
  });
  await page.goto(fixture.path);

  await test.step("Update details, status and assigned team", async () => {
    await page
      .getByRole("button", { name: "Referral actions", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Edit referral", exact: true })
      .click();
    const editDialog = page.getByRole("dialog", {
      name: "Edit referral",
      exact: true,
    });
    await editDialog
      .getByRole("textbox", { name: "Referral title", exact: true })
      .fill(title);
    await editDialog
      .getByRole("textbox", { name: "Note", exact: true })
      .fill(note);
    await editDialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(editDialog).not.toBeVisible();
    await page
      .getByRole("button", { name: "Manage assignees", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Manage assignees",
      exact: true,
    });
    await dialog
      .getByRole("combobox", { name: "Find team members in", exact: true })
      .click();
    await page
      .getByRole("option", { name: "All accessible users", exact: true })
      .click();
    await dialog
      .getByRole("combobox", { name: "Select Member", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Search", exact: true })
      .fill("admin");
    await page
      .getByRole("option")
      .filter({ has: page.getByText("admin", { exact: true }) })
      .click();
    await dialog
      .getByRole("combobox", { name: "Select Role", exact: true })
      .click();
    await page.getByPlaceholder("Select Role", { exact: true }).fill("Doctor");
    await page
      .getByRole("option")
      .filter({ has: page.getByText("Doctor", { exact: true }) })
      .click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await page
      .getByRole("button", { name: "Start referral", exact: true })
      .click();
    await expect(
      page
        .getByRole("list", { name: "Referral progress", exact: true })
        .getByRole("listitem")
        .filter({ hasText: "In progress" }),
    ).toHaveAttribute("aria-current", "step");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(note, { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Referral progress", exact: true })
        .getByRole("listitem")
        .filter({ hasText: "In progress" }),
    ).toHaveAttribute("aria-current", "step");
    const assignedMember = page
      .getByRole("region", { name: "Assigned to", exact: true })
      .getByRole("listitem")
      .filter({ hasText: "Admin User" });
    await expect(assignedMember).toBeVisible();
    await expect(assignedMember).toContainText("Doctor");
  });

  await test.step("A stale completion preserves a concurrent cancellation until explicitly reopened", async () => {
    await page
      .getByRole("button", { name: "Referral actions", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Complete referral", exact: true })
      .click();
    const confirmation = page.getByRole("alertdialog", {
      name: "Complete referral",
      exact: true,
    });
    await expect(confirmation).toBeVisible();
    // Another coordinator cancels after this doctor opens the confirmation.
    const cancelled = await request.patch(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders(), data: { status: "cancelled" } },
    );
    expect(cancelled.ok(), await cancelled.text()).toBeTruthy();
    await confirmation
      .getByRole("button", { name: "Complete referral", exact: true })
      .click();
    await expect(confirmation.getByRole("alert")).toContainText(
      "The referral status changed. Review its latest status and try again.",
    );
    const latest = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(latest.ok()).toBeTruthy();
    expect(await latest.json()).toMatchObject({ status: "cancelled" });
    await confirmation
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Referral actions", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Reopen referral", exact: true })
      .click();
    const reopen = page.getByRole("alertdialog", {
      name: "Reopen referral",
      exact: true,
    });
    await reopen
      .getByRole("button", { name: "Reopen referral", exact: true })
      .click();
    await expect(reopen).not.toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("list", { name: "Referral progress", exact: true })
        .getByRole("listitem")
        .filter({ hasText: "In progress" }),
    ).toHaveAttribute("aria-current", "step");
  });

  await test.step("Reconcile a lost response, retry completion once, and retain its error snapshot", async () => {
    const detailUrl = page.url();
    const responsePageUrl = new URL(detailUrl);
    responsePageUrl.pathname = `${fixture.path}/respond`;
    await responses
      .getByRole("button", { name: "Respond", exact: true })
      .click();
    await expect(page).toHaveURL(responsePageUrl.href);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const responseForm = page.getByRole("region", {
      name: "Respond",
      exact: true,
    });
    await expect(
      responseForm.getByText(fixture.responseTitle, { exact: true }),
    ).toBeVisible();
    await expect(
      responseForm.getByRole("combobox", { name: "Form", exact: true }),
    ).toHaveCount(0);
    const recommendation = `Continue follow-up ${fixture.suffix}`;
    await questionBlock(page, fixture.responseLabel)
      .getByRole("textbox")
      .fill(recommendation);
    const referralUrl = (url: URL) =>
      url.pathname === `/api/v1/referral/${fixture.referralId}/`;
    const responseUrl = (url: URL) =>
      url.pathname ===
      `/api/v1/referral/${fixture.referralId}/questionnaire_responses/`;
    let responsePosts = 0;
    let savedResponseId: string;
    await page.route(responseUrl, async (route) => {
      if (route.request().method() === "POST") {
        responsePosts++;
        if (responsePosts === 1) {
          // Let the real backend save the reply, then lose only its network
          // response. Recovery must read that saved reply, never resubmit it.
          const saved = await route.fetch();
          expect(saved.ok(), await saved.text()).toBeTruthy();
          savedResponseId = (await saved.json()).id;
          await route.abort("failed");
          return;
        }
      }
      await route.continue();
    });
    let interruptedCompletion = false;
    await page.route(referralUrl, async (route) => {
      if (
        route.request().method() === "PATCH" &&
        route.request().postDataJSON().status === "completed" &&
        !interruptedCompletion
      ) {
        interruptedCompletion = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });
    await page
      .getByRole("button", { name: "Save response and complete", exact: true })
      .click();
    const checkSaved = page.getByRole("button", {
      name: "Check saved responses",
      exact: true,
    });
    await expect(checkSaved).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save response", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Save response and complete",
        exact: true,
      }),
    ).toBeDisabled();
    expect(responsePosts).toBe(1);
    expect(interruptedCompletion).toBe(false);
    await page
      .getByRole("button", { name: "Close", exact: true })
      .filter({ hasText: "Close" })
      .click();
    await expect(page).toHaveURL(detailUrl);
    await responses
      .getByRole("button", { name: "Add response", exact: true })
      .click();
    await expect(page).toHaveURL(responsePageUrl.href);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(checkSaved).toBeVisible();
    await expect(page.getByText(recommendation, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save response", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Save response and complete",
        exact: true,
      }),
    ).toBeDisabled();
    expect(responsePosts).toBe(1);
    await checkSaved.click();
    await expect(
      page.getByText(
        "Your response is saved. Complete the referral to finish; retrying will not submit the response again.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect.poll(() => interruptedCompletion).toBe(true);
    await expect(
      page.getByRole("button", { name: "Complete referral", exact: true }),
    ).toBeEnabled();
    const savedAfterFailure = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(savedAfterFailure.ok()).toBeTruthy();
    const pending = (await savedAfterFailure.json()) as {
      status: string;
      questionnaire_responses: { id: string; questionnaire_type: string }[];
    };
    expect(pending.status).toBe("in_progress");
    const persistedResponses = pending.questionnaire_responses.filter(
      (item) => item.questionnaire_type === "response",
    );
    expect(persistedResponses).toHaveLength(1);
    expect(persistedResponses[0].id).toBe(savedResponseId!);
    await page.unroute(referralUrl);
    await page
      .getByRole("button", { name: "Complete referral", exact: true })
      .click();
    await expect(page).toHaveURL(detailUrl);
    await page.reload();
    const savedAfterRetry = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(savedAfterRetry.ok()).toBeTruthy();
    const completed = (await savedAfterRetry.json()) as typeof pending;
    expect(completed.status).toBe("completed");
    expect(
      completed.questionnaire_responses
        .filter((item) => item.questionnaire_type === "response")
        .map((item) => item.id),
    ).toEqual([persistedResponses[0].id]);
    expect(responsePosts).toBe(1);
    await page.unroute(responseUrl);
    const response = page.getByRole("region", {
      name: fixture.responseTitle,
      exact: true,
    });
    await expect(
      response.getByText(recommendation, { exact: true }),
    ).toBeVisible();
    await response
      .getByRole("button", { name: "Form actions", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Mark entered in error", exact: true })
      .click();
    const confirmation = page.getByRole("dialog", {
      name: "Mark entered in error",
      exact: true,
    });
    await confirmation
      .getByRole("button", { name: "Mark entered in error", exact: true })
      .click();
    await expect(confirmation).not.toBeVisible();
    await page.reload();
    await expect(response).toContainText("Entered in Error");
    await response.locator("details").locator("summary").click();
    await expect(
      response.getByText(recommendation, { exact: true }),
    ).toBeVisible();
    await expect(
      response.getByRole("button", {
        name: "Form actions",
        exact: true,
      }),
    ).toHaveCount(0);
  });

  await test.step("Create a conversation, edit an own message and retain its history", async () => {
    const conversation = page.getByRole("region", {
      name: "Discussion",
      exact: true,
    });
    const messages = conversation.getByRole("list", {
      name: "Discussion messages",
      exact: true,
    });
    const original = `Referral team update ${fixture.suffix}`;
    const edited = `Updated referral team message ${fixture.suffix}`;
    await conversation
      .getByRole("textbox", { name: "Message", exact: true })
      .fill(original);
    await conversation
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(messages.getByText(original, { exact: true })).toBeVisible();
    await page.reload();
    const message = messages
      .getByRole("listitem")
      .filter({ hasText: original });
    await message
      .getByRole("button", { name: "Edit message", exact: true })
      .click();
    await conversation
      .getByRole("textbox", { name: "Edit message", exact: true })
      .fill(edited);
    await conversation
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      conversation.getByRole("textbox", { name: "Edit message", exact: true }),
    ).not.toBeVisible();
    await expect(messages.getByText(edited, { exact: true })).toBeVisible();
    await page.reload();
    const updated = messages.getByRole("listitem").filter({ hasText: edited });
    await expect(updated.getByText(edited, { exact: true })).toBeVisible();
    await updated.locator("summary").click();
    await expect(updated.getByText(original, { exact: true })).toBeVisible();
    await conversation
      .getByRole("button", { name: "Rename discussion", exact: true })
      .click();
    const rename = page.getByRole("dialog", {
      name: "Rename discussion",
      exact: true,
    });
    const conversationTitle = `Specialist discussion ${fixture.suffix}`;
    await rename
      .getByRole("textbox", { name: "Discussion title", exact: true })
      .fill(conversationTitle);
    await rename
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(rename).not.toBeVisible();
    await page.reload();
    await expect(
      conversation.getByText(conversationTitle, { exact: true }),
    ).toBeVisible();
    // The shared notes UI must use the referral adapter rather than creating
    // a patient discussion that only appears linked in client state.
    const savedReferral = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(savedReferral.ok()).toBeTruthy();
    expect(await savedReferral.json()).toMatchObject({
      thread: expect.any(String),
      thread_title: conversationTitle,
    });
    const savedMessages = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/notes/`,
      { headers: adminApiHeaders() },
    );
    expect(savedMessages.ok()).toBeTruthy();
    expect(await savedMessages.json()).toMatchObject({
      count: 1,
      results: [
        {
          message: edited,
          message_history: {
            history: expect.arrayContaining([
              expect.objectContaining({ message: original }),
            ]),
          },
        },
      ],
    });
  });

  await test.step("Follow an authorized reverse reference and return to this referral", async () => {
    const references = page.getByRole("region", {
      name: "Referenced by",
      exact: true,
    });
    const initialReferences = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/v1/referral/${fixture.referralId}/referenced_by/` &&
        response.request().method() === "GET",
    );
    await page.reload();
    const emptyReferences = await initialReferences;
    expect(emptyReferences.ok()).toBeTruthy();
    expect(await emptyReferences.json()).toMatchObject({
      count: 0,
      results: [],
    });
    await expect(references).toHaveCount(0);
    const related = await createReferralFixture(request);
    const response = await request.post(
      `${apiBaseUrl()}/api/v1/referral/${related.referralId}/resources/`,
      {
        headers: adminApiHeaders(),
        data: {
          resource_type: "referral",
          resource_id: fixture.referralId,
          attachment_type: "source",
        },
      },
    );
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    await page.reload();
    await references
      .getByRole("link")
      .filter({ hasText: related.title })
      .click();
    await expect(
      page.getByRole("heading", { name: related.title, exact: true, level: 1 }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(fixture.path);
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await references
      .getByRole("link")
      .filter({ hasText: related.title })
      .click();
    await expect(
      page.getByRole("heading", { name: related.title, exact: true, level: 1 }),
    ).toBeVisible();
    const relatedUrl = page.url();
    const shared = page
      .getByRole("region", { name: "Referral request", exact: true })
      .getByRole("region", { name: "Shared records", exact: true });
    const referencedReferral = shared.getByRole("region", {
      name: title,
      exact: true,
    });
    await expect(
      referencedReferral.getByText(note, { exact: true }),
    ).toBeVisible();
    await expect(
      referencedReferral.getByText("Completed", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(relatedUrl);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
