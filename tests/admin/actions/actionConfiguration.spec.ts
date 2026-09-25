import { expect, test, type Page } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

/** The six comparison operators an appointment (context) field offers,
 *  paired with the Python symbol each compiles to. Contains / Does not
 *  contain (`in` / `not in`) are choice-only and not reachable here. */
const NUMERIC_OPERATORS = [
  { label: "Equals", symbol: "==" },
  { label: "Not Equals", symbol: "!=" },
  { label: "Greater Than", symbol: ">" },
  { label: "Greater Than or Equal", symbol: ">=" },
  { label: "Less Than", symbol: "<" },
  { label: "Less Than or Equal", symbol: "<=" },
] as const;

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

/** Adds one condition on the open action and points it at the numeric
 *  "Patient › Age" context value with the given operator and value.
 *  Context values carry no answer shape, so the value control is a text
 *  box whose numeric entry compiles to a bare number literal. */
async function addAgeCondition(
  page: Page,
  n: number,
  operatorLabel: string,
  value: number,
) {
  await page.getByRole("button", { name: "Add a condition" }).click();
  await page.getByRole("combobox", { name: `Condition ${n} Field` }).click();
  await page.getByRole("option", { name: "Patient › Age" }).click();
  await page.getByRole("combobox", { name: `Condition ${n} Operator` }).click();
  await page.getByRole("option", { name: operatorLabel, exact: true }).click();
  await page
    .getByRole("textbox", { name: `Condition ${n} Value` })
    .fill(String(value));
}

/** Fills the required message param of the index-th instruction on the open
 *  action. Adding an action preseeds the one registered instruction already
 *  selected, so the first message step exists without clicking "Add
 *  instruction"; collapsed action cards are hidden, so the index counts only
 *  the instructions of the card being edited. */
async function fillMessage(
  page: Page,
  paramLabel: string,
  message: string,
  index = 0,
) {
  await page
    .getByRole("textbox", { name: paramLabel })
    .nth(index)
    .fill(message);
}

