import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";

import type { FacilityRead } from "@/types/facility/facility";
import type { PrintTemplate } from "@/types/facility/printTemplate";
import type { CurrentUserRead } from "@/types/user/user";

// These tests use isolated API fixtures, so they can start from any saved
// print templates (including legacy data the page can no longer create) and
// assert exactly what is sent to the facility API.
test.use({ storageState: { cookies: [], origins: [] } });

const DOCUMENT_GROUPS = {
  Billing: ["Invoice", "Multi Invoice", "Charge Items", "Payment Receipt"],
  Appointments: ["Appointment", "Appointments List"],
  Clinical: [
    "Prescription",
    "Medication Administration",
    "Diagnostic Report",
    "Questionnaire Response Logs",
    "Resource Letter",
  ],
  "Pharmacy & Inventory": [
    "Dispense Order",
    "Medication Return",
    "Request Order",
    "Delivery Order",
  ],
};
const DOCUMENT_TYPES = Object.values(DOCUMENT_GROUPS).flat();
const UNSAVED_CHANGES = "You have unsaved changes. Leave without saving?";

function row(page: Page, name: string) {
  return page.getByRole("listitem", { name, exact: true });
}

function sheet(page: Page, name: string) {
  return page.getByRole("dialog", { name: `${name} Template`, exact: true });
}

