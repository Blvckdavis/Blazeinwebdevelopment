import { test, expect, chromium } from '@playwright/test'

const specs = [
  ['Display', '13.4-inch 2.5K IPS Touchscreen, 120Hz Variable Refresh'],
  ['Processor', 'Intel Core 5 320 (Wildcat Lake), up to 4.6 GHz'],
  ['Memory', '16GB LPDDR5X'],
  ['Storage', '512GB M.2 PCIe Gen 4 NVMe SSD'],
  ['Graphics', 'Intel Xe3 Graphics (2-Core)'],
  ['Battery', '52Wh Li-Po, 65W USB-C Fast Charging'],
  ['Connectivity', 'Intel Wi-Fi 7, Bluetooth 6.0'],
  ['Dimensions', '12.7mm thin, 1.0kg'],
  ['Ports', '2x USB 4.0 Type-C'],
]

async function openSpecs(page) {
  await page.getByRole('link', { name: 'Explore XPS 13' }).click()
  await page.getByRole('button', { name: 'View Full Specs' }).click()
  const dialog = page.getByRole('dialog', { name: 'Technical specifications' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close specifications', exact: true })).toBeFocused()
  return dialog
}

test('specs drawer renders exact data, traps focus, restores focus and closes three ways', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const dialog = await openSpecs(page)
  for (const [key, value] of specs) {
    await expect(dialog.locator('dt').filter({ hasText: new RegExp(`^${key}$`) })).toHaveCount(1)
    await expect(dialog.locator('dd').filter({ hasText: value })).toHaveCount(1)
  }
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close specifications' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Close specifications' })).toBeFocused()
  await expect.poll(async () => Math.round((await page.locator('.specs-panel').boundingBox()).x)).toBe(1040)
  await page.screenshot({ path: 'artifacts/specs-desktop.png' })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'View Full Specs' })).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await openSpecs(page)
  await dialog.getByRole('button', { name: 'Close specifications' }).click()
  await expect(dialog).not.toBeVisible()
  await openSpecs(page)
  await page.mouse.click(200, 200)
  await expect(dialog).not.toBeVisible()
  expect(errors).toEqual([])
})

test('mobile reduced-motion drawer fits, scrolls all rows, and retains a native cursor', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const dialog = await openSpecs(page)
  await expect(page.locator('.liquid-metal-layer')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/cursor-active/)
  const panel = await page.locator('.specs-panel').boundingBox()
  expect(panel.x).toBe(0)
  expect(panel.width).toBe(320)
  await dialog.locator('dd').last().scrollIntoViewIfNeeded()
  await expect(dialog.getByText('2x USB 4.0 Type-C', { exact: true })).toBeInViewport()
  await page.screenshot({ path: 'artifacts/specs-mobile.png' })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('liquid-metal canvas, per-letter reveal and cursor react to the page controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'DELL XPS 13', exact: true })).toBeVisible()
  await expect(page.locator('.hero-letter')).toHaveCount(11)
  await expect(page.locator('.hero-letter').last()).toHaveCSS('opacity', '1')
  await expect(page.locator('.liquid-metal-layer canvas')).toBeVisible()
  await expect(page.locator('.liquid-metal-layer')).toHaveAttribute('data-motion', 'running')
  await page.getByRole('link', { name: 'Overview', exact: true }).hover()
  await expect(page.locator('html')).toHaveClass(/cursor-over-control/)
  await expect(page.locator('body > .custom-cursor')).toHaveCSS('width', '24px')
  await expect(page.locator('body > .custom-cursor')).toHaveCSS('mix-blend-mode', 'difference')
  await page.mouse.move(600, 700)
  await expect(page.locator('body > .custom-cursor')).toHaveCSS('width', '8px')
  await page.screenshot({ path: 'artifacts/liquid-metal-intro.png' })
  await page.getByRole('button', { name: 'Pause background video' }).click()
  await expect(page.locator('.liquid-metal-layer')).toHaveAttribute('data-motion', 'paused')
  await page.getByRole('button', { name: 'Play background video' }).click()
  await expect(page.locator('.liquid-metal-layer')).toHaveAttribute('data-motion', 'running')
  await openSpecs(page)
  await expect(page.locator('.liquid-metal-layer')).toHaveAttribute('data-motion', 'paused')
})

test('blocked WebGL scene chunk preserves content and the specs drawer', async ({ page }) => {
  await page.route('**/components/LiquidMetalScene*', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'DELL XPS 13', exact: true })).toBeVisible()
  await openSpecs(page)
  await expect(page.getByRole('dialog').getByText('16GB LPDDR5X', { exact: true })).toBeVisible()
})

test('WebGL unavailable preserves the film and specs controls', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-webgl'] })
  try {
    const page = await browser.newPage()
    await page.goto('http://127.0.0.1:5173/')
    await expect(page.getByRole('heading', { name: 'DELL XPS 13', exact: true })).toBeVisible()
    await openSpecs(page)
  } finally { await browser.close() }
})
