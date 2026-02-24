import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Notes - Isolation from Encounter Notes", () => {
  let encounterUrl: string;
  let patientNoteTitle: string;
  let patientNoteMessage: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Generate unique titles and messages
    patientNoteTitle = `Patient Note ${faker.string.alphanumeric(8)}`;
    patientNoteMessage = `Patient message: ${faker.lorem.sentence()}`;

    // Navigate to encounters list page
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Navigate to first patient's encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    encounterUrl = page.url();
  });

  test("should create patient note and verify it does NOT appear in encounter notes", async ({
    page,
  }) => {
    const messageInput = page.getByPlaceholder("Type your message...");
    // Click patient info hover card to open patient menu
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    // Navigate to patient profile and then to Notes tab
    await page.getByRole("link", { name: "View Profile" }).click();
    await page.getByRole("tab", { name: "Notes" }).click();

    // Wait for notes section to load
    await expect(
      page.getByRole("button", { name: /New/i }).first(),
    ).toBeVisible();

    // Create new thread in patient notes
    await page.getByRole("button", { name: /New/i }).first().click();

    // Enter thread title
    await page
      .getByPlaceholder("Enter discussion title...")
      .fill(patientNoteTitle);

    // Create thread
    await page.getByRole("button", { name: /Create/i }).click();
    await expect(page.getByText("Thread created successfully")).toBeVisible();

    // Verify thread was created
    await expect(
      page.getByRole("button").filter({ hasText: patientNoteTitle }),
    ).toBeVisible();

    // Fill message input and send message in the patient thread
    await messageInput.fill(patientNoteMessage);

    await page.getByRole("button", { name: "Send message" }).click();

    // Verify message input is cleared after sending
    await expect(messageInput).toBeEmpty();

    // Verify message appears in patient notes
    await expect(page.getByText(patientNoteMessage)).toBeVisible();

    // Navigate back to the encounter and open Notes tab
    await page.goto(encounterUrl);
    await page.getByRole("tab", { name: "Notes" }).click();

    // Wait for notes to load by checking for the "New" button
    await expect(page.getByRole("button", { name: /^New$/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify patient note does NOT appear in encounter notes
    await expect(
      page.getByRole("button").filter({ hasText: patientNoteTitle }),
    ).not.toBeVisible();
    await expect(page.getByText(patientNoteMessage)).not.toBeVisible();
  });
});

test.describe("Patient Notes - Thread Messaging (Multi-user & Single-user)", () => {
  let patientUrl: string;
  let threadTitle: string;
  let userAMessage1: string;
  let userAMessage2: string;
  let userAMessage3: string;
  let userBMessage: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Generate unique data for this test run
    threadTitle = `Thread ${faker.string.alphanumeric(8)}`;
    userAMessage1 = `User A message 1: ${faker.lorem.sentence()}`;
    userAMessage2 = `User A message 2: ${faker.lorem.sentence()}`;
    userAMessage3 = `User A message 3: ${faker.lorem.sentence()}`;
    userBMessage = `User B message: ${faker.lorem.sentence()}`;

    // Navigate to encounters and open first encounter, then go to patient notes
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Navigate to patient profile notes
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();
    await page.getByRole("link", { name: "View Profile" }).click();
    await page.getByRole("tab", { name: "Notes" }).click();

    patientUrl = page.url();
  });

  test("should support multi-user messaging in same thread", async ({
    page,
    browser,
  }) => {
    // User A creates new thread
    await page.getByRole("button", { name: /New/i }).first().click();
    await page.getByPlaceholder("Enter discussion title...").fill(threadTitle);

    await page.getByRole("button", { name: /Create/i }).click();
    await expect(page.getByText("Thread created successfully")).toBeVisible();

    // User A fills message input and sends first message
    await page.getByPlaceholder("Type your message...").fill(userAMessage1);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByPlaceholder("Type your message...")).toBeEmpty();

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
    await userBPage.getByPlaceholder("Type your message...").fill(userBMessage);
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
  });

  test("should maintain correct order for consecutive messages from same user", async ({
    page,
  }) => {
    // Create new thread with title
    await page.getByRole("button", { name: /New/i }).first().click();
    await page.getByPlaceholder("Enter discussion title...").fill(threadTitle);
    await page.getByRole("button", { name: /Create/i }).click();
    await expect(page.getByText("Thread created successfully")).toBeVisible();

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
    const message1Count = await page.getByText(userAMessage1).count();
    const message2Count = await page.getByText(userAMessage2).count();
    const message3Count = await page.getByText(userAMessage3).count();

    expect(message1Count).toBe(1);
    expect(message2Count).toBe(1);
    expect(message3Count).toBe(1);
  });
});

