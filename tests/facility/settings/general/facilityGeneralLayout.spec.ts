import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { FacilityRead } from "@/types/facility/facility";
import type { CurrentUserRead } from "@/types/user/user";

// These layout tests use isolated API fixtures, not a live healthcare backend.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Facility general settings layout", () => {
  let facility: FacilityRead;
  let user: CurrentUserRead;

  test.beforeEach(async ({ page }) => {
    const id = faker.string.uuid();
    facility = {
      id,
      name: faker.company.name(),
      facility_type: "Private Hospital",
      description: "",
      address: "12 Example Road\nExample City",
      phone_number: "+919876543210",
      latitude: "12.3",
      longitude: "76.6",
      is_public: true,
      features: [2],
      geo_organization: {
        id: faker.string.uuid(),
        name: "Kerala",
        org_type: "govt",
        metadata: { govt_org_type: "state" },
        level_cache: 1,
        has_children: false,
        active: true,
        created_at: "",
        updated_at: "",
        permissions: [],
      },
      permissions: [],
      root_org_permissions: ["can_update_facility"],
      child_org_permissions: [],
      print_templates: [],
      instance_discount_codes: [],
      instance_discount_monetary_components: [],
      instance_informational_codes: [],
      instance_tax_codes: [],
      instance_tax_monetary_components: [],
      invoice_number_expression: "",
      discount_codes: [],
      discount_monetary_components: [],
      discount_configuration: null,
      patient_instance_identifier_configs: [],
      patient_facility_identifier_configs: [],
    };
    user = {
      id: faker.string.uuid(),
      username: faker.internet.username(),
      first_name: "Layout",
      last_name: "Test",
      phone_number: "",
      user_type: "administrator",
      gender: "male",
      last_login: "",
      profile_picture_url: "",
      mfa_enabled: false,
      deleted: false,
      is_service_account: false,
      communication: [],
      qualification: [],
      email: "",
      flags: [],
      permissions: [],
      is_superuser: true,
      facilities: [{ id, name: facility.name }],
      organizations: [],
      pf_endpoint: null,
      pf_p256dh: null,
      pf_auth: null,
      preferences: {},
    };
    await page.addInitScript(() => {
      localStorage.setItem("care_access_token", "facility-layout-test");
      localStorage.setItem("i18nextLng", "en");
    });
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({ json: user });
      } else if (path === `/api/v1/facility/${facility.id}/`) {
        await route.fulfill({ json: facility });
      } else if (path === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (route.request().method() === "GET") {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else {
        throw new Error(`Unexpected API mutation in layout test: ${path}`);
      }
    });
  });

  test("uses compact button icons without shrinking touch targets", async ({
    page,
  }) => {
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const name of ["Add cover photo", "Configurations"]) {
        const button = page.getByRole("button", { name, exact: true });
        await expect(button).toHaveCSS("height", width < 768 ? "48px" : "40px");
        await expect(button.locator("svg")).toHaveCSS("width", "16px");
        await expect(button.locator("svg")).toHaveCSS("height", "16px");
        await expect(button.locator("svg")).toHaveCSS("stroke-width", "2px");
      }
    }
  });

  test("keeps shared ghost actions undecorated and underlines General text actions locally", async ({
    page,
  }) => {
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();

    const sections = page.locator('[data-cy="facility-forms"]');
    const actions = sections.getByRole("button").or(sections.getByRole("link"));
    await expect(actions).toHaveCount(2);
    for (const action of await actions.all()) {
      await expect(action).toHaveAttribute("data-variant", "ghost");
      // No local opt-out: "none" must come from the shared ghost variant.
      await expect(action).not.toHaveClass(/\bno-underline\b/);
      await expect(action).toHaveCSS("text-decoration-line", "none");
      await action.hover();
      await expect(action).toHaveCSS("text-decoration-line", "none");
      await action.focus();
      await expect(action).toHaveCSS("text-decoration-line", "none");
    }

    for (const action of [
      page.getByRole("button", { name: "Add cover photo" }),
      page.getByRole("link", { name: "Show on Map" }),
      page.getByRole("link", { name: "+91 98765 43210" }),
    ]) {
      await expect(action).toHaveCSS("text-decoration-line", "underline");
    }
  });

  test("groups the cover, details, and forms and keeps existing actions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();
    const header = page.locator('[data-cy="facility-settings-header"]');
    await expect(
      header.getByRole("heading", { name: facility.name }),
    ).toBeVisible();
    // The geo organization is shown in the details card, not the header.
    await expect(header.getByText(/^Part of/)).toHaveCount(0);
    await test.info().attach("desktop-empty-cover", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await header.getByRole("button", { name: "Add cover photo" }).click();
    const coverDialog = page.getByRole("dialog");
    await expect(coverDialog).toContainText("16:9");
    await coverDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();

    await header.getByRole("button", { name: "Configurations" }).click();
    // Print templates have their own settings page, not a menu item.
    await expect(
      page.getByRole("menuitem", { name: "Print Templates" }),
    ).toHaveCount(0);
    await page.getByRole("menuitem", { name: "Edit Facility Details" }).click();
    const editSheet = page.getByRole("dialog", {
      name: "Edit Facility",
      exact: true,
    });
    await expect(editSheet).toBeVisible();
    // Description is a markdown editor, not a plain textarea.
    const descriptionEditor = editSheet.getByRole("textbox", {
      name: "Description",
    });
    await expect(descriptionEditor).toHaveAttribute("contenteditable", "true");
    await expect(descriptionEditor).toHaveText("");
    await descriptionEditor.fill("Open all day");
    await expect(descriptionEditor).toHaveText("Open all day");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(editSheet).toBeHidden();

    const forms = page.locator('[data-cy="facility-forms"]');
    await expect(
      forms.getByRole("button", { name: "Submit forms" }),
    ).toBeVisible();
    await expect(
      forms.getByRole("link", { name: "Responses" }),
    ).toHaveAttribute("href", `/facility/${facility.id}/settings/responses`);
    const detailsBox = await page
      .getByRole("region", { name: "Facility Details" })
      .boundingBox();
    const formsBox = await forms.boundingBox();
    expect(detailsBox).not.toBeNull();
    expect(formsBox).not.toBeNull();
    expect(formsBox!.x).toBeGreaterThan(detailsBox!.x + detailsBox!.width);
    expect(Math.abs(formsBox!.y - detailsBox!.y)).toBeLessThan(1);
    await expect(page.getByRole("region", { name: "Quick links" })).toHaveCount(
      0,
    );

    const details = page.getByRole("region", { name: "Facility Details" });
    const mapLink = details.getByRole("link", { name: "Show on Map" });
    await expect(mapLink).toHaveAttribute("aria-label", "Show on Map");
    await expect(mapLink).toHaveAttribute("href", /12\.3.*76\.6/);
    await expect(mapLink).toHaveAttribute("target", "_blank");
    const phoneLink = details.getByRole("link", {
      name: "Call +91 98765 43210",
    });
    await expect(phoneLink).toHaveText("+91 98765 43210");
    await expect(phoneLink).toHaveAttribute("href", "tel:+919876543210");
    // Address, area and contact links form one condensed block: no
    // label/value rows, no features list, no empty description section.
    await expect(details.locator("dl")).toHaveCount(0);
    await expect(details.getByText("Features")).toHaveCount(0);
    await expect(
      details.locator('[data-cy="facility-description"]'),
    ).toHaveCount(0);
    const contact = details.locator('[data-cy="facility-contact"]');
    await expect(contact.getByText("Kerala", { exact: true })).toBeVisible();
    const valueStarts = await contact.evaluate((block) => {
      const textStart = (element: Element | null | undefined) => {
        const text = [...(element?.childNodes ?? [])].find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!text) return Number.NaN;
        const range = document.createRange();
        range.selectNodeContents(text);
        return range.getBoundingClientRect().left;
      };
      const [address, area] = block.querySelectorAll("p");
      const [phone, map] = block.querySelectorAll("a");
      return {
        address: textStart(address),
        area: textStart(area),
        phoneIcon: phone.querySelector("svg")!.getBoundingClientRect().left,
        phoneTop: phone.getBoundingClientRect().top,
        mapTop: map.getBoundingClientRect().top,
      };
    });
    expect(Math.abs(valueStarts.area - valueStarts.address)).toBeLessThan(1);
    expect(Math.abs(valueStarts.phoneIcon - valueStarts.address)).toBeLessThan(
      1,
    );
    // Phone and map links share one row.
    expect(Math.abs(valueStarts.mapTop - valueStarts.phoneTop)).toBeLessThan(1);

    // Delete is not a page-level action: it sits last in the Configurations
    // menu, set apart by a separator.
    await expect(
      page.locator('[data-cy="facility-delete-section"]'),
    ).toHaveCount(0);
    await header.getByRole("button", { name: "Configurations" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("separator")).toHaveCount(1);
    const deleteItem = menu.getByRole("menuitem", { name: "Delete Facility" });
    await expect(deleteItem).toHaveAttribute("data-variant", "destructive");
    await deleteItem.click();
    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete Facility",
    });
    await expect(deleteDialog).toBeVisible();
    await expect(
      deleteDialog.getByRole("button", {
        name: "Delete Facility",
        exact: true,
      }),
    ).toBeDisabled();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`keeps critical confirmation spacing and shadows consistent in ${theme} mode`, async ({
      page,
    }) => {
      user.preferences = { appearance: { theme } };
      if (theme === "dark") {
        facility.name = `${faker.company.name()} ${faker.string.alphanumeric(80)}`;
      }
      await page.goto(`/facility/${facility.id}/settings/general`);
      await expect(page.locator("#app-loading")).toBeHidden();
      const configurations = page.getByRole("button", {
        name: "Configurations",
      });
      const openDeleteDialog = async () => {
        await configurations.click();
        await page.getByRole("menuitem", { name: "Delete Facility" }).click();
      };
      await openDeleteDialog();

      const dialog = page.getByRole("alertdialog", { name: "Delete Facility" });
      const input = dialog.getByRole("textbox", {
        name: /To confirm, please type/,
      });
      const confirm = dialog.getByRole("button", {
        name: "Delete Facility",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(input).toBeFocused();
      await expect(confirm).toBeDisabled();
      await expect(confirm).toHaveAttribute("data-variant", "destructive");
      await expect(confirm).toHaveCSS("text-shadow", "none");

      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 768, height: 1000 },
        { width: 390, height: 844 },
        { width: 320, height: 568 },
        { width: 640, height: 360 },
      ]) {
        await page.setViewportSize(viewport);
        await expect(dialog).toHaveCSS(
          "max-height",
          `${viewport.height - 32}px`,
        );
        const padding = viewport.width >= 768 ? "24px" : "16px";
        const header = dialog.locator('[data-slot="alert-dialog-header"]');
        const footer = dialog.locator('[data-slot="alert-dialog-footer"]');
        await expect(header).toHaveCSS("padding-left", padding);
        await expect(footer).toHaveCSS("padding-left", padding);
        await expect
          .poll(() =>
            input.evaluate((element) => {
              const popup = element.closest('[role="alertdialog"]')!;
              return Math.round(
                element.getBoundingClientRect().left -
                  popup.getBoundingClientRect().left,
              );
            }),
          )
          .toBe(parseInt(padding));
        const bounds = await dialog.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            overflow: element.scrollWidth - element.clientWidth,
          };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(15);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width - 15);
        expect(bounds.top).toBeGreaterThanOrEqual(15);
        expect(bounds.bottom).toBeLessThanOrEqual(viewport.height - 15);
        expect(bounds.overflow).toBe(0);
        await confirm.scrollIntoViewIfNeeded();
        await expect(confirm).toBeInViewport();
        if (viewport.width === 1440 || viewport.width === 320) {
          await test.info().attach(`confirmation-${theme}-${viewport.width}`, {
            body: await dialog.screenshot(),
            contentType: "image/png",
          });
        }
      }

      await input.fill(`Delete ${facility.name}`);
      await expect(confirm).toBeEnabled();
      await expect(confirm).toHaveCSS("text-shadow", "none");
      await expect
        .poll(() =>
          confirm.evaluate((element) => getComputedStyle(element).boxShadow),
        )
        .not.toContain("inset");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toBeHidden();
      await openDeleteDialog();
      await expect(input).toHaveValue("");
      await input.fill(`Delete ${facility.name} incorrect`);
      await expect(confirm).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(configurations).toBeFocused();
    });
  }

  test("loading skeleton shares the card corner radius", async ({ page }) => {
    let releaseFacility!: () => void;
    const facilityHeld = new Promise<void>((resolve) => {
      releaseFacility = resolve;
    });
    await page.route(`**/api/v1/facility/${facility.id}/`, async (route) => {
      await facilityHeld;
      await route.fulfill({ json: facility });
    });

    await page.goto(`/facility/${facility.id}/settings/general`);
    const skeleton = page.getByRole("status").filter({ hasText: "Loading" });
    await expect(skeleton).toBeVisible();
    const skeletonRadii = await skeleton.evaluate((status) => {
      const [cover, grid] = [...status.children].filter(
        (child) => !child.classList.contains("sr-only"),
      );
      return [cover, ...grid.children].map(
        (block) => getComputedStyle(block).borderTopLeftRadius,
      );
    });
    expect(skeletonRadii).toHaveLength(3);

    releaseFacility();
    await expect(skeleton).toBeHidden();
    const cardRadius = await page
      .locator('[data-cy="facility-forms"] [data-slot="card"]')
      .evaluate((card) => getComputedStyle(card).borderTopLeftRadius);
    expect(skeletonRadii).toEqual([cardRadius, cardRadius, cardRadius]);
  });

  test("keeps the compact banner and General page width stable while cropping uploads at 16:9", async ({
    page,
  }) => {
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();
    const banner = page.locator('[data-cy="facility-cover"]');
    const general = page.locator('[data-cy="facility-general-page"]');
    const widths = [1440, 768, 390, 320];
    const emptySizes = new Map<number, { width: number; height: number }>();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(banner).toBeVisible();
      emptySizes.set(
        width,
        await banner.evaluate((element) => {
          const { width, height } = element.getBoundingClientRect();
          return { width, height };
        }),
      );
      await expect
        .poll(() =>
          general.evaluate((element) => element.getBoundingClientRect().width),
        )
        .toBeLessThanOrEqual(1024);
      if (width === 1440) {
        await expect
          .poll(() =>
            general.evaluate(
              (element) => element.getBoundingClientRect().width,
            ),
          )
          .toBe(1024);
      }
    }
    facility.read_cover_image_url = "/__facility-layout-cover.png";
    await page.route("**/__facility-layout-cover.png", (route) =>
      route.fulfill({
        path: "tests/fixtures/images/test-image.jpg",
        contentType: "image/jpeg",
      }),
    );
    await page.reload();
    await expect(page.locator("#app-loading")).toBeHidden();
    const cover = page.locator('[data-cy="facility-cover-image"]');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(cover).toBeVisible();
      await expect
        .poll(() =>
          banner.evaluate((element) => {
            const { width, height } = element.getBoundingClientRect();
            return { width, height };
          }),
        )
        .toEqual(emptySizes.get(width));
      await expect(cover).toHaveCSS("object-fit", "cover");
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
      if (width === 1440 || width === 390) {
        await test.info().attach(`cover-${width}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      }
    }
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();
    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image.jpg");
    await page.getByRole("button", { name: "Crop", exact: true }).click();
    const cropped = page.getByRole("img", { name: "Cropped preview" });
    await expect(cropped).toBeVisible();
    await expect
      .poll(() =>
        cropped.evaluate(
          (image: HTMLImageElement) => image.naturalWidth / image.naturalHeight,
        ),
      )
      .toBeCloseTo(16 / 9, 2);
  });

  test("renders the description as full-width markdown below the contact block", async ({
    page,
  }) => {
    facility.description = "Open **24 hours**\n\n- Casualty\n- Pharmacy";
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();

    const details = page.getByRole("region", { name: "Facility Details" });
    const description = details.locator('[data-cy="facility-description"]');
    await expect(
      description.getByRole("heading", { name: "Description" }),
    ).toBeVisible();
    await expect(description.locator("strong")).toHaveText("24 hours");
    await expect(description.getByRole("listitem")).toHaveCount(2);

    const contactBox = await details
      .locator('[data-cy="facility-contact"]')
      .boundingBox();
    const descriptionBox = await description.boundingBox();
    expect(contactBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(Math.abs(descriptionBox!.x - contactBox!.x)).toBeLessThan(1);
    expect(Math.abs(descriptionBox!.width - contactBox!.width)).toBeLessThan(1);
    expect(descriptionBox!.y).toBeGreaterThanOrEqual(
      contactBox!.y + contactBox!.height,
    );
  });

  test("read-only users cannot edit covers, details, or delete the facility", async ({
    page,
  }) => {
    user.is_superuser = false;
    facility.root_org_permissions = [];
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();
    await expect(
      page
        .locator('[data-cy="facility-settings-header"]')
        .getByRole("heading", { name: facility.name }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /cover photo/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Configurations" }),
    ).toHaveCount(0);
    await expect(
      page
        .locator('[data-cy="facility-forms"]')
        .getByRole("link", { name: "Responses" }),
    ).toBeVisible();
  });

  test("facility editors can update without deleting and use the selected theme", async ({
    page,
  }) => {
    user.is_superuser = false;
    user.preferences = {
      appearance: {
        theme: "light-tritanopia",
        high_contrast: true,
        font_size: "large",
      },
    };
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(page.locator("#app-loading")).toBeHidden();
    const header = page.locator('[data-cy="facility-settings-header"]');
    const addCover = header.getByRole("button", { name: "Add cover photo" });
    await expect(addCover).toBeVisible();
    await expect(addCover).toHaveAttribute("data-variant", "ghost");
    await expect(addCover).toHaveCSS("text-decoration-line", "underline");
    const configurations = header.getByRole("button", {
      name: "Configurations",
    });
    await expect(configurations).toBeVisible();
    await expect(configurations).toHaveAttribute("data-variant", "outline");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "tritanopia",
    );
    const themeColors = await configurations.evaluate((button) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--background)";
      button.appendChild(probe);
      const result = {
        button: getComputedStyle(button).backgroundColor,
        background: getComputedStyle(probe).backgroundColor,
      };
      probe.remove();
      return result;
    });
    expect(themeColors.button).toBe(themeColors.background);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(390);
    await test.info().attach("mobile-accessibility-theme", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await addCover.click();
    const coverDialog = page.getByRole("dialog");
    await expect(coverDialog).toContainText("16:9");
    await coverDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(coverDialog).toBeHidden();
    await configurations.click();
    const edit = page.getByRole("menuitem", { name: "Edit Facility Details" });
    await expect(edit.locator("svg")).toHaveClass(/lucide-square-pen/);
    await expect(
      page.getByRole("menuitem", { name: "Delete Facility" }),
    ).toHaveCount(0);
    await edit.click();
    await expect(
      page.getByRole("dialog", { name: "Edit Facility", exact: true }),
    ).toBeVisible();
  });
});
