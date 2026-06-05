import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', titlePart: 'Human AI Lab' },
  { path: '/o-projekcie/', titlePart: 'Human AI Lab' },
  { path: '/badanie/', titlePart: 'Human AI Lab' },
  { path: '/ankieta-chatgpt/', titlePart: 'Human AI Lab' },
  { path: '/badanie-chatboty-ai-lek/', titlePart: 'Human AI Lab' },
  { path: '/polityka-prywatnosci/', titlePart: 'Human AI Lab' }
];

const internalLinks = [
  '/',
  '/o-projekcie/',
  '/badanie/',
  '/ankieta-chatgpt/',
  '/badanie-chatboty-ai-lek/',
  '/polityka-prywatnosci/'
];

const googleFormsDirect = 'https://docs.google.com/forms/d/e/1FAIpQLSfuj0BNkU0sBaPgfFbiwoue3g7htANnou4H53B8lnzWRRyUsw/viewform?usp=header';
const googleFormsEmbedded = 'https://docs.google.com/forms/d/e/1FAIpQLSfuj0BNkU0sBaPgfFbiwoue3g7htANnou4H53B8lnzWRRyUsw/viewform?embedded=true';

test.describe('Human AI Lab static site', () => {
  for (const item of pages) {
    test(`page loads: ${item.path}`, async ({ page }) => {
      const response = await page.goto(item.path, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(item.titlePart, 'i'));
    });
  }

  for (const link of internalLinks) {
    test(`internal route returns 200: ${link}`, async ({ request }) => {
      const response = await request.get(link);
      expect(response.status(), `${link} should return HTTP 200`).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
    });
  }

  test('sitemap and robots exist', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('https://humanai-lab.com/');

    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('Sitemap: https://humanai-lab.com/sitemap.xml');
  });

  test('home page has direct Google Forms CTA', async ({ page }) => {
    await page.goto('/');
    const directLinks = page.locator(`a[href="${googleFormsDirect}"]`);
    await expect(directLinks.first()).toBeVisible();
    expect(await directLinks.count()).toBeGreaterThan(0);
  });

  test('embedded form iframe exists on home page', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator(`iframe[src="${googleFormsEmbedded}"]`);
    await expect(iframe).toBeVisible();
  });

  test('embedded form iframe exists on /badanie/', async ({ page }) => {
    await page.goto('/badanie/');
    const iframe = page.locator(`iframe[src="${googleFormsEmbedded}"]`);
    await expect(iframe).toBeVisible();
  });

  test('all public pages have canonical links', async ({ page }) => {
    for (const item of pages) {
      await page.goto(item.path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = await canonical.first().getAttribute('href');
      expect(href).toMatch(/^https:\/\/humanai-lab\.com\//);
    }
  });

  test('all public pages have one h1', async ({ page }) => {
    for (const item of pages) {
      await page.goto(item.path);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('SEO titles include key long-tail phrases on target pages', async ({ page }) => {
    await page.goto('/ankieta-chatgpt/');
    await expect(page).toHaveTitle(/Ankieta ChatGPT/i);

    await page.goto('/badanie-chatboty-ai-lek/');
    await expect(page).toHaveTitle(/Chatboty AI a lęk/i);
  });

  test('home page contains visible anchor for ankieta ChatGPT', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /ankieta ChatGPT/i }).first()).toBeVisible();
  });

  test('public pages do not render logo in header', async ({ page }) => {
    for (const item of pages) {
      await page.goto(item.path);
      await expect(page.locator('.site-header .brand img')).toHaveCount(0);
    }
  });

  test('public pages render one visible footer logo', async ({ page }) => {
    for (const item of pages) {
      await page.goto(item.path);
      const footerLogo = page.locator('footer .footer-logo');
      await expect(footerLogo).toHaveCount(1);
      await expect(footerLogo).toBeVisible();
    }
  });

  test('home page chips in qualification section stay readable on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto('/');

    const chips = page.locator('section[aria-labelledby="kwalifikacja-heading"] .chip-soft');
    await expect(chips).toHaveCount(4);

    const widths = await chips.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().width))
    );

    for (const width of widths) {
      expect(width).toBeGreaterThanOrEqual(180);
    }
  });

  test('key public pages do not cause horizontal scroll', async ({ page }) => {
    const routes = ['/', '/o-projekcie/', '/badanie/', '/ankieta-chatgpt/', '/badanie-chatboty-ai-lek/'];

    for (const route of routes) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));

      expect(
        dimensions.scrollWidth,
        `${route} should not introduce horizontal scroll`
      ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    }
  });

  test('main navigation and footer links do not point to missing local routes', async ({ page, request }) => {
    for (const item of pages) {
      await page.goto(item.path);

      const hrefs = await page.locator('a[href]').evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href'))
          .filter(Boolean)
      );

      for (const href of hrefs) {
        if (!href) continue;
        if (href.startsWith('#')) continue;
        if (href.startsWith('mailto:')) continue;
        if (href.startsWith('tel:')) continue;
        if (href.startsWith('https://docs.google.com/')) continue;
        if (href.startsWith('https://humanai-lab.com/')) continue;
        if (href.startsWith('http')) continue;

        const resolved = new URL(href, `http://127.0.0.1:4173${item.path}`).pathname;
        const response = await request.get(resolved);
        expect(response.status(), `Broken internal link from ${item.path}: ${href} resolved to ${resolved}`).toBe(200);
      }
    }
  });

  test('CSS and JS assets load without 404', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (
        (url.includes('/assets/') || url.endsWith('.css') || url.endsWith('.js') || url.endsWith('.svg') || url.endsWith('.png')) &&
        response.status() >= 400
      ) {
        failedAssets.push(`${response.status()} ${url}`);
      }
    });

    for (const item of pages) {
      await page.goto(item.path, { waitUntil: 'networkidle' });
    }

    expect(failedAssets).toEqual([]);
  });

  test('no visible page has uncaught JS errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    for (const item of pages) {
      await page.goto(item.path, { waitUntil: 'domcontentloaded' });
    }

    expect(errors).toEqual([]);
  });

  test('share copy button works if present', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    const copyButton = page.getByRole('button', { name: /kopiuj/i });
    if (await copyButton.count()) {
      await copyButton.first().click();
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain('https://humanai-lab.com/');
    }
  });
});
