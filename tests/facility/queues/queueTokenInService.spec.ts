import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue token in-service flow", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    // Enable the token-generation-in-patient-home feature for this spec only.
    // The flag is a build-time env (REACT_ENABLE_TOKEN_GENERATION_IN_PATIENT_HOME)
    // that careConfig also honors as a localStorage override at runtime, so we
    // set it here instead of building the whole app with it enabled.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "REACT_ENABLE_TOKEN_GENERATION_IN_PATIENT_HOME",
        "true",
      );
    });
  });

  test("opens a queued token on patient home via token_id and marks it In-service", async ({
    page,
  }) => {
    let queueId: string | null = null;
    let tokenId: string | null = null;

    await test.step("Generate a token for a patient from their home page", async () => {
      await page.goto(`/facility/${facilityId}/encounters`);
      await page
        .getByRole("link", { name: /patient home/i })
        .first()
        .click();

      await page.getByRole("button", { name: /generate token/i }).click();

      // Select the practitioner resource by picking the first available
      // department, then the first practitioner under it. The selector renders
      // in a popover (or drawer on mobile); departments are options while
      // practitioners are rows whose name carries a title attribute.
      await page.getByRole("combobox").first().click();
      const resourceSelector = page
        .locator("[data-radix-popper-content-wrapper], [role='dialog']")
        .last();
      await resourceSelector.getByRole("option").first().click();
      await resourceSelector.locator("span[title]").first().click();

      await page.getByRole("button", { name: /create token/i }).click();
      await expectToast(page, /token created successfully/i);

      // On success the app redirects to patient home with the new token's
      // queue_id and token_id in the URL.
      await page.waitForURL(/[?&]token_id=/);
      const params = new URL(page.url()).searchParams;
      queueId = params.get("queue_id");
      tokenId = params.get("token_id");
      expect(queueId).toBeTruthy();
      expect(tokenId).toBeTruthy();
    });

    await test.step("Open the token from the queue and land on patient home", async () => {
      // This is the exact route the queue's "Encounter" action links to; it
      // redirects to patient home with the token pre-selected via token_id.
      await page.goto(
        `/facility/${facilityId}/queue/${queueId}/token/${tokenId}`,
      );
      await page.waitForURL(new RegExp(`token_id=${tokenId}`));

      // The matching token is auto-expanded and exposes the in-service action.
      await expect(
        page.getByRole("button", { name: /mark as in-service/i }),
      ).toBeVisible();
    });

    await test.step("Mark the token In-service via the service point selector", async () => {
      await page.getByRole("button", { name: /mark as in-service/i }).click();

      // When the resource has more than one assigned service point, a selector
      // dialog is shown to pick where to serve. With a single service point the
      // app serves immediately without a dialog. Handle both so the test does
      // not depend on how many service points the fixture has.
      const serveDialog = page.getByRole("dialog", { name: /serve token/i });
      const dialogAppeared = await serveDialog
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (dialogAppeared) {
        await serveDialog.getByRole("radio").first().click();
      }

      await expectToast(page, /token has been assigned to service point/i);
    });
  });
});
