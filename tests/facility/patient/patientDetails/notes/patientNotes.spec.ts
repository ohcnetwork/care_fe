import { faker } from "@faker-js/faker";
import { createPatientNoteThreadViaUi } from "tests/helper/patient";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Notes - Isolation from Encounter Notes", () => {
  let patientId: string;
  let encounterUrl: string;
  let patientNoteTitle: string;
  let patientNoteMessage: string;

  test.beforeEach(({ facilityId, isolatedEncounter }) => {
    // Generate unique titles and messages
    patientNoteTitle = `Patient Note ${faker.string.alphanumeric(8)}`;
    patientNoteMessage = `Patient message: ${faker.lorem.sentence()}`;

    // A throwaway patient + encounter, so the shared fixture's notes stay as
    // they are.
    patientId = isolatedEncounter.patientId;
    encounterUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${isolatedEncounter.encounterId}/notes`;
  });

  test(
    "should create patient note and verify it does NOT appear in encounter notes",
    {
      tag: ["@journey", "@cap:patient.notes.create"],
      annotation: {
        type: "journey",
        description:
          "patient.notes.create + patient.notes.message, then edits the message and renames the thread (patient.notes.edit), then checks encounter notes isolation",
      },
    },
    async ({ page, facilityId }) => {
      // Create a thread in patient notes and send a message in it
      await createPatientNoteThreadViaUi(page, {
        facilityId,
        patientId,
        title: patientNoteTitle,
        message: patientNoteMessage,
      });

      // Verify thread was created
      await expect(
        page.getByRole("button").filter({ hasText: patientNoteTitle }),
      ).toBeVisible();

      // Verify message appears in patient notes
      await expect(page.getByText(patientNoteMessage)).toBeVisible();

      // Exercise the native notes adapter's update endpoints before checking
      // isolation, so a working referral adapter cannot hide a native regression.
      const originalMessage = patientNoteMessage;
      patientNoteMessage = `Updated ${patientNoteMessage}`;
      const messages = page.getByRole("list", {
        name: "Discussion messages",
        exact: true,
      });
      await messages
        .getByRole("listitem")
        .filter({ hasText: originalMessage })
        .getByRole("button", { name: "Edit message", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Edit message", exact: true })
        .fill(patientNoteMessage);
      await page
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(
        messages.getByText(patientNoteMessage, { exact: true }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "Rename discussion", exact: true })
        .click();
      const rename = page.getByRole("dialog", {
        name: "Rename discussion",
        exact: true,
      });
      patientNoteTitle = `Updated ${patientNoteTitle}`;
      await rename
        .getByRole("textbox", { name: "Discussion title", exact: true })
        .fill(patientNoteTitle);
      await rename
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(rename).toBeHidden();
      await page.reload();
      await page
        .getByRole("button")
        .filter({ hasText: patientNoteTitle })
        .click();
      const updatedMessage = messages
        .getByRole("listitem")
        .filter({ hasText: patientNoteMessage });
      await expect(
        updatedMessage.getByText(patientNoteMessage, { exact: true }),
      ).toBeVisible();
      await updatedMessage
        .getByText("Edit history (1 change)", { exact: true })
        .click();
      await expect(
        updatedMessage.getByText(originalMessage, { exact: true }),
      ).toBeVisible();

      // Open the encounter discussion context for the same patient.
      await page.goto(encounterUrl);

      // Wait for notes to load by checking for the "New" button
      await expect(page.getByRole("button", { name: /^New$/i })).toBeVisible({
        timeout: 10000,
      });

      // Verify patient note does NOT appear in encounter notes
      await expect(
        page.getByRole("button").filter({ hasText: patientNoteTitle }),
      ).toBeHidden();
      await expect(page.getByText(patientNoteMessage)).toBeHidden();
    },
  );
});

test.describe("Patient Notes - Thread Messaging (Multi-user & Single-user)", () => {
  let facilityId: string;
  let patientId: string;
  let patientUrl: string;
  let threadTitle: string;
  let userAMessage1: string;
  let userAMessage2: string;
  let userAMessage3: string;
  let userBMessage: string;

  test.beforeEach(({ facilityId: facility, isolatedEncounter }) => {
    // Generate unique data for this test run
    threadTitle = `Thread ${faker.string.alphanumeric(8)}`;
    userAMessage1 = `User A message 1: ${faker.lorem.sentence()}`;
    userAMessage2 = `User A message 2: ${faker.lorem.sentence()}`;
    userAMessage3 = `User A message 3: ${faker.lorem.sentence()}`;
    userBMessage = `User B message: ${faker.lorem.sentence()}`;

    // The notes of a throwaway patient (with an in-progress encounter in the
    // facility, so facility users can open it), not of the first encounter in
    // a shared list that parallel tests keep changing.
    facilityId = facility;
    patientId = isolatedEncounter.patientId;
    patientUrl = `/facility/${facilityId}/patient/${patientId}/notes`;
  });

  test(
    "should support multi-user messaging in same thread",
    { tag: ["@atomic", "@cap:patient.notes.message"] },
    async ({ page, browser }) => {
      // User A creates new thread and sends first message
      await createPatientNoteThreadViaUi(page, {
        facilityId,
        patientId,
        title: threadTitle,
        message: userAMessage1,
      });

      // Verify User A's message appears
      await expect(page.getByText(userAMessage1)).toBeVisible();

      // Create User B context with facility admin authentication
      const userBContext = await browser.newContext({
        storageState: "tests/.auth/facilityAdmin.json",
      });
      const userBPage = await userBContext.newPage();

      // User B navigates to the same patient notes
      await userBPage.goto(patientUrl);

      // Select the thread created by User A
      await userBPage
        .getByRole("button")
        .filter({ hasText: threadTitle })
        .click();

      // Verify User A's message is visible to User B
      await expect(userBPage.getByText(userAMessage1)).toBeVisible();

      // User B fills message input and sends a message
      await userBPage
        .getByPlaceholder("Type your message...")
        .fill(userBMessage);
      await userBPage.getByRole("button", { name: "Send message" }).click();

      // Wait for message to be sent by checking if it appears
      await expect(userBPage.getByText(userBMessage)).toBeVisible({
        timeout: 10000,
      });

      // Refresh User A's view and verify both messages appear
      await page.reload();
      await page.getByRole("button").filter({ hasText: threadTitle }).click();

      await expect(page.getByText(userAMessage1)).toBeVisible();
      await expect(page.getByText(userBMessage)).toBeVisible();

      // Clean up User B context
      await userBContext.close();
    },
  );

  test(
    "should maintain correct order for consecutive messages from same user",
    { tag: ["@atomic", "@cap:patient.notes.message"] },
    async ({ page }) => {
      // Create new thread with title
      await createPatientNoteThreadViaUi(page, {
        facilityId,
        patientId,
        title: threadTitle,
      });

      // Send multiple consecutive messages by iterating through array
      const messages = [userAMessage1, userAMessage2, userAMessage3];

      for (const message of messages) {
        await page.getByPlaceholder("Type your message...").fill(message);
        await page.getByRole("button", { name: "Send message" }).click();
        await expect(page.getByPlaceholder("Type your message...")).toBeEmpty();
      }

      // Verify all messages appear
      await expect(page.getByText(userAMessage1)).toBeVisible();
      await expect(page.getByText(userAMessage2)).toBeVisible();
      await expect(page.getByText(userAMessage3)).toBeVisible();

      // Count each message individually to verify exactly one of each appears
      await expect(page.getByText(userAMessage1)).toHaveCount(1);
      await expect(page.getByText(userAMessage2)).toHaveCount(1);
      await expect(page.getByText(userAMessage3)).toHaveCount(1);
    },
  );
});

test.describe("Patient Notes - Thread Creation", () => {
  let thread1Title: string;
  let thread2Title: string;
  let thread3Title: string;

  test.beforeEach(async ({ page, facilityId, isolatedEncounter }) => {
    // Generate unique thread titles
    thread1Title = `Thread 1 ${faker.string.alphanumeric(8)}`;
    thread2Title = `Thread 2 ${faker.string.alphanumeric(8)}`;
    thread3Title = `Thread 3 ${faker.string.alphanumeric(8)}`;

    // Navigate to the notes of a throwaway patient of this test's own
    await page.goto(
      `/facility/${facilityId}/patient/${isolatedEncounter.patientId}/notes`,
    );
  });

  test(
    "should create multiple threads and verify all appear without duplication",
    { tag: ["@atomic", "@cap:patient.notes.create"] },
    async ({ page }) => {
      const threadTitleInput = page.getByPlaceholder(
        "Enter discussion title...",
      );
      const threadTitles = [thread1Title, thread2Title, thread3Title];

      // Create three threads by iterating through titles
      for (const title of threadTitles) {
        await page.getByRole("button", { name: /New/i }).first().click();
        await threadTitleInput.fill(title);

        await page.getByRole("button", { name: /Create/i }).click();

        // Verify each thread appears after creation
        await expect(
          page.getByRole("button").filter({ hasText: title }),
        ).toBeVisible();
      }

      // Verify all threads are present
      for (const title of threadTitles) {
        await expect(
          page.getByRole("button").filter({ hasText: title }),
        ).toBeVisible();
      }

      // Verify no duplication - each thread should appear exactly once
      for (const title of threadTitles) {
        await expect(
          page.getByRole("button").filter({ hasText: title }),
        ).toHaveCount(1);
      }
    },
  );
});

test.describe("Patient Notes - Thread Visibility & Switching", () => {
  let thread1Title: string;
  let thread2Title: string;
  let thread3Title: string;
  let thread1Message: string;
  let thread2Message: string;
  let thread3Message: string;

  test.beforeEach(async ({ page, facilityId, isolatedEncounter }) => {
    // Generate unique data
    thread1Title = `Thread 1 ${faker.string.alphanumeric(8)}`;
    thread2Title = `Thread 2 ${faker.string.alphanumeric(8)}`;
    thread3Title = `Thread 3 ${faker.string.alphanumeric(8)}`;
    thread1Message = `Thread 1 message: ${faker.lorem.sentence()}`;
    thread2Message = `Thread 2 message: ${faker.lorem.sentence()}`;
    thread3Message = `Thread 3 message: ${faker.lorem.sentence()}`;

    // Create three threads with messages on a throwaway patient of this
    // test's own
    const threadsData = [
      { title: thread1Title, message: thread1Message },
      { title: thread2Title, message: thread2Message },
      { title: thread3Title, message: thread3Message },
    ];

    for (const thread of threadsData) {
      await createPatientNoteThreadViaUi(page, {
        facilityId,
        patientId: isolatedEncounter.patientId,
        ...thread,
      });
      await expect(page.getByText(thread.message)).toBeVisible();
    }
  });

  test(
    "should switch between threads and verify each shows only its own messages",
    { tag: ["@atomic", "@cap:patient.notes.view"] },
    async ({ page }) => {
      // Click Thread 1 and verify only its message is visible
      await page.getByRole("button").filter({ hasText: thread1Title }).click();
      await expect(page.getByText(thread1Message)).toBeVisible();
      await expect(page.getByText(thread2Message)).toBeHidden();
      await expect(page.getByText(thread3Message)).toBeHidden();

      // Click Thread 2 and verify only its message is visible
      await page.getByRole("button").filter({ hasText: thread2Title }).click();
      await expect(page.getByText(thread2Message)).toBeVisible();
      await expect(page.getByText(thread1Message)).toBeHidden();
      await expect(page.getByText(thread3Message)).toBeHidden();

      // Click Thread 3 and verify only its message is visible
      await page.getByRole("button").filter({ hasText: thread3Title }).click();
      await expect(page.getByText(thread3Message)).toBeVisible();
      await expect(page.getByText(thread1Message)).toBeHidden();
      await expect(page.getByText(thread2Message)).toBeHidden();

      // Click back to Thread 1 to verify persistence of messages
      await page.getByRole("button").filter({ hasText: thread1Title }).click();
      await expect(page.getByText(thread1Message)).toBeVisible();
      await expect(page.getByText(thread2Message)).toBeHidden();
      await expect(page.getByText(thread3Message)).toBeHidden();
    },
  );

  test(
    "should allow sending messages in different threads and confirm messages stay in respective threads",
    { tag: ["@atomic", "@cap:patient.notes.message"] },
    async ({ page }) => {
      const messageInput = page.getByPlaceholder("Type your message...");
      const newThread1Message = `New message in Thread 1: ${faker.lorem.sentence()}`;
      const newThread2Message = `New message in Thread 2: ${faker.lorem.sentence()}`;

      // Click Thread 1, fill message input, and send a new message
      await page.getByRole("button").filter({ hasText: thread1Title }).click();
      await messageInput.fill(newThread1Message);

      await page.getByRole("button", { name: "Send message" }).click();
      await expect(messageInput).toBeEmpty();

      // Verify both old and new messages are visible in Thread 1
      await expect(page.getByText(newThread1Message)).toBeVisible();
      await expect(page.getByText(thread1Message)).toBeVisible();

      // Click Thread 2, fill message input, and send a new message
      await page.getByRole("button").filter({ hasText: thread2Title }).click();
      await messageInput.fill(newThread2Message);

      await page.getByRole("button", { name: "Send message" }).click();
      await expect(messageInput).toBeEmpty();

      // Verify Thread 2 messages are visible and Thread 1 messages are not visible
      await expect(page.getByText(newThread2Message)).toBeVisible();
      await expect(page.getByText(thread2Message)).toBeVisible();
      await expect(page.getByText(newThread1Message)).toBeHidden();
      await expect(page.getByText(thread1Message)).toBeHidden();

      // Click back to Thread 1 to verify isolation
      await page.getByRole("button").filter({ hasText: thread1Title }).click();
      // Verify Thread 1 messages are visible and Thread 2 messages are not visible
      await expect(page.getByText(newThread1Message)).toBeVisible();
      await expect(page.getByText(thread1Message)).toBeVisible();
      await expect(page.getByText(newThread2Message)).toBeHidden();
      await expect(page.getByText(thread2Message)).toBeHidden();
    },
  );
});
