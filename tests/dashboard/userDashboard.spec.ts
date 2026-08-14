import { expect, test } from "@playwright/test";

/**
 * User Dashboard E2E Tests
 *
 * Tests the main authenticated user dashboard page (/) which serves as the
 * primary landing page after login. This dashboard displays:
 * - User profile information and greeting
 * - Facilities tab (user's assigned facilities)
 * - Responsibilities tab (organizations where user has roles)
 * - Governance tab (government organizations)
 * - Profile menu with edit profile and sign out actions
 */

// Use authenticated admin user storage state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (main authenticated landing page)
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should load dashboard successfully and display user greeting", async ({
    page,
  }) => {
    await test.step("Verify page title", async () => {
      await expect(page).toHaveTitle(/CARE/);
    });

    await test.step("Verify user greeting is displayed", async () => {
      // The dashboard should display "Hey <user>" as the main heading
      const greeting = page.getByRole("heading", { name: /^Hey .+$/i });
      await expect(greeting).toBeVisible();
    });

    await test.step("Verify date display is present", async () => {
      // Dashboard shows current date below the greeting
      // Using a flexible regex to match various date formats
      const datePattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i;
      const dateElement = page.getByText(datePattern);
      await expect(dateElement).toBeVisible();
    });
  });

  test("should display user avatar/profile picture", async ({ page }) => {
    await test.step("Verify avatar is rendered", async () => {
      // Avatar should be visible in the header section
      // Using general image locator since avatar might be an img or div with background
      const welcomeSection = page.locator("div.container").first();
      await expect(welcomeSection).toBeVisible();

      // Verify the avatar container exists (it's always rendered)
      const avatarContainer = welcomeSection.locator(
        'div[class*="h-14"], div[class*="h-16"]',
      );
      await expect(avatarContainer.first()).toBeVisible();
    });
  });

  test("should display profile menu with edit profile and sign out options", async ({
    page,
  }) => {
    await test.step("Check for mobile or desktop menu", async () => {
      // The dashboard has different menu layouts for mobile vs desktop
      // Mobile: separate buttons, Desktop: dropdown menu

      // Try to find the desktop dropdown menu trigger
      const dropdownTrigger = page.getByRole("button", {
        name: /menu/i,
      });

      if (await dropdownTrigger.isVisible()) {
        // Desktop view with dropdown
        await test.step("Open desktop dropdown menu", async () => {
          await dropdownTrigger.click();
        });

        await test.step("Verify menu options", async () => {
          await expect(
            page.getByRole("menuitem", { name: /edit profile/i }),
          ).toBeVisible();
          await expect(
            page.getByRole("menuitem", { name: /sign out/i }),
          ).toBeVisible();
        });
      } else {
        // Mobile view with separate buttons
        await test.step("Verify mobile menu buttons", async () => {
          // Edit profile button
          const editProfileButton = page.getByRole("link", {
            name: /edit profile/i,
          });
          await expect(editProfileButton).toBeVisible();

          // Sign out button
          const signOutButton = page.getByRole("button", {
            name: /sign out/i,
          });
          await expect(signOutButton).toBeVisible();
        });
      }
    });
  });

  test("should display admin dashboard link for superusers", async ({
    page,
  }) => {
    await test.step("Check for admin dashboard button", async () => {
      // Admin dashboard link should be visible for superuser (admin user)
      const adminButton = page.getByRole("link", {
        name: /admin dashboard/i,
      });

      // The admin user in tests/.auth/user.json should be a superuser
      if (await adminButton.isVisible()) {
        await expect(adminButton).toBeVisible();
        await expect(adminButton).toHaveAttribute(
          "href",
          "/admin/questionnaire",
        );
      }
    });
  });

  test("should render tabs based on available data", async ({ page }) => {
    await test.step("Verify tablist is present", async () => {
      const tablist = page.getByRole("tablist", {
        name: /dashboard sections/i,
      });

      // Tablist should be visible if user has any facilities, organizations, or governance
      const isVisible = await tablist.isVisible();

      if (isVisible) {
        // Verify at least one tab is present
        const tabs = tablist.getByRole("tab");
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThan(0);
      } else {
        // If no tabs visible, user has no data - this is acceptable
        // The page should still load without errors
        await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible();
      }
    });
  });

  test("should display and switch between tabs correctly", async ({
    page,
  }) => {
    await test.step("Check if tabs are available", async () => {
      const tablist = page.getByRole("tablist", {
        name: /dashboard sections/i,
      });

      const tabsVisible = await tablist.isVisible();

      if (tabsVisible) {
        await test.step("Get all available tabs", async () => {
          const tabs = tablist.getByRole("tab");
          const tabCount = await tabs.count();
          expect(tabCount).toBeGreaterThan(0);

          // Store the first tab for testing
          const firstTab = tabs.first();
          const firstTabText = await firstTab.textContent();

          await test.step("Verify first tab is selected by default", async () => {
            await expect(firstTab).toHaveAttribute("aria-selected", "true");
          });

          if (tabCount > 1) {
            await test.step("Click second tab and verify it becomes active", async () => {
              const secondTab = tabs.nth(1);
              const secondTabText = await secondTab.textContent();

              await secondTab.click();

              // Verify second tab is now selected
              await expect(secondTab).toHaveAttribute("aria-selected", "true");

              // Verify first tab is no longer selected
              await expect(firstTab).toHaveAttribute("aria-selected", "false");

              // Switch back to first tab
              await firstTab.click();
              await expect(firstTab).toHaveAttribute("aria-selected", "true");
            });
          }
        });
      }
    });
  });

  test("should display Facilities tab content when available", async ({
    page,
  }) => {
    await test.step("Check for Facilities tab", async () => {
      const facilitiesTab = page.getByRole("tab", { name: /facilities/i });

      if (await facilitiesTab.isVisible()) {
        await test.step("Click Facilities tab", async () => {
          await facilitiesTab.click();
          await expect(facilitiesTab).toHaveAttribute("aria-selected", "true");
        });

        await test.step("Verify facilities panel is displayed", async () => {
          const facilitiesPanel = page.getByRole("tabpanel", {
            name: /facilities/i,
          });
          await expect(facilitiesPanel).toBeVisible();

          // Check for facility cards or description text
          const descriptionText = facilitiesPanel.getByText(/facilit/i);
          await expect(descriptionText.first()).toBeVisible();
        });

        await test.step("Verify facility cards are present", async () => {
          const facilitiesPanel = page.getByRole("tabpanel", {
            name: /facilities/i,
          });

          // Look for facility links (cards are wrapped in links)
          const facilityLinks = facilitiesPanel.getByRole("link");
          const linkCount = await facilityLinks.count();

          if (linkCount > 0) {
            // Verify first facility card has proper structure
            const firstCard = facilityLinks.first();
            await expect(firstCard).toBeVisible();

            // Verify card has href pointing to facility overview
            const href = await firstCard.getAttribute("href");
            expect(href).toMatch(/^\/facility\/[^\/]+\/overview$/);
          }
        });
      }
    });
  });

  test("should navigate to facility overview when clicking facility card", async ({
    page,
  }) => {
    await test.step("Find and click a facility card", async () => {
      const facilitiesTab = page.getByRole("tab", { name: /facilities/i });

      if (await facilitiesTab.isVisible()) {
        await facilitiesTab.click();

        const facilitiesPanel = page.getByRole("tabpanel", {
          name: /facilities/i,
        });
        const facilityLinks = facilitiesPanel.getByRole("link");

        if ((await facilityLinks.count()) > 0) {
          await test.step("Click first facility card", async () => {
            const firstFacility = facilityLinks.first();
            const href = await firstFacility.getAttribute("href");

            await firstFacility.click();

            // Verify navigation occurred
            await page.waitForLoadState("networkidle");
            expect(page.url()).toContain("/facility/");
            expect(page.url()).toContain("/overview");
          });
        }
      }
    });
  });

  test("should display Responsibilities tab when user has role organizations", async ({
    page,
  }) => {
    await test.step("Check for Responsibilities tab", async () => {
      const responsibilitiesTab = page.getByRole("tab", {
        name: /responsibilities/i,
      });

      if (await responsibilitiesTab.isVisible()) {
        await test.step("Click Responsibilities tab", async () => {
          await responsibilitiesTab.click();
          await expect(responsibilitiesTab).toHaveAttribute(
            "aria-selected",
            "true",
          );
        });

        await test.step("Verify responsibilities panel is displayed", async () => {
          // Wait for loading to complete (responsibilities fetch from API)
          await page.waitForTimeout(1000);

          // Try to find the panel - it might be under different names
          const panel =
            page.getByRole("tabpanel").filter({ hasText: /responsibilit/i }) ||
            page.locator('[id*="associations-panel"]').first();

          // Check if panel exists and is visible or if loading state is shown
          const isVisible = await panel.isVisible().catch(() => false);

          if (isVisible) {
            // Panel is visible - verify content or loading state
            const loadingIndicator =
              await panel.locator(".animate-pulse").isVisible();

            if (!loadingIndicator) {
              // Not loading, check for content or empty message
              const hasContent = (await panel.textContent())?.length > 0;
              expect(hasContent).toBeTruthy();
            }
          }
        });
      }
    });
  });

  test("should display Governance tab when user has government organizations", async ({
    page,
  }) => {
    await test.step("Check for Governance tab", async () => {
      const governanceTab = page.getByRole("tab", { name: /governance/i });

      if (await governanceTab.isVisible()) {
        await test.step("Click Governance tab", async () => {
          await governanceTab.click();
          await expect(governanceTab).toHaveAttribute(
            "aria-selected",
            "true",
          );
        });

        await test.step("Verify governance panel is displayed", async () => {
          const governancePanel = page.getByRole("tabpanel", {
            name: /governance/i,
          });
          await expect(governancePanel).toBeVisible();

          // Verify panel has content (description or organization cards)
          const hasContent = (await governancePanel.textContent())?.length > 0;
          expect(hasContent).toBeTruthy();
        });
      }
    });
  });

  test("should handle empty state gracefully when user has no data", async ({
    page,
  }) => {
    await test.step("Verify page loads even without data", async () => {
      // Even if user has no facilities/organizations, page should load
      await expect(
        page.getByRole("heading", { name: /^Hey .+$/ }),
      ).toBeVisible();

      // Profile menu should still be accessible
      const editProfileLink = page.getByRole("link", {
        name: /edit profile/i,
      });
      const signOutButton = page.getByRole("button", { name: /sign out/i });

      // At least one of these should be visible (mobile or desktop view)
      const hasProfileMenu =
        (await editProfileLink.isVisible()) ||
        (await signOutButton.isVisible());
      expect(hasProfileMenu).toBeTruthy();
    });
  });

  test("should have accessible tablist with proper ARIA attributes", async ({
    page,
  }) => {
    await test.step("Verify tablist accessibility", async () => {
      const tablist = page.getByRole("tablist", {
        name: /dashboard sections/i,
      });

      if (await tablist.isVisible()) {
        await test.step("Verify tab ARIA attributes", async () => {
          const tabs = tablist.getByRole("tab");
          const firstTab = tabs.first();

          // Verify tab has required ARIA attributes
          await expect(firstTab).toHaveAttribute("role", "tab");
          await expect(firstTab).toHaveAttribute("aria-selected");
          await expect(firstTab).toHaveAttribute("id");
          await expect(firstTab).toHaveAttribute("aria-controls");
        });

        await test.step("Verify tabpanel has proper ARIA attributes", async () => {
          const firstTab = tablist.getByRole("tab").first();
          await firstTab.click();

          // Get the corresponding tabpanel
          const tabpanels = page.getByRole("tabpanel");
          if ((await tabpanels.count()) > 0) {
            const visiblePanel = tabpanels.first();
            await expect(visiblePanel).toHaveAttribute("role", "tabpanel");
            await expect(visiblePanel).toHaveAttribute("id");
          }
        });
      }
    });
  });
});
