import { expect, test } from "@playwright/test";

test.describe("Login CAPTCHA flow", () => {
  test("shows ALTCHA after captchaRequired, resets it on a failed retry, and re-enables submit once re-verified", async ({
    page,
  }) => {
    let loginAttempt = 0;

    await test.step("Mock the ALTCHA challenge endpoint", async () => {
      await page.route("**/api/v1/auth/captcha/challenge/", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          // A widget in "test" mode (see below) never solves this for real,
          // so the exact challenge parameters don't matter here.
          body: JSON.stringify({
            parameters: {
              algorithm: "SHA-256",
              cost: 1,
              keyLength: 32,
              keyPrefix: "00",
              nonce: "00",
              salt: "00",
            },
            signature: "mocked",
          }),
        }),
      );
    });

    await test.step("Mock the login endpoint: first attempt requires captcha, subsequent attempts are rejected until a fresh altcha payload is present", async () => {
      await page.route("**/api/v1/auth/login/", async (route) => {
        loginAttempt += 1;
        const body = route.request().postDataJSON() as { altcha?: string };

        if (loginAttempt === 1) {
          await route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              detail: "Too Many Requests Provide Captcha",
              code: "captchaRequired",
              status: "429",
            }),
          });
          return;
        }

        if (!body.altcha) {
          throw new Error(
            "Login was submitted without an altcha payload attached",
          );
        }

        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "No active account found with the given credentials",
            code: "no_active_account",
          }),
        });
      });
    });

    await page.goto("/login");
    await page.getByRole("textbox", { name: /username/i }).fill("someuser");
    await page.getByLabel(/password/i).fill("wrongpassword");

    await test.step("First submit triggers captchaRequired and mounts the widget", async () => {
      await page.getByRole("button", { name: /login/i }).click();
      await expect(page.locator("altcha-widget")).toBeVisible();
    });

    const altchaState = page.locator("altcha-widget .altcha");

    await test.step("Widget auto-solves the (trivial, cost=1) mocked challenge and reaches a verified state", async () => {
      await expect(altchaState).toHaveAttribute("data-state", "verified", {
        timeout: 10000,
      });
    });

    const submitButton = page.getByRole("button", { name: /login/i });

    await test.step("Second submit is rejected by the backend (bad credentials), which resets the payload and disables submit until re-verified", async () => {
      await submitButton.click();
      await expect(submitButton).toBeDisabled();
    });

    await test.step("Submit re-enables once the widget re-verifies, and the retried login includes a fresh altcha payload", async () => {
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
    });
  });
});