async function choose(page: Page, select: Locator, option: string) {
  await select.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.describe("Print templates (isolated API)", () => {
  let facility: FacilityRead;
  let user: CurrentUserRead;
  let saved: PrintTemplate[][];
  let holdUpdate: Promise<void>;
  let failUpdate: string | undefined;

  test.beforeEach(async ({ page }) => {
    saved = [];
    holdUpdate = Promise.resolve();
    failUpdate = undefined;
    const id = faker.string.uuid();
    facility = {
      id,
      name: faker.company.name(),
      facility_type: "Private Hospital",
      description: "",
      address: "12 Example Road",
      phone_number: "+919876543210",
      latitude: "12.3",
      longitude: "76.6",
      is_public: true,
      features: [],
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
      first_name: "Print",
      last_name: "Admin",
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
      localStorage.setItem("care_access_token", "print-templates-test");
      localStorage.setItem("i18nextLng", "en");
    });
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({ json: user });
      } else if (path === `/api/v1/facility/${facility.id}/`) {
        if (request.method() === "PUT") {
          const { print_templates } = request.postDataJSON();
          saved.push(print_templates);
          await holdUpdate;
          if (failUpdate) {
            await route.fulfill({ status: 500, json: { detail: failUpdate } });
            return;
          }
          facility = { ...facility, print_templates };
        }
        await route.fulfill({ json: facility });
      } else if (path === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (request.method() === "GET") {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else {
        throw new Error(`Unexpected API mutation: ${path}`);
      }
    });
  });

  async function openPage(page: Page) {
    await page.goto(`/facility/${facility.id}/settings/print-templates`);
    await expect(
      page.getByRole("heading", { name: "Print Templates", level: 1 }),
    ).toBeVisible();
  }

  test("lists every print type once, grouped, with no identifier to edit", async ({
    page,
  }) => {
    await test.step("Open the page from the settings sidebar", async () => {
      await page.goto(`/facility/${facility.id}/settings/general`);
      await page
        .getByRole("link", { name: "Print Templates", exact: true })
        .click();
      await expect(page).toHaveURL(
        `/facility/${facility.id}/settings/print-templates`,
      );
      await expect(
        page.getByRole("heading", { name: "Print Templates", level: 1 }),
      ).toBeVisible();
    });

    await test.step("Show the default template as not set up", async () => {
      const defaults = page.getByRole("region", { name: "Default Template" });
      await expect(row(page, "Default")).toContainText(
        "Not set up. Documents print with the standard layout.",
      );
      await expect(defaults.getByRole("button")).toHaveText(["Customize"]);
      await expect(
        defaults.getByRole("button", { name: "Customize Default template" }),
      ).toBeVisible();
    });

    await test.step("List each document once in its group", async () => {
      for (const [group, names] of Object.entries(DOCUMENT_GROUPS)) {
        const region = page.getByRole("region", { name: group, exact: true });
        await expect(region.getByRole("listitem")).toHaveCount(names.length);
        for (const name of names) {
          await expect(
            region.getByRole("listitem", { name, exact: true }),
          ).toContainText("Uses the standard layout");
        }
      }
      await expect(page.getByRole("region").getByRole("listitem")).toHaveCount(
        DOCUMENT_TYPES.length + 1,
      );
      for (const name of DOCUMENT_TYPES) {
        await expect(
          row(page, name).getByRole("button", {
            name: `Customize ${name} template`,
          }),
        ).toBeVisible();
      }
      await expect(page.getByText("Custom", { exact: true })).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: "Unrecognized Templates" }),
      ).toHaveCount(0);
    });

    await test.step("Offer no field to change a template's type", async () => {
      const lists = page.getByRole("region");
      await expect(lists.getByRole("combobox")).toHaveCount(0);
      await expect(lists.getByRole("textbox")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Customize Invoice template" })
        .click();
      const invoice = sheet(page, "Invoice");
      await expect(invoice).toBeVisible();
      // The only choices are the page settings, never the print type.
      await expect(invoice.getByRole("combobox")).toHaveText([
        "Default (A4)",
        "Document default",
      ]);
      await expect(invoice.getByText("Template Identifier")).toHaveCount(0);
    });
  });

  test("sets up the default template that documents fall back to", async ({
    page,
  }) => {
    const logoUrl = faker.image.url();
    const watermark = faker.word.noun().toUpperCase();
    await openPage(page);
    await page
      .getByRole("button", { name: "Customize Default template" })
      .click();
    const defaults = sheet(page, "Default");
    await expect(defaults).toContainText(
      "Used for every document that doesn't have its own template.",
    );
    // A new template has nothing to reset yet.
    await expect(
      defaults.getByRole("button", { name: "Remove Template" }),
    ).toHaveCount(0);

    await test.step("Fill the page settings", async () => {
      await choose(page, defaults.getByLabel("Page Size"), "A5");
      await choose(page, defaults.getByLabel("Orientation"), "Landscape");
      await defaults.getByLabel("Top").fill("12");
      for (const side of ["Right", "Bottom", "Left"]) {
        await expect(defaults.getByLabel(side)).toHaveValue("");
        await expect(defaults.getByLabel(side)).toHaveAttribute(
          "placeholder",
          "10",
        );
      }
    });

    await test.step("Show image sizes only once an image is set", async () => {
      const logo = defaults.getByRole("group", { name: "Logo" });
      await expect(logo.getByLabel("Width (px)")).toHaveCount(0);
      await logo.getByLabel("Image URL").fill(logoUrl);
      await expect(logo.getByLabel("Width (px)")).toBeVisible();
      await choose(page, logo.getByLabel("Alignment"), "Center");

      const header = defaults.getByRole("group", { name: "Header Image" });
      await header.getByLabel("Image URL").fill(faker.image.url());
      await expect(header.getByLabel("Height (px)")).toBeVisible();
      await header.getByLabel("Image URL").fill("");
      await expect(header.getByLabel("Height (px)")).toHaveCount(0);
    });

    await test.step("Turn on the watermark and auto print", async () => {
      await expect(defaults.getByLabel("Watermark Text")).toHaveCount(0);
      await defaults.getByRole("switch", { name: "Enable Watermark" }).click();
      await defaults.getByLabel("Watermark Text").fill(watermark);
      await defaults.getByLabel("Opacity (0–1)").fill("0.2");
      await expect(defaults.getByLabel("Rotation (°)")).toHaveAttribute(
        "placeholder",
        "-30",
      );
      await defaults.getByRole("switch", { name: "Auto Print" }).click();
    });

    await test.step("Save only the settings that were set", async () => {
      await defaults.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByText("Print templates updated successfully"),
      ).toBeVisible();
      await expect(defaults).toBeHidden();
      expect(saved).toEqual([
        [
          {
            slug: "default",
            page: {
              size: "A5",
              orientation: "landscape",
              margin: { top: 12, right: 10, bottom: 10, left: 10 },
            },
            branding: { logo: { url: logoUrl, alignment: "center" } },
            watermark: { enabled: true, text: watermark, opacity: 0.2 },
            print_setup: { auto_print: true },
          },
        ],
      ]);
    });

    await test.step("Documents now use the default template", async () => {
      await expect(row(page, "Default")).toContainText(
        "A5 · Landscape · Custom Margins · Logo · Watermark · Auto Print",
      );
      await expect(
        page.getByRole("button", { name: "Edit Default template" }),
      ).toBeVisible();
      for (const name of DOCUMENT_TYPES) {
        await expect(row(page, name)).toContainText(
          "Uses the default template",
        );
      }
    });
  });

  test("customizing a document starts from the default and keeps other templates", async ({
    page,
  }) => {
    const defaultTemplate: PrintTemplate = {
      slug: "default",
      page: { size: "A5" },
      branding: {
        logo: { url: faker.image.url(), alignment: "right", width: 80 },
      },
      watermark: { enabled: true, text: "INTERNAL" },
    };
    const legacy = { slug: "treatment_summary", page: { size: "Legal" } };
    facility.print_templates = [defaultTemplate, legacy as PrintTemplate];
    await openPage(page);

    await page
      .getByRole("button", { name: "Customize Invoice template" })
      .click();
    const invoice = sheet(page, "Invoice");
    await expect(invoice).toContainText(
      "Starts with a copy of the default template. Changes apply only to Invoice prints.",
    );
    await test.step("Prefill the default template's settings", async () => {
      await expect(invoice.getByLabel("Page Size")).toHaveText("A5");
      const logo = invoice.getByRole("group", { name: "Logo" });
      await expect(logo.getByLabel("Image URL")).toHaveValue(
        defaultTemplate.branding!.logo!.url,
      );
      await expect(logo.getByLabel("Width (px)")).toHaveValue("80");
      await expect(logo.getByLabel("Alignment")).toHaveText("Right");
      await expect(
        invoice.getByRole("switch", { name: "Enable Watermark" }),
      ).toBeChecked();
      await expect(invoice.getByLabel("Watermark Text")).toHaveValue(
        "INTERNAL",
      );
    });

    await test.step("Save the invoice template alongside the others", async () => {
      await choose(page, invoice.getByLabel("Page Size"), "A4");
      await invoice.getByRole("button", { name: "Save", exact: true }).click();
      await expect(invoice).toBeHidden();
      expect(saved).toEqual([
        [
          defaultTemplate,
          legacy,
          { ...defaultTemplate, slug: "invoice", page: { size: "A4" } },
        ],
      ]);
      await expect(
        row(page, "Invoice").getByText("Custom", { exact: true }),
      ).toBeVisible();
      await expect(row(page, "Invoice")).toContainText("A4 · Logo · Watermark");
      await expect(row(page, "Default")).toContainText("A5 · Logo · Watermark");
      await expect(row(page, "Multi Invoice")).toContainText(
        "Uses the default template",
      );
    });
  });

  test("editing prefills saved settings and saves only real changes", async ({
    page,
  }) => {
    const footerUrl = faker.image.url();
    const prescription: PrintTemplate = {
      slug: "prescription",
      page: {
        size: "Letter",
        orientation: "portrait",
        margin: { top: 5, right: 6, bottom: 7, left: 8 },
      },
      branding: { footer_image: { url: footerUrl, height: 40 } },
      watermark: { enabled: true, text: "COPY", opacity: 0.1, rotation: 15 },
      print_setup: { auto_print: true },
    };
    facility.print_templates = [prescription];
    await openPage(page);
    await expect(row(page, "Prescription")).toContainText(
      "Letter · Portrait · Custom Margins · Footer Image · Watermark · Auto Print",
    );
    await page
      .getByRole("button", { name: "Edit Prescription template" })
      .click();
    const editor = sheet(page, "Prescription");
    const save = editor.getByRole("button", { name: "Save", exact: true });

    await test.step("Prefill every saved setting", async () => {
      await expect(editor).toContainText(
        "Used for Prescription prints instead of the default template.",
      );
      await expect(editor.getByLabel("Page Size")).toHaveText("Letter");
      await expect(editor.getByLabel("Orientation")).toHaveText("Portrait");
      for (const [side, value] of [
        ["Top", "5"],
        ["Right", "6"],
        ["Bottom", "7"],
        ["Left", "8"],
      ]) {
        await expect(editor.getByLabel(side)).toHaveValue(value);
      }
      const footer = editor.getByRole("group", { name: "Footer Image" });
      await expect(footer.getByLabel("Image URL")).toHaveValue(footerUrl);
      await expect(footer.getByLabel("Height (px)")).toHaveValue("40");
      await expect(editor.getByLabel("Watermark Text")).toHaveValue("COPY");
      await expect(editor.getByLabel("Opacity (0–1)")).toHaveValue("0.1");
      await expect(editor.getByLabel("Rotation (°)")).toHaveValue("15");
      await expect(
        editor.getByRole("switch", { name: "Auto Print" }),
      ).toBeChecked();
    });

    await test.step("Enable save only while something differs", async () => {
      await expect(save).toBeDisabled();
      await editor.getByLabel("Rotation (°)").fill("20");
      await expect(save).toBeEnabled();
      await editor.getByLabel("Rotation (°)").fill("15");
      await expect(save).toBeDisabled();
    });

    await test.step("Change one field without touching the others", async () => {
      await editor.getByLabel("Bottom").fill("9");
      await save.click();
      await expect(editor).toBeHidden();
      expect(saved).toEqual([
        [
          {
            ...prescription,
            page: {
              ...prescription.page,
              margin: { top: 5, right: 6, bottom: 9, left: 8 },
            },
          },
        ],
      ]);
    });
  });

  test("asks before discarding unsaved changes", async ({ page }) => {
    const confirms: string[] = [];
    await openPage(page);
    const open = () =>
      page
        .getByRole("button", { name: "Customize Charge Items template" })
        .click();
    const editor = sheet(page, "Charge Items");

    await test.step("Close without changes does not ask", async () => {
      page.on("dialog", (dialog) => {
        confirms.push(dialog.message());
        return dialog.dismiss();
      });
      await open();
      await expect(editor).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(editor).toBeHidden();
      expect(confirms).toEqual([]);
    });

    await test.step("Keep editing when the prompt is dismissed", async () => {
      await open();
      await choose(page, editor.getByLabel("Page Size"), "A5");
      await page.keyboard.press("Escape");
      await expect(editor).toBeVisible();
      await editor.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(editor).toBeVisible();
      await editor.getByRole("button", { name: "Close", exact: true }).click();
      await expect(editor).toBeVisible();
      expect(confirms).toEqual([
        UNSAVED_CHANGES,
        UNSAVED_CHANGES,
        UNSAVED_CHANGES,
      ]);
      await expect(editor.getByLabel("Page Size")).toHaveText("A5");
    });

    await test.step("Discard the changes when confirmed", async () => {
      page.removeAllListeners("dialog");
      page.once("dialog", (dialog) => dialog.accept());
      await editor.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(editor).toBeHidden();
      await open();
      await expect(editor.getByLabel("Page Size")).toHaveText("Default (A4)");
      expect(saved).toEqual([]);
    });
  });

  test("blocks saving values the facility API rejects", async ({ page }) => {
    await openPage(page);
    await page
      .getByRole("button", { name: "Customize Invoice template" })
      .click();
    const editor = sheet(page, "Invoice");
    const save = editor.getByRole("button", { name: "Save", exact: true });

    await test.step("Reject negative margins", async () => {
      await editor.getByLabel("Top").fill("-1");
      await expect(
        editor.getByText("Margins can't be negative."),
      ).toBeVisible();
      await expect(editor.getByLabel("Top")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(save).toBeDisabled();
      await editor.getByLabel("Top").fill("0");
      await expect(editor.getByText("Margins can't be negative.")).toHaveCount(
        0,
      );
      await expect(save).toBeEnabled();
    });

    await test.step("Reject an opacity outside 0–1", async () => {
      await editor.getByRole("switch", { name: "Enable Watermark" }).click();
      await editor.getByLabel("Watermark Text").fill("DRAFT");
      await editor.getByLabel("Opacity (0–1)").fill("1.5");
      await expect(
        editor.getByText("Opacity must be between 0 and 1."),
      ).toBeVisible();
      await expect(save).toBeDisabled();
      await editor.getByLabel("Opacity (0–1)").fill("1");
      await expect(save).toBeEnabled();
    });

    await test.step("Keep 0 as a real margin", async () => {
      await save.click();
      await expect(editor).toBeHidden();
      expect(saved).toEqual([
        [
          {
            slug: "invoice",
            page: { margin: { top: 0, right: 10, bottom: 10, left: 10 } },
            watermark: { enabled: true, text: "DRAFT", opacity: 1 },
          },
        ],
      ]);
    });
  });

  test("resets documents to the default and removes the default template", async ({
    page,
  }) => {
    const defaultTemplate = { slug: "default", page: { size: "A5" as const } };
    facility.print_templates = [
      defaultTemplate,
      { slug: "invoice", page: { size: "Letter" } },
    ];
    await openPage(page);

    await test.step("Reset a document template", async () => {
      await page.getByRole("button", { name: "Edit Invoice template" }).click();
      const editor = sheet(page, "Invoice");
      await editor.getByRole("button", { name: "Reset to Default" }).click();
      const confirm = page.getByRole("alertdialog", {
        name: "Reset Invoice template?",
      });
      await expect(confirm).toContainText(
        "Invoice prints will use the default template.",
      );
      await confirm.getByRole("button", { name: "Cancel" }).click();
      await expect(confirm).toBeHidden();
      expect(saved).toEqual([]);
      await editor.getByRole("button", { name: "Reset to Default" }).click();
      await confirm.getByRole("button", { name: "Reset to Default" }).click();
      await expect(editor).toBeHidden();
      expect(saved).toEqual([[defaultTemplate]]);
      await expect(row(page, "Invoice")).toContainText(
        "Uses the default template",
      );
      await expect(
        row(page, "Invoice").getByText("Custom", { exact: true }),
      ).toHaveCount(0);
    });

    await test.step("Remove the default template", async () => {
      await page.getByRole("button", { name: "Edit Default template" }).click();
      const editor = sheet(page, "Default");
      await editor.getByRole("button", { name: "Remove Template" }).click();
      const confirm = page.getByRole("alertdialog", {
        name: "Remove Default template?",
      });
      await expect(confirm).toContainText(
        "Documents without their own template will print with the standard layout.",
      );
      await confirm.getByRole("button", { name: "Remove Template" }).click();
      await expect(editor).toBeHidden();
      expect(saved.at(-1)).toEqual([]);
      await expect(row(page, "Default")).toContainText(
        "Not set up. Documents print with the standard layout.",
      );
      await expect(row(page, "Invoice")).toContainText(
        "Uses the standard layout",
      );
    });

    await test.step("Without a default, a reset falls back to the standard layout", async () => {
      facility.print_templates = [{ slug: "appointment" }];
      await page.reload();
      await expect(row(page, "Appointment")).toContainText("Standard layout");
      await page
        .getByRole("button", { name: "Edit Appointment template" })
        .click();
      await sheet(page, "Appointment")
        .getByRole("button", { name: "Reset to Default" })
        .click();
      await expect(
        page.getByRole("alertdialog", { name: "Reset Appointment template?" }),
      ).toContainText("Appointment prints will use the standard layout.");
    });
  });

  test("keeps legacy duplicates and unrecognized templates working", async ({
    page,
  }) => {
    const legacy = {
      slug: "treatment_summary",
      watermark: { enabled: true, text: "OLD" },
    };
    facility.print_templates = [
      { slug: "invoice", page: { size: "A5" } },
      legacy,
      { slug: "invoice", page: { size: "Legal" } },
      { slug: "prescription" },
    ];
    await openPage(page);

    await test.step("Show the template printing actually uses", async () => {
      // Printing uses the first template of a type.
      await expect(row(page, "Invoice")).toContainText("A5");
      await expect(
        page.getByRole("listitem", { name: "Invoice", exact: true }),
      ).toHaveCount(1);
      const unrecognized = page.getByRole("region", {
        name: "Unrecognized Templates",
      });
      await expect(unrecognized.getByRole("listitem")).toHaveCount(1);
      await expect(row(page, "treatment_summary")).toContainText("Watermark");
    });

    await test.step("Saving a type drops only its ignored duplicates", async () => {
      await page.getByRole("button", { name: "Edit Invoice template" }).click();
      const editor = sheet(page, "Invoice");
      await expect(editor.getByLabel("Page Size")).toHaveText("A5");
      await choose(page, editor.getByLabel("Page Size"), "Letter");
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      expect(saved).toEqual([
        [
          { slug: "invoice", page: { size: "Letter" } },
          legacy,
          { slug: "prescription" },
        ],
      ]);
    });

    await test.step("Remove an unrecognized template", async () => {
      await page
        .getByRole("button", { name: "Edit treatment_summary template" })
        .click();
      const editor = sheet(page, "treatment_summary");
      await expect(editor).toContainText(
        "No print in CARE uses this identifier. It is kept until you remove it.",
      );
      await editor.getByRole("button", { name: "Remove Template" }).click();
      const confirm = page.getByRole("alertdialog", {
        name: "Remove treatment_summary template?",
      });
      await expect(confirm).toContainText("This template will be deleted.");
      await confirm.getByRole("button", { name: "Remove Template" }).click();
      await expect(editor).toBeHidden();
      expect(saved.at(-1)).toEqual([
        { slug: "invoice", page: { size: "Letter" } },
        { slug: "prescription" },
      ]);
      await expect(
        page.getByRole("region", { name: "Unrecognized Templates" }),
      ).toHaveCount(0);
    });
  });

  test("locks the form while saving and keeps edits when saving fails", async ({
    page,
  }) => {
    let release!: () => void;
    holdUpdate = new Promise((resolve) => (release = resolve));
    failUpdate = "Service unavailable";
    await openPage(page);
    await page
      .getByRole("button", { name: "Customize Invoice template" })
      .click();
    const editor = sheet(page, "Invoice");
    // While saving, the button also announces its spinner ("Loading... Save").
    const save = editor.getByRole("button", { name: "Save" });
    await choose(page, editor.getByLabel("Page Size"), "A5");

    await test.step("Prevent a second submit while saving", async () => {
      await save.click();
      await expect(save).toBeDisabled();
      await expect(editor.getByLabel("Top")).toBeDisabled();
      await expect(
        editor.getByRole("button", { name: "Cancel", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(editor).toBeVisible();
      release();
    });

    await test.step("Show the error and keep the sheet open", async () => {
      await expect(page.getByText("Service unavailable")).toBeVisible();
      await expect(editor).toBeVisible();
      await expect(editor.getByLabel("Page Size")).toHaveText("A5");
      await expect(save).toBeEnabled();
      expect(saved).toHaveLength(1);
    });

    await test.step("Nothing was saved once the edits are discarded", async () => {
      page.once("dialog", (dialog) => dialog.accept());
      await editor.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(row(page, "Invoice")).toContainText(
        "Uses the standard layout",
      );
    });
  });

  test("users who can't update the facility can't manage print templates", async ({
    page,
  }) => {
    user.is_superuser = false;
    facility.root_org_permissions = [];
    await page.goto(`/facility/${facility.id}/settings/general`);
    await expect(
      page.getByRole("heading", { name: facility.name }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Print Templates", exact: true }),
    ).toHaveCount(0);
    await page.goto(`/facility/${facility.id}/settings/print-templates`);
    await expect(
      page.getByText("You do not have permissions to view this page", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Default Template" }),
    ).toHaveCount(0);
  });
});
