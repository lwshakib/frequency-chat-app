import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should redirect to sign-in page if not authenticated", async ({
    page,
  }) => {
    // Start from the home page
    await page.goto("/");

    // The app should redirect unauthenticated users to /sign-in
    await expect(page).toHaveURL(/\/sign-in/);

    // Check for the Sign In heading
    const signInTitle = page.getByText(/Sign In to Frequency/i);
    await expect(signInTitle).toBeVisible();
  });

  test("should load the sign-up page", async ({ page }) => {
    await page.goto("/sign-up");

    // Check for "Create a Frequency Account"
    const signUpTitle = page.getByText(/Create a Frequency Account/i);
    await expect(signUpTitle).toBeVisible();
  });

  test("should navigate back to sign-in from sign-up", async ({ page }) => {
    await page.goto("/sign-up");

    // Find the link to sign in
    // Note: The link text in sign-up is exactly "Sign In"
    const signInLink = page.locator("text=Sign In").last();
    await signInLink.click();

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
