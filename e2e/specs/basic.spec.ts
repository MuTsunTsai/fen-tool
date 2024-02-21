import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Basic UI", async ({ page }) => {
	await expect(page).toHaveTitle(/FEN Tool/);
	const cnvMain = page.getByRole("application");
	await expect(cnvMain).toBeInViewport();
	await expect(cnvMain).toHaveScreenshot();
	const cnvTemplate = page.getByRole("menu");
	await expect(cnvTemplate).toBeInViewport();
	await expect(cnvTemplate).toHaveScreenshot();
});
