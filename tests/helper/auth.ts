import { faker } from "@faker-js/faker";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { DEFAULT_DISPOSABLE_USER_PASSWORD } from "tests/helper/user";

/** OTP that development backends accept for every phone number (see `send_otp` in care). */
export const LOCAL_DEV_OTP = "45612";

/** The superuser the setup project signs in as (`tests/.auth/user.json`). */
export const ADMIN_CREDENTIALS: Credentials = {
  username: "admin",
  password: "admin",
};

/** A username and password for the staff sign-in form or the login API. */
export interface Credentials {
  username: string;
  password: string;
}

/** A throwaway user from {@link createDisposableUserViaApi}. */
export interface DisposableApiUser extends Credentials {
  id: string;
}

/** Options for {@link createDisposableUserViaApi}. */
export interface CreateDisposableUserViaApiOptions {
  password?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * True once the URL has left the sign-in page. A predicate, not a regex: the
 * negative-lookahead idiom (`/(?!.*login)/`) matches every URL (the lookahead
 * succeeds at the end of the string), so it would wait for nothing.
 */
export function isSignedInUrl(url: URL): boolean {
  return !url.pathname.startsWith("/login");
}

/** Opens the staff sign-in form unless the page is already on it (e.g. at `/login?redirect=…`). */
async function openSignInForm(page: Page) {
  if (!new URL(page.url()).pathname.startsWith("/login")) {
    await page.goto("/login");
  }
}

async function fillAndSubmitSignInForm(
  page: Page,
  { username, password }: Credentials,
) {
  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

/** Signs in through the staff sign-in form and waits until the app leaves the sign-in page. */
export async function loginViaUi(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await test.step(
    "auth.login",
    async () => {
      await openSignInForm(page);
      await fillAndSubmitSignInForm(page, credentials);
      await page.waitForURL(isSignedInUrl, { timeout: 15000 });
    },
    { box: true },
  );
}

/** Fills and submits the staff sign-in form without waiting for the outcome (for rejected sign-ins). */
export async function submitLoginFormViaUi(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await test.step(
    "auth.login",
    async () => {
      await openSignInForm(page);
      await fillAndSubmitSignInForm(page, credentials);
    },
    { box: true },
  );
}

/** Signs in through the API and returns the token pair, for API calls made as that user. */
export async function loginViaApi({
  username,
  password,
}: Credentials): Promise<{ access: string; refresh: string }> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to sign in as ${username}: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as { access: string; refresh: string };
}

/** Creates a user with no organization roles through the admin API: an account a test can sign in as or edit alone. */
export async function createDisposableUserViaApi(
  options: CreateDisposableUserViaApiOptions = {},
): Promise<DisposableApiUser> {
  const suffix = faker.string.alphanumeric(8).toLowerCase();
  const username = `e2e-user-${suffix}`;
  const password = options.password ?? DEFAULT_DISPOSABLE_USER_PASSWORD;
  const response = await fetch(`${apiBaseUrl()}/api/v1/users/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      username,
      password,
      first_name: options.firstName ?? "E2E",
      last_name: options.lastName ?? suffix,
      email: `${username}@example.test`,
      phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
      gender: "non_binary",
      role_orgs: [],
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create user ${username}: ${response.status} — ${await response.text()}`,
    );
  }
  const { id } = (await response.json()) as { id: string };
  return { id, username, password };
}

/** Opens the phone-number password reset from the sign-in page and requests an OTP (no wait). */
export async function requestPasswordResetOtpViaUi(
  page: Page,
  { phoneNumber }: { phoneNumber: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: /forgot password/i }).click();
  await page.getByText(/reset using phone number/i).click();
  await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
  await page.getByRole("button", { name: /send otp/i }).click();
}

/** Enters the OTP and a new password on the open reset form and submits it (no wait). */
export async function submitPasswordResetOtpViaUi(
  page: Page,
  { otp, newPassword }: { otp: string; newPassword: string },
): Promise<void> {
  await page.locator("#reset_otp").click();
  await page.locator("#reset_otp").pressSequentially(otp);
  await page.getByPlaceholder(/new password/i).fill(newPassword);
  await page.getByPlaceholder(/confirm password/i).fill(newPassword);
  await page.getByRole("button", { name: /^reset password$/i }).click();
}

/** Resets a password with a phone OTP, signed out, and waits for the success toast. */
export async function resetPasswordViaUi(
  page: Page,
  {
    phoneNumber,
    otp,
    newPassword,
  }: { phoneNumber: string; otp: string; newPassword: string },
): Promise<void> {
  await test.step(
    "auth.password-reset",
    async () => {
      await requestPasswordResetOtpViaUi(page, { phoneNumber });
      await expectToast(
        page,
        /if this phone number is registered, you will receive an otp/i,
      );
      await submitPasswordResetOtpViaUi(page, { otp, newPassword });
      await expectToast(page, /password reset successfully/i);
    },
    { box: true },
  );
}

/** Opens the avatar editor from the user profile page that is open. */
export async function openAvatarDialog(page: Page): Promise<Locator> {
  const changeAvatarButton = page.getByRole("button", {
    name: /change avatar/i,
  });
  await changeAvatarButton.click();

  const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Picks an image in the open avatar editor and crops it. */
export async function uploadAndCropAvatarImage(
  page: Page,
  imagePath: string,
): Promise<void> {
  const fileInput = page.locator("input[type='file']").first();
  await fileInput.setInputFiles(imagePath);

  // Wait for crop button to be enabled (indicates image is loaded)
  const cropButton = page.getByRole("button", { name: "Crop" });
  await expect(cropButton).toBeEnabled({ timeout: 10000 });
  await cropButton.click();

  await expect(
    page
      .getByRole("region", { name: "Notifications alt+T" })
      .getByText(/cropped successfully/i),
  ).toBeVisible({ timeout: 10000 });
}

/** Saves the cropped image as `username`'s avatar and waits for the upload to succeed. */
export async function saveAvatar(page: Page, username: string): Promise<void> {
  const uploadButton = page.getByRole("button", {
    name: "Upload",
    exact: true,
  });
  const uploadResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        `/api/v1/users/${username}/profile_picture/` &&
      response.request().method() === "POST",
  );
  await uploadButton.click();
  expect((await uploadResponse).ok()).toBe(true);

  // Wait for upload to complete by checking dialog closes
  const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
}

/** Uploads `imagePath` as the avatar of `username`, from that user's open profile page. */
export async function uploadAvatarViaUi(
  page: Page,
  { username, imagePath }: { username: string; imagePath: string },
): Promise<void> {
  await test.step(
    "profile.avatar.upload",
    async () => {
      await openAvatarDialog(page);
      await uploadAndCropAvatarImage(page, imagePath);
      await saveAvatar(page, username);
    },
    { box: true },
  );
}

/** Deletes the avatar of `username`, from that user's open profile page. */
export async function deleteAvatarViaUi(
  page: Page,
  { username }: { username: string },
): Promise<void> {
  await test.step(
    "profile.avatar.delete",
    async () => {
      const dialog = await openAvatarDialog(page);
      const deleteButton = dialog.getByRole("button", { name: "Delete" });

      // Check if delete button is visible before clicking
      const isVisible = await deleteButton.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();

      const deleteResponse = page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`/api/v1/users/${username}/profile_picture/`) &&
          response.request().method() === "DELETE",
        { timeout: 5000 },
      );

      await deleteButton.click();

      const response = await deleteResponse;
      expect(response.status()).toBe(204);

      // Verify dialog closes after deletion
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    },
    { box: true },
  );
}
