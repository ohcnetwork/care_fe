import {
  APIRequestContext,
  BrowserContext,
  expect,
  Page,
  Response,
  test,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

const staffStorageState = "tests/.auth/staff.json";
const preferencePath = "/api/v1/users/set_preferences/";
const preferenceRoute = `**${preferencePath}`;
const initialAppearance = {
  theme: "light",
  font_size: "default",
  high_contrast: false,
  motion: "allow",
};

interface StoredUser {
  username: string;
  preferences: Record<string, unknown>;
}

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

function authHeaders(state: StorageState) {
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((item) => item.name === "care_access_token")?.value;
  if (!token)
    throw new Error("Authenticated storage state has no access token");
  return { Authorization: `Bearer ${token}` };
}

async function currentUser(
  request: APIRequestContext,
  headers: Record<string, string>,
): Promise<StoredUser> {
  const response = await request.get(
    `${getApiUrl()}/api/v1/users/getcurrentuser/`,
    { headers },
  );
  expect(response.status()).toBe(200);
  return response.json();
}

async function saveAppearance(
  request: APIRequestContext,
  headers: Record<string, string>,
  value: unknown,
) {
  const response = await request.post(`${getApiUrl()}${preferencePath}`, {
    headers,
    data: { preference: "appearance", version: "0.0.1", value },
  });
  expect(response.status()).toBe(201);
}

function isAppearanceResponse(response: Response) {
  return (
    new URL(response.url()).pathname === preferencePath &&
    response.request().method() === "POST" &&
    response.request().postDataJSON()?.preference === "appearance"
  );
}

async function chooseRadio(page: Page, group: string, name: string) {
  const radioGroup = page.getByRole("radiogroup", { name: group, exact: true });
  const radio = radioGroup.getByRole("radio", { name, exact: true });
  // The visible preview card is the label for its visually hidden radio.
  await radioGroup
    .locator("label")
    .filter({
      has: page.getByRole("radio", { name, exact: true }),
    })
    .click();
  await expect(radio).toBeChecked();
}

async function openTheme(page: Page) {
  await page.goto("/users/care-staff");
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect(
    page.getByRole("radiogroup", { name: "Theme", exact: true }),
  ).toBeVisible();
}

// All three editing cases use the same real staff account and must not race.
test.describe.configure({ mode: "default" });

test.describe("Own account appearance preferences", () => {
  test.use({ storageState: staffStorageState });

  let headers: Record<string, string>;
  let originalPreferences: Record<string, unknown> | undefined;

  test.beforeEach(async ({ context, request }) => {
    originalPreferences = undefined;
    headers = authHeaders(await context.storageState());
    const user = await currentUser(request, headers);
    expect(user.username).toBe("care-staff");
    originalPreferences = user.preferences;
    await saveAppearance(request, headers, initialAppearance);
  });

  test.afterEach(async ({ page, request }) => {
    // Unmount the writer before restoring only the preference this suite owns.
    try {
      await page.goto("about:blank");
      await page.unrouteAll({ behavior: "wait" });
    } finally {
      if (originalPreferences) {
        await saveAppearance(
          request,
          headers,
          originalPreferences.appearance ?? {},
        );
      }
    }
  });

  test("saves the latest rapid edits and applies them after reload and navigation", async ({
    page,
    request,
  }) => {
    await openTheme(page);
    const themeTab = page.getByRole("tab", { name: "Theme", exact: true });
    const defaultPrimary = await themeTab.evaluate(
      (element) => getComputedStyle(element).color,
    );
    let releaseSave!: () => void;
    const saveHeld = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    let heldFirstSave = false;
    await page.route(preferenceRoute, async (route) => {
      if (route.request().method() === "POST" && !heldFirstSave) {
        heldFirstSave = true;
        await saveHeld;
      }
      await route.continue();
    });

    const finalAppearance = {
      theme: "light-tritanopia",
      font_size: "large",
      high_contrast: true,
      motion: "reduce",
    };
    const saved = page.waitForResponse(
      (response) =>
        isAppearanceResponse(response) &&
        response.request().postDataJSON().value.theme === "light-tritanopia" &&
        response.request().postDataJSON().value.font_size === "large" &&
        response.request().postDataJSON().value.high_contrast === true &&
        response.request().postDataJSON().value.motion === "reduce",
    );

    try {
      await test.step("Change settings while the first save is in flight", async () => {
        await chooseRadio(
          page,
          "Theme",
          "Light Protanopia & Deuteranopia Difficulty distinguishing reds & greens",
        );
        await expect(themeTab).not.toHaveCSS("color", defaultPrimary);
        const protanopiaPrimary = await themeTab.evaluate(
          (element) => getComputedStyle(element).color,
        );
        await expect(
          page.getByRole("status").filter({ hasText: "Saving..." }),
        ).toBeVisible();
        await chooseRadio(
          page,
          "Theme",
          "Light Tritanopia Difficulty distinguishing blues & greens",
        );
        await expect(themeTab).not.toHaveCSS("color", protanopiaPrimary);
        await expect(themeTab).not.toHaveCSS("color", defaultPrimary);
        const tabs = page.getByRole("tablist", { name: "Manage User" });
        const normalBorder = await tabs.evaluate(
          (element) => getComputedStyle(element).borderBottomColor,
        );
        await page.getByRole("switch", { name: "Increase contrast" }).check();
        await expect(tabs).not.toHaveCSS("border-bottom-color", normalBorder);
        await chooseRadio(
          page,
          "Reduce Motion",
          "Reduce Motion Subtle fades, no movement or scaling",
        );
        const fonts = page.getByRole("radiogroup", { name: "Font Size" });
        await fonts.getByRole("radio", { name: "Default 16px" }).focus();
        await page.keyboard.press("ArrowRight");
        await expect(
          fonts.getByRole("radio", { name: "Large 18px" }),
        ).toBeChecked();
        await expect(page.locator("html")).toHaveCSS("font-size", "18px");
      });
    } finally {
      releaseSave();
    }

    expect((await saved).status()).toBe(201);
    await expect
      .poll(
        async () =>
          (await currentUser(request, headers)).preferences.appearance,
      )
      .toEqual(finalAppearance);
    const persisted = await currentUser(request, headers);
    const unrelated = { ...persisted.preferences };
    delete unrelated.appearance;
    const originalUnrelated = { ...originalPreferences };
    delete originalUnrelated.appearance;
    expect(unrelated).toEqual(originalUnrelated);
    const savedPrimary = await themeTab.evaluate(
      (element) => getComputedStyle(element).color,
    );

    await test.step("Keep the saved appearance across reload and another route", async () => {
      await page.reload();
      await expect(
        page.getByRole("radio", {
          name: "Light Tritanopia Difficulty distinguishing blues & greens",
        }),
      ).toBeChecked();
      await expect(themeTab).toHaveCSS("color", savedPrimary);
      await expect(
        page.getByRole("switch", { name: "Increase contrast" }),
      ).toBeChecked();
      await expect(
        page.getByRole("radio", { name: "Large 18px" }),
      ).toBeChecked();
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: /^Reduced motion enabled$/ }),
      ).toBeVisible();
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      await expect(page.locator("html")).toHaveCSS("font-size", "18px");
    });
  });

  test("retains an unsaved draft after failure and retries a real server save", async ({
    page,
    request,
  }) => {
    await openTheme(page);
    const themeTab = page.getByRole("tab", { name: "Theme", exact: true });
    const defaultPrimary = await themeTab.evaluate(
      (element) => getComputedStyle(element).color,
    );
    let failedOnce = false;
    await page.route(preferenceRoute, async (route) => {
      if (route.request().method() === "POST" && !failedOnce) {
        failedOnce = true;
        await route.fulfill({ status: 500, json: { detail: "Save failed" } });
        return;
      }
      await route.continue();
    });

    await chooseRadio(
      page,
      "Theme",
      "Light Protanopia & Deuteranopia Difficulty distinguishing reds & greens",
    );
    const error = page.getByRole("alert").filter({
      hasText: "Could not save your preferences",
    });
    await expect(error).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(themeTab).not.toHaveCSS("color", defaultPrimary);
    await chooseRadio(page, "Font Size", "Larger 20px");
    await expect(error).toBeVisible();
    expect(
      (await currentUser(request, headers)).preferences.appearance,
    ).toEqual(initialAppearance);

    const saved = page.waitForResponse(isAppearanceResponse);
    await error.getByRole("button", { name: "Retry", exact: true }).click();
    expect((await saved).status()).toBe(201);
    await expect(error).toHaveCount(0);
    await expect
      .poll(
        async () =>
          (await currentUser(request, headers)).preferences.appearance,
      )
      .toEqual({
        ...initialAppearance,
        theme: "light-protanopia",
        font_size: "larger",
      });
    await page.reload();
    await expect(
      page.getByRole("radio", {
        name: "Light Protanopia & Deuteranopia Difficulty distinguishing reds & greens",
      }),
    ).toBeChecked();
    await expect(themeTab).not.toHaveCSS("color", defaultPrimary);
    await expect(
      page.getByRole("radio", { name: "Larger 20px" }),
    ).toBeChecked();
    await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  });

  test("keeps themes light for system and legacy settings while respecting motion preferences", async ({
    page,
    request,
  }) => {
    await page.emulateMedia({
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    await openTheme(page);
    const themes = page.getByRole("radiogroup", { name: "Theme", exact: true });
    await expect(
      themes.getByRole("radio", { name: /^(Dark|System)\b/ }),
    ).toHaveCount(0);
    await expect(
      themes.getByRole("radio", { name: "Light Clean white background" }),
    ).toBeChecked();
    await chooseRadio(
      page,
      "Reduce Motion",
      "Recommended Use system preference Follows your device setting automatically",
    );
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Following system preference — standard motion enabled by your device",
      }),
    ).toBeVisible();

    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Following system preference — reduced motion enabled by your device",
      }),
    ).toBeVisible();

    await chooseRadio(
      page,
      "Reduce Motion",
      "Allow motion Full animation & transition experience",
    );
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(
      page.getByRole("status").filter({ hasText: /^Motion enabled$/ }),
    ).toBeVisible();
    await page.emulateMedia({
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    await chooseRadio(
      page,
      "Reduce Motion",
      "Reduce Motion Subtle fades, no movement or scaling",
    );
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(
      page.getByRole("status").filter({ hasText: /^Reduced motion enabled$/ }),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (await currentUser(request, headers)).preferences.appearance,
      )
      .toEqual({ ...initialAppearance, motion: "reduce" });

    await test.step("Display legacy themes as light without rewriting saved preferences", async () => {
      await page.emulateMedia({ colorScheme: "dark" });
      let hydrationWrites = 0;
      page.on("request", (request) => {
        if (
          new URL(request.url()).pathname === preferencePath &&
          request.method() === "POST"
        ) {
          hydrationWrites++;
        }
      });
      await saveAppearance(request, headers, {});
      await page.reload();
      await expect(
        themes.getByRole("radio", { name: "Light Clean white background" }),
      ).toBeChecked();
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      expect(
        (await currentUser(request, headers)).preferences.appearance,
      ).toEqual({});
      for (const [legacyTheme, visibleChoice] of [
        ["dark", "Light Clean white background"],
        ["system", "Light Clean white background"],
        [
          "dark-protanopia",
          "Light Protanopia & Deuteranopia Difficulty distinguishing reds & greens",
        ],
        [
          "dark-tritanopia",
          "Light Tritanopia Difficulty distinguishing blues & greens",
        ],
      ]) {
        const legacyAppearance = { ...initialAppearance, theme: legacyTheme };
        await saveAppearance(request, headers, legacyAppearance);
        await page.reload();
        await expect(
          themes.getByRole("radio", { name: visibleChoice, exact: true }),
        ).toBeChecked();
        await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
        expect(
          (await currentUser(request, headers)).preferences.appearance,
        ).toEqual(legacyAppearance);
      }
      expect(hydrationWrites).toBe(0);
    });
  });
});