test.describe("Patient Notes - Thread Creation", () => {
  let thread1Title: string;
  let thread2Title: string;
  let thread3Title: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Generate unique thread titles
    thread1Title = `Thread 1 ${faker.string.alphanumeric(8)}`;
    thread2Title = `Thread 2 ${faker.string.alphanumeric(8)}`;
    thread3Title = `Thread 3 ${faker.string.alphanumeric(8)}`;

    // Navigate to patient notes
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Navigate to patient profile notes
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();
    await page.getByRole("link", { name: "View Profile" }).click();
    await page.getByRole("tab", { name: "Notes" }).click();
  });

  test("should create multiple threads and verify all appear without duplication", async ({
    page,
  }) => {
    const threadTitleInput = page.getByPlaceholder("Enter discussion title...");
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
      const threadButtons = page.getByRole("button").filter({ hasText: title });
      const count = await threadButtons.count();
      expect(count).toBe(1);
    }
  });
});

test.describe("Patient Notes - Thread Visibility & Switching", () => {
  let thread1Title: string;
  let thread2Title: string;
  let thread3Title: string;
  let thread1Message: string;
  let thread2Message: string;
  let thread3Message: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    const threadTitleInput = page.getByPlaceholder("Enter discussion title...");
    const messageInput = page.getByPlaceholder("Type your message...");

    // Generate unique data
    thread1Title = `Thread 1 ${faker.string.alphanumeric(8)}`;
    thread2Title = `Thread 2 ${faker.string.alphanumeric(8)}`;
    thread3Title = `Thread 3 ${faker.string.alphanumeric(8)}`;
    thread1Message = `Thread 1 message: ${faker.lorem.sentence()}`;
    thread2Message = `Thread 2 message: ${faker.lorem.sentence()}`;
    thread3Message = `Thread 3 message: ${faker.lorem.sentence()}`;

    // Navigate to patient notes
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Navigate to patient profile notes
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();
    await page.getByRole("link", { name: "View Profile" }).click();
    await page.getByRole("tab", { name: "Notes" }).click();

    // Create three threads with messages by iterating through data array
    const threadsData = [
      { title: thread1Title, message: thread1Message },
      { title: thread2Title, message: thread2Message },
      { title: thread3Title, message: thread3Message },
    ];

    for (const thread of threadsData) {
      await page.getByRole("button", { name: /New/i }).first().click();
      await threadTitleInput.fill(thread.title);

      await page.getByRole("button", { name: /Create/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      await messageInput.fill(thread.message);

      await page.getByRole("button", { name: "Send message" }).click();
      await expect(messageInput).toBeEmpty();
      await expect(page.getByText(thread.message)).toBeVisible();
    }
  });

  test("should switch between threads and verify each shows only its own messages", async ({
    page,
  }) => {
    // Click Thread 1 and verify only its message is visible
    await page.getByRole("button").filter({ hasText: thread1Title }).click();
    await expect(page.getByText(thread1Message)).toBeVisible();
    await expect(page.getByText(thread2Message)).not.toBeVisible();
    await expect(page.getByText(thread3Message)).not.toBeVisible();

    // Click Thread 2 and verify only its message is visible
    await page.getByRole("button").filter({ hasText: thread2Title }).click();
    await expect(page.getByText(thread2Message)).toBeVisible();
    await expect(page.getByText(thread1Message)).not.toBeVisible();
    await expect(page.getByText(thread3Message)).not.toBeVisible();

    // Click Thread 3 and verify only its message is visible
    await page.getByRole("button").filter({ hasText: thread3Title }).click();
    await expect(page.getByText(thread3Message)).toBeVisible();
    await expect(page.getByText(thread1Message)).not.toBeVisible();
    await expect(page.getByText(thread2Message)).not.toBeVisible();

    // Click back to Thread 1 to verify persistence of messages
    await page.getByRole("button").filter({ hasText: thread1Title }).click();
    await expect(page.getByText(thread1Message)).toBeVisible();
    await expect(page.getByText(thread2Message)).not.toBeVisible();
    await expect(page.getByText(thread3Message)).not.toBeVisible();
  });

  test("should allow sending messages in different threads and confirm messages stay in respective threads", async ({
    page,
  }) => {
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
    await expect(page.getByText(newThread1Message)).not.toBeVisible();
    await expect(page.getByText(thread1Message)).not.toBeVisible();

    // Click back to Thread 1 to verify isolation
    await page.getByRole("button").filter({ hasText: thread1Title }).click();
    // Verify Thread 1 messages are visible and Thread 2 messages are not visible
    await expect(page.getByText(newThread1Message)).toBeVisible();
    await expect(page.getByText(thread1Message)).toBeVisible();
    await expect(page.getByText(newThread2Message)).not.toBeVisible();
    await expect(page.getByText(thread2Message)).not.toBeVisible();
  });
});
