import { expect, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

interface RegistryInstruction {
  slug: string;
  context: string;
  input_schema: { properties?: Record<string, { title?: string }> };
}

/** An instruction that declares the Appointment context, read from the
 *  registry — the page never hardcodes slugs and neither does the spec. */
async function appointmentInstruction(): Promise<RegistryInstruction> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/action_configuration/instructions/`,
    { headers: adminApiHeaders() },
  );
  if (!res.ok) throw new Error(`instructions endpoint: ${res.status}`);
  const data = (await res.json()) as { instructions: RegistryInstruction[] };
  const instruction =
    data.instructions.find((entry) => entry.context === "Appointment") ??
    data.instructions[0];
  if (!instruction) throw new Error("No action instructions registered");
  return instruction;
}

async function fetchConfiguration(id: string) {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/action_configuration/${id}/`,
    {
      headers: adminApiHeaders(),
    },
  );
  return {
    status: res.status,
    body: res.ok
      ? ((await res.json()) as {
          name: string;
          action_context: string;
          performable: boolean;
          actions: {
            condition: string;
            instructions: { slug: string; params: Record<string, unknown> }[];
          }[];
        })
      : undefined,
  };
}

test.describe("Admin action configurations", () => {
  test("creates an appointment configuration with a patient condition, edits and deletes it", async ({
    page,
  }) => {
    const instruction = await appointmentInstruction();
    const paramName = Object.keys(instruction.input_schema.properties ?? {})[0];
    const paramLabel =
      instruction.input_schema.properties?.[paramName]?.title ?? paramName;
    const stamp = Date.now();
    const name = `Elderly booking ${stamp}`;
    let configurationId = "";

    await test.step("The empty form offers the appointment context", async () => {
      await page.goto("/admin/actions/new");
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      await expect(
        page.getByRole("combobox", { name: "Runs for" }),
      ).toContainText("Appointments");
      await page.getByRole("switch", { name: "Can be run on demand" }).click();
    });

    await test.step("An action with a patient-age condition and a step", async () => {
      await page.getByRole("button", { name: "Add action" }).click();
      await page.getByRole("button", { name: "Add a condition" }).click();
      // No questionnaire answers here — the first field is the context's
      // first value, reached through the Appointment › Patient edge.
      await expect(
        page.getByRole("combobox", { name: "Condition 1 Field" }),
      ).toContainText("Patient");
      await page.getByRole("combobox", { name: "Condition 1 Field" }).click();
      await page.getByRole("option", { name: "Patient › Age" }).click();
      await page
        .getByRole("combobox", { name: "Condition 1 Operator" })
        .click();
      await page
        .getByRole("option", { name: "Greater Than", exact: true })
        .click();
      await page.getByRole("textbox", { name: "Condition 1 Value" }).fill("60");

      await page.getByRole("button", { name: "Add instruction" }).click();
      await page.getByRole("combobox", { name: "Instruction" }).click();
      await page
        .getByRole("option")
        .filter({ hasText: /Log a message|Show a message/ })
        .first()
        .click();
      await page
        .getByRole("textbox", { name: paramLabel })
        .fill(`Elderly patient booked ${stamp}`);
    });

    await test.step("Save creates it and the list shows it", async () => {
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Action configuration created");
      await page.waitForURL(/\/admin\/actions$/);
      const row = page.getByRole("row", { name: new RegExp(name) });
      await expect(row).toBeVisible();
      await expect(row).toContainText("Appointments");
      await expect(row).toContainText("1 action");
      await row.click();
      await page.waitForURL(/\/admin\/actions\/[0-9a-f-]+$/);
      configurationId = page.url().split("/").pop() as string;
    });

    await test.step("What was stored is the compiled condition and the step", async () => {
      const { body } = await fetchConfiguration(configurationId);
      expect(body?.name).toBe(name);
      expect(body?.action_context).toBe("APPOINTMENT");
      expect(body?.performable).toBe(true);
      expect(body?.actions[0].condition).toBe('patient["age"] > 60');
      expect(body?.actions[0].instructions[0].slug).toBe(instruction.slug);
      expect(body?.actions[0].instructions[0].params[paramName]).toBe(
        `Elderly patient booked ${stamp}`,
      );
    });

    await test.step("The editor shows context as a badge and saves a rename", async () => {
      await expect(page.getByText("Appointments").first()).toBeVisible();
      await expect(page.getByText("On demand")).toBeVisible();
      await page.getByRole("textbox", { name: "Name" }).fill(`${name} v2`);
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Action configuration updated");
      const { body } = await fetchConfiguration(configurationId);
      expect(body?.name).toBe(`${name} v2`);
      expect(body?.actions).toHaveLength(1);
    });

    await test.step("Delete asks first, then removes it", async () => {
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Delete" })
        .click();
      await expectToast(page, "Action configuration deleted");
      await page.waitForURL(/\/admin\/actions$/);
      await expect(
        page.getByRole("row", { name: new RegExp(`${name} v2`) }),
      ).not.toBeVisible();
      expect((await fetchConfiguration(configurationId)).status).toBe(404);
    });
  });
});
