import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("undue-onboarded", "1");
    window.localStorage.setItem("undue-notifications", "0");
  });
});

test("adds a subscription and opens its deadline detail", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /your deadlines/i })).toBeVisible();

  await page.getByRole("button", { name: /add your first/i }).click();
  const dialog = page.getByRole("dialog", { name: /add a subscription/i });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Netflix", exact: true }).click();
  await dialog.getByLabel("Price").fill("4400");
  await dialog.getByRole("button", { name: /add netflix/i }).click();

  await expect(page.getByText("Subscription added")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Netflix" })).toBeVisible();

  await page.getByRole("button", { name: /open netflix/i }).click();
  await expect(page.getByText(/last day to cancel/i).first()).toBeVisible();
  await expect(page.getByText(/paid via/i)).toBeVisible();
});

test("exposes absolute social metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Undue/i);
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveAttribute("content", /opengraph-image/);
  const ogUrl = page.locator('meta[property="og:url"]');
  await expect(ogUrl).toHaveAttribute("content", /undue\.netlify\.app|localhost/);
});