test.describe("Another user's appearance preferences", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("does not expose Theme or change either account when an admin views another profile", async ({
    page,
    context,
    request,
  }) => {
    const adminHeaders = authHeaders(await context.storageState());
    const staffHeaders = authHeaders(
      JSON.parse(await readFile(staffStorageState, "utf-8")) as StorageState,
    );
    const adminBefore = await currentUser(request, adminHeaders);
    const staffBefore = await currentUser(request, staffHeaders);
    expect(adminBefore.username).toBe("admin");
    expect(staffBefore.username).toBe("care-staff");

    for (const profile of [
      "/users/care-staff",
      `/facility/${getFacilityId()}/users/care-staff`,
    ]) {
      await page.goto(profile);
      await expect(
        page.getByRole("tab", { name: "User Information" }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("#username")).toHaveText("care-staff");
      await expect(
        page.getByRole("tab", { name: "Theme", exact: true }),
      ).toHaveCount(0);
      await page.goto(`${profile}/theme`);
      await expect(
        page.getByRole("heading", { name: "Page Not Found" }),
      ).toBeVisible();
      await expect(
        page.getByRole("radiogroup", { name: "Theme", exact: true }),
      ).toHaveCount(0);
    }

    expect((await currentUser(request, adminHeaders)).preferences).toEqual(
      adminBefore.preferences,
    );
    expect((await currentUser(request, staffHeaders)).preferences).toEqual(
      staffBefore.preferences,
    );
  });
});
