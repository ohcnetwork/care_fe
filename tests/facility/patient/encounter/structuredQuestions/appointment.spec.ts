import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { addDays, isSameMonth } from "date-fns";
import { submitForm } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-type matrix (spec §10) for `appointment` — Task 10 Step 2. P1-16 is
 * the point: a slotless appointment used to compose
 * `/slots/undefined/create_appointment/` (`definitions/appointment.tsx`'s
 * old body), whose 400 rolled back the ENTIRE batch — every other section
 * the clinician just saved, discarded, over a missing slot. The v2
 * differ's `hasValidSlot` gate (`structured/types/appointment/model.ts`)
 * closes that; this file pins it end to end.
 *
 * SCHEDULE FIXTURE: booking a real slot needs a real availability. There is
 * no pre-seeded schedule for the admin user in the E2E fixture set, so
 * `ensureAdminAvailability` creates one via the API (mirrors
 * `CreateScheduleTemplateSheet.tsx`'s own request shape) once per file run.
 * The backend rejects `valid_from` dated today or earlier ("Date cannot be
 * before the current date"), so the window starts TOMORROW.
 *
 * SLOT REUSE (found running this file repeatedly): the backend rejects a
 * SECOND booking for the same patient on the same slot ("Patient already
 * has a booking for this slot") — a real product rule, not a test bug. The
 * ONLY test that actually books (`"add + submit"`) therefore picks a
 * RANDOM day (a few days out) and a RANDOM slot index each run, rather than
 * always the first slot on the schedule's first day, so repeated local
 * runs don't collide with a booking a previous run already made. `"edit"`
 * and `"draft"` below never click the OUTER "Save Changes" — the sheet's
 * own "Submit" only commits `slot_id` to the client-side row, so those two
 * are safe to always use "tomorrow" and never touch the server at all.
 *
 * This is additive to the shared fixtures (one new schedule template, at
 * most one booked appointment on the shared fixture patient per run) and
 * does not corrupt anything the way marking a patient deceased would (see
 * `timeOfDeath.spec.ts`'s safety note) — appointments and schedule
 * templates are additive records, not identity-mutating ones.
 */

async function ensureAdminAvailability(facilityId: string): Promise<void> {
  const me = await fetch(`${apiBaseUrl()}/api/v1/users/getcurrentuser/`, {
    headers: adminApiHeaders(),
  }).then((r) => r.json() as Promise<{ id: string }>);

  const validFrom = addDays(new Date(), 1);
  const validTo = addDays(validFrom, 60);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch(
    `${apiBaseUrl()}/api/v1/facility/${facilityId}/schedule/`,
    {
      method: "POST",
      headers: adminApiHeaders(),
      body: JSON.stringify({
        name: `E2E Appointment Availability ${faker.string.alphanumeric(8)}`,
        valid_from: ymd(validFrom),
        valid_to: ymd(validTo),
        resource_type: "practitioner",
        resource_id: me.id,
        is_public: false,
        availabilities: [
          {
            name: "E2E Slots",
            reason: "",
            // <=30 slots per session (backend cap): 7 hours / 15 min = 28.
            availability: [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
              day_of_week,
              start_time: "09:00:00",
              end_time: "16:00:00",
            })),
            slot_type: "appointment",
            slot_size_in_minutes: 15,
            tokens_per_slot: 50,
          },
        ],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to create admin availability: ${res.status} — ${await res.text()}`,
    );
  }
}

/** Opens the slot sheet (the trigger is the element directly following the
 *  "Appointment Slot" label — the `Sheet`/`SheetTrigger` Radix roots emit no
 *  DOM node of their own, so the rendered `<button>` is a true sibling). */
function slotTrigger(block: ReturnType<typeof questionBlock>) {
  return block.locator(
    'xpath=.//label[normalize-space(.)="Appointment Slot"]/following-sibling::button[1]',
  );
}

/** Navigates the sheet's calendar to `date` and waits for that date's cell
 *  to carry real availability before clicking it. */
async function selectDate(page: Page, date: Date): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Select appointment slot" });
  await expect(dialog).toBeVisible();

  if (!isSameMonth(date, new Date())) {
    await dialog.getByRole("button", { name: "Next Month" }).click();
  }
  const dayCell = dialog.locator("button").filter({
    has: page.locator(
      `xpath=.//span[normalize-space(text())="${date.getDate()}"]`,
    ),
  });
  await expect(dayCell.first()).toBeEnabled({ timeout: 15000 });
  await dayCell.first().click();
}

/** Waits for the picker's own auto-select effect to stage the first
 *  available slot for the currently selected date, then confirms via the
 *  sheet's "Submit" button. Never clicks a slot button directly — the
 *  auto-selected slot is a toggle, and clicking an already-selected one
 *  would DESELECT it (`AppointmentSlotPicker.tsx`'s `TokenSlotButton`
 *  `onClick`). */
async function confirmAutoSelectedSlot(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Select appointment slot" });
  const confirm = dialog.getByRole("button", { name: "Submit", exact: true });
  await expect(confirm).toBeEnabled({ timeout: 15000 });
  await confirm.click();
  await expect(dialog).not.toBeVisible();
}

/** Picks the slot at `index` explicitly — used whenever the test needs a
 *  DETERMINISTIC (not merely "whatever autoselected first") slot, either to
 *  avoid a repeat-run booking collision (`"add + submit"`) or to guarantee
 *  a slot DIFFERENT from the one already staged (`"edit"`). */
async function pickSlotByIndex(page: Page, index: number): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Select appointment slot" });
  const slotButtons = dialog.getByRole("button", { name: /^\d{2}:\d{2}/ });
  await expect(slotButtons.nth(index)).toBeVisible({ timeout: 15000 });
  await slotButtons.nth(index).click();
  await confirmAutoSelectedSlot(page);
}

function trackBatchRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

const fixture = STRUCTURED_FIXTURES.appointment;

// Serial on purpose: every test here books a real slot out of the one
// shared availability this file creates, so running them concurrently
// exhausts it and the slot sheet's Submit stays disabled with nothing left
// to pick — a failure about scheduling capacity, not about the widget.
test.describe.configure({ mode: "serial" });

test.describe("Structured question: appointment", () => {
  test.beforeAll(async () => {
    await ensureAdminAvailability(getFacilityId());
  });

  test("validation: a reason with no slot blocks Save and composes no request", async ({
    page,
  }) => {
    const posts = trackBatchRequests(page);
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    await block
      .getByPlaceholder("Type the reason for visit")
      .fill(faker.lorem.sentence());

    await submitForm(page);

    await expect(
      block.getByText("Select an appointment slot before saving"),
    ).toBeVisible();

    // P1-16: the specific defect this port exists to close.
    expect(
      posts.some((url) => url.includes("/slots/undefined/")),
      "must never compose a request against the undefined-slot URL",
    ).toBe(false);
    expect(
      posts,
      "client validation must block Save before any batch request is sent",
    ).toHaveLength(0);
  });

  test("add + submit: pick a resource (defaulted to the current user), a date and a slot", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    const reason = faker.lorem.sentence();
    await block.getByPlaceholder("Type the reason for visit").fill(reason);

    // The resource picker defaults to the CURRENT user
    // (`AppointmentEditor.tsx`'s `initialResource`) — the trigger is
    // already enabled without touching `ScheduleResourceSelector`.
    await expect(slotTrigger(block)).toBeEnabled();
    await slotTrigger(block).click();
    // A random day + slot (see this file's top comment) rather than always
    // the schedule's first slot, so repeated local runs don't collide with
    // a booking an earlier run already made for this patient.
    const bookingDay = addDays(
      new Date(),
      faker.number.int({ min: 3, max: 25 }),
    );
    await selectDate(page, bookingDay);
    await pickSlotByIndex(page, faker.number.int({ min: 0, max: 20 }));

    await expect(slotTrigger(block)).not.toHaveText(/select appointment slot/i);

    // The structured differ's request (`/slots/{id}/create_appointment/`)
    // is one entry INSIDE the outer `/api/v1/batch_requests/` POST body,
    // not a standalone browser request — verify through the API afterwards
    // instead of trying to intercept it directly.
    await submitForm(page);
    await expectToast(page, /questionnaire submitted successfully/i);
    await page.waitForURL(/\/encounter\/[^/]+\/updates$/);

    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const appointmentsRes = await fetch(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/appointments/?patient=${patientId}&resource_type=practitioner&limit=10`,
      { headers: adminApiHeaders() },
    );
    expect(appointmentsRes.ok).toBe(true);
    const appointmentsData = (await appointmentsRes.json()) as {
      results: { id: string; note: string }[];
    };
    const booked = appointmentsData.results.find((a) => a.note === reason);
    expect(
      booked,
      "the just-booked appointment must be listed for this patient",
    ).toBeTruthy();

    // On-page verify: the booked appointment's own detail page.
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${booked!.id}`,
    );
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
  });

  test("edit: reopening the sheet and picking a different slot changes the trigger label", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    // Never actually submits (the sheet's "Submit" only commits `slot_id`
    // to the client-side row) — safe to reuse fixed days on every run.
    // Two DIFFERENT days, not two indices on the same day: repeated file
    // runs accumulate more than one admin availability template (each
    // `ensureAdminAvailability` call adds a new one rather than reusing an
    // existing one), so more than one schedule can offer an identical
    // 09:00 label on the same day — a same-day index pick found this
    // empirically flaky. Different days guarantee different labels
    // regardless of how many overlapping templates exist.
    await slotTrigger(block).click();
    await selectDate(page, addDays(new Date(), 1));
    await confirmAutoSelectedSlot(page);
    const firstLabel = await slotTrigger(block).innerText();

    await slotTrigger(block).click();
    await selectDate(page, addDays(new Date(), 2));
    await confirmAutoSelectedSlot(page);
    const secondLabel = await slotTrigger(block).innerText();

    expect(secondLabel).not.toBe(firstLabel);
  });

  test("remove: clearing the reason (with no slot ever picked) returns the section to clean", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    const reasonBox = block.getByPlaceholder("Type the reason for visit");
    await reasonBox.fill(faker.lorem.sentence());
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // `isEmptyRow` (`structured/types/appointment/model.ts`): note, slot and
    // tags all empty annihilates the row — no slot was ever picked in this
    // test, so clearing the reason alone is enough to return to a wholly
    // empty row.
    await reasonBox.fill("");

    // A wholly-clean appointment section (no edits survive) plus a blank
    // "Plain note" would leave NOTHING at all to submit, which the submit
    // hook refuses outright before composing any request
    // (`useSubmitFillSession.ts`'s `requests.length === 0` guard, an
    // unrelated, session-wide check found while writing this spec — not
    // this section's own zero-upsert behavior). Answering the plain
    // question keeps the OVERALL submit real, so this test actually proves
    // what it claims: the appointment section itself contributes nothing.
    await questionBlock(page, "Plain note")
      .getByRole("textbox")
      .fill(faker.lorem.words(3));

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await submitForm(page);
    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: { url: string }[];
    };
    expect(
      body.requests.some((r) => r.url.includes("/create_appointment/")),
      "a clean section must never compose a create_appointment request",
    ).toBe(false);
    await expectToast(page, /questionnaire submitted successfully/i);
  });

  test("draft: fill reason + slot, reload, restore, and the trigger reads the generic 'slot selected' state", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    const fillUrl = structuredFixtureUrl(questionnaireId);
    await page.goto(fillUrl);

    const block = questionBlock(page, fixture.label);
    await block
      .getByPlaceholder("Type the reason for visit")
      .fill(faker.lorem.sentence());
    // Never actually submits — safe to reuse "tomorrow".
    await slotTrigger(block).click();
    await selectDate(page, addDays(new Date(), 1));
    await confirmAutoSelectedSlot(page);

    // Before reload the trigger shows the real date/time — the picker's
    // own `slotDetail` is still in memory.
    await expect(slotTrigger(block)).not.toHaveText(/select appointment slot/i);

    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();

    // The third, honest trigger state (`SlotTriggerLabel`'s doc comment):
    // `slot_id` survived the draft, but there is no slot-retrieve endpoint
    // to rehydrate `slotDetail` from, so the restored trigger reads
    // "Appointment slot selected" rather than lying with "Select
    // appointment slot" (the legacy component's two-state bug) or
    // fabricating a date/time it no longer has.
    await expect(slotTrigger(questionBlock(page, fixture.label))).toHaveText(
      "Appointment slot selected",
    );
  });
});