/** The confirm-and-remove flow the editor uses on the detail page. */
async function deleteConfiguration(page: Page) {
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expectToast(page, "Action configuration deleted");
  await page.waitForURL(/\/admin\/actions$/);
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
      await page
        .getByRole("spinbutton", { name: "Condition 1 Value" })
        .fill("60");

      // Adding the action preseeded the one registered instruction
      // ("Log a message"), already selected — only its message needs filling.
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

  test("offers all six operators for a numeric field and compiles each to its symbol", async ({
    page,
  }) => {
    const instruction = await appointmentInstruction();
    const paramName = Object.keys(instruction.input_schema.properties ?? {})[0];
    const paramLabel =
      instruction.input_schema.properties?.[paramName]?.title ?? paramName;
    const stamp = Date.now();
    const name = `Every operator ${stamp}`;
    let configurationId = "";

    await test.step("Each operator becomes its own action on Patient age", async () => {
      await page.goto("/admin/actions/new");
      await page.getByRole("textbox", { name: "Name" }).fill(name);

      for (const [index, operator] of NUMERIC_OPERATORS.entries()) {
        await page.getByRole("button", { name: "Add action" }).click();
        // Wait for any previously open action card to collapse (its hidden
        // controls leave the accessibility tree) before editing this one.
        await expect(
          page.getByRole("button", { name: "Add a condition" }),
        ).toHaveCount(1);
        await page.getByRole("button", { name: "Add a condition" }).click();
        await page.getByRole("combobox", { name: "Condition 1 Field" }).click();
        await page.getByRole("option", { name: "Patient › Age" }).click();
        await page
          .getByRole("combobox", { name: "Condition 1 Operator" })
          .click();

        // The first action proves the numeric field offers exactly the six
        // comparison operators — and none of the choice-only ones.
        if (index === 0) {
          for (const candidate of NUMERIC_OPERATORS) {
            await expect(
              page.getByRole("option", { name: candidate.label, exact: true }),
            ).toBeVisible();
          }
          await expect(
            page.getByRole("option", { name: "Contains", exact: true }),
          ).toHaveCount(0);
        }

        await page
          .getByRole("option", { name: operator.label, exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Condition 1 Value" })
          .fill(String((index + 1) * 10));
        await fillMessage(page, paramLabel, `${operator.symbol} ${stamp}`);
      }
    });

    await test.step("Save stores one action per operator, each compiled", async () => {
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Action configuration created");
      await page.waitForURL(/\/admin\/actions$/);
      const row = page.getByRole("row", { name: new RegExp(name) });
      await expect(row).toContainText("6 actions");
      await row.click();
      await page.waitForURL(/\/admin\/actions\/[0-9a-f-]+$/);
      configurationId = page.url().split("/").pop() as string;

      const { body } = await fetchConfiguration(configurationId);
      expect(body?.actions).toHaveLength(NUMERIC_OPERATORS.length);
      NUMERIC_OPERATORS.forEach((operator, index) => {
        expect(body?.actions[index].condition).toBe(
          `patient["age"] ${operator.symbol} ${(index + 1) * 10}`,
        );
      });
    });

    await test.step("Delete removes it", async () => {
      await deleteConfiguration(page);
      expect((await fetchConfiguration(configurationId)).status).toBe(404);
    });
  });

  test("combines multiple conditions and instructions across multiple actions", async ({
    page,
  }) => {
    const instruction = await appointmentInstruction();
    const paramName = Object.keys(instruction.input_schema.properties ?? {})[0];
    const paramLabel =
      instruction.input_schema.properties?.[paramName]?.title ?? paramName;
    const stamp = Date.now();
    const name = `Multi rule ${stamp}`;
    let configurationId = "";

    await test.step("Action 1: three AND conditions, one removed, two steps", async () => {
      await page.goto("/admin/actions/new");
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      await page.getByRole("button", { name: "Add action" }).click();

      await addAgeCondition(page, 1, "Greater Than or Equal", 18);
      await addAgeCondition(page, 2, "Less Than or Equal", 65);
      await addAgeCondition(page, 3, "Not Equals", 40);

      // AND is the default and both connectors are offered.
      await expect(
        page.getByRole("radio", { name: "All conditions are true (AND)" }),
      ).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Any condition is true (OR)" }),
      ).toBeVisible();

      // Drop the third rule (no steps or config-level delete exist yet, so
      // the only "Delete" controls are the condition rows).
      await page
        .getByRole("button", { name: "Delete", exact: true })
        .nth(2)
        .click();
      await expect(
        page.getByRole("combobox", { name: "Condition 3 Field" }),
      ).toHaveCount(0);

      // The action came with one preseeded instruction — fill it, then add a
      // second and drop it, proving add/remove leaves the first behind.
      await fillMessage(page, paramLabel, `Keep ${stamp}`, 0);
      await page.getByRole("button", { name: "Add instruction" }).click();
      await fillMessage(page, paramLabel, `Drop ${stamp}`, 1);
      await page.getByRole("button", { name: "Remove step" }).nth(1).click();
    });

    await test.step("Action 2: two OR conditions and one step", async () => {
      await page.getByRole("button", { name: "Add action" }).click();
      // Let action 1 collapse before authoring action 2.
      await expect(
        page.getByRole("button", { name: "Add a condition" }),
      ).toHaveCount(1);
      await addAgeCondition(page, 1, "Less Than", 5);
      await addAgeCondition(page, 2, "Greater Than", 65);
      await page
        .getByRole("radio", { name: "Any condition is true (OR)" })
        .click();
      await fillMessage(page, paramLabel, `Toddler or senior ${stamp}`);
    });

    await test.step("Save stores both actions with compiled AND / OR", async () => {
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Action configuration created");
      await page.waitForURL(/\/admin\/actions$/);
      const row = page.getByRole("row", { name: new RegExp(name) });
      await expect(row).toContainText("2 actions");
      await row.click();
      await page.waitForURL(/\/admin\/actions\/[0-9a-f-]+$/);
      configurationId = page.url().split("/").pop() as string;

      const { body } = await fetchConfiguration(configurationId);
      expect(body?.actions).toHaveLength(2);
      expect(body?.actions[0].condition).toBe(
        'patient["age"] >= 18 and patient["age"] <= 65',
      );
      expect(body?.actions[0].instructions).toHaveLength(1);
      expect(body?.actions[0].instructions[0].params[paramName]).toBe(
        `Keep ${stamp}`,
      );
      expect(body?.actions[1].condition).toBe(
        'patient["age"] < 5 or patient["age"] > 65',
      );
      expect(body?.actions[1].instructions).toHaveLength(1);
    });

    await test.step("Deleting the second action persists a single action", async () => {
      await page.getByRole("button", { name: "Delete action 2" }).click();
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Action configuration updated");
      const { body } = await fetchConfiguration(configurationId);
      expect(body?.actions).toHaveLength(1);
      expect(body?.actions[0].condition).toBe(
        'patient["age"] >= 18 and patient["age"] <= 65',
      );
    });

    await test.step("Delete removes it", async () => {
      await deleteConfiguration(page);
      expect((await fetchConfiguration(configurationId)).status).toBe(404);
    });
  });
});
