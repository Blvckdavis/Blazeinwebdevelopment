import { test, expect } from '@playwright/test'

async function settle(page) {
  await page.waitForTimeout(1200)
}

test('desktop film, chapter navigation, scroll speed and purchase destination', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('video')).toHaveClass(/is-ready/)
  await expect.poll(() => page.locator('video').evaluate(v => v.paused)).toBe(false)
  const initialRate = await page.locator('video').evaluate(v => v.playbackRate)
  await page.getByRole('button', { name: 'Pause background video' }).click()
  const pausedAt = await page.locator('video').evaluate(v => v.currentTime)
  await settle(page)
  expect(await page.locator('video').evaluate(v => v.currentTime)).toBeCloseTo(pausedAt, 1)
  await page.screenshot({ path: 'artifacts/desktop-intro.png' })
  await page.getByRole('link', { name: 'Discover the extraordinary' }).click()
  await settle(page)
  await expect(page.locator('#craft')).toBeInViewport()
  expect(await page.locator('video').evaluate(v => v.playbackRate)).toBeGreaterThan(initialRate)
  await page.screenshot({ path: 'artifacts/desktop-features.png' })
  await page.getByRole('link', { name: 'Explore XPS 13' }).click()
  await settle(page)
  const buy = page.getByRole('link', { name: 'BUY XPS 13', exact: true })
  await expect(buy).toBeInViewport()
  await expect(buy).toHaveAttribute('href', /https:\/\/www\.dell\.com\//)
  await expect(page.locator('.finale-panel')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: 'artifacts/desktop-finale.png' })
  await page.getByRole('button', { name: 'Play background video' }).click()
  await expect.poll(() => page.locator('video').evaluate(v => v.paused)).toBe(false)
  expect(errors).toEqual([])
})

for (const width of [320, 390, 768, 1024]) {
  test(`responsive ${width}px keeps panels and controls inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('video')).toHaveClass(/is-ready/)
    await expect(page.locator('video')).toHaveJSProperty('paused', true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/intro-${width}.png` })
    await page.getByRole('link', { name: 'Discover the extraordinary' }).click()
    for (const card of await page.locator('.feature-card').all()) {
      const box = await card.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      await expect(card).toHaveCSS('opacity', '1')
    }
    await page.screenshot({ path: `artifacts/features-${width}.png` })
    await page.getByRole('link', { name: 'Explore XPS 13' }).click()
    await expect(page.getByRole('link', { name: 'BUY XPS 13', exact: true })).toBeInViewport()
    await page.screenshot({ path: `artifacts/finale-${width}.png` })
  })
}

test('video failure retains still artwork, readable content, and keyboard navigation', async ({ page }) => {
  await page.route('**/dell-xps-explosion.mp4', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('Background film unavailable')
  await expect(page.locator('.video-poster')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to features' })).toBeFocused()
  await page.keyboard.press('Enter')
  await settle(page)
  await expect(page.locator('#craft')).toBeInViewport()
})

test('animated mobile chapter links reveal content and hide the fixed introduction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('video')).toHaveClass(/is-ready/)
  await page.getByRole('link', { name: 'Discover the extraordinary' }).click()
  await settle(page)
  await expect(page.locator('.hero-copy')).toHaveCSS('visibility', 'hidden')
  await expect(page.locator('#craft')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: 'artifacts/mobile-motion-features.png' })
  await page.getByRole('link', { name: 'Explore XPS 13' }).click()
  await settle(page)
  await expect(page.getByRole('link', { name: 'BUY XPS 13', exact: true })).toBeInViewport()
  await page.screenshot({ path: 'artifacts/mobile-motion-finale.png' })
})

for (const [width, height] of [[320, 480], [667, 375], [844, 390]]) {
  test(`compact ${width}x${height} separates hero copy and specs`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const hero = await page.locator('.hero-copy').boundingBox()
    const specs = await page.locator('.hero-specs').boundingBox()
    expect(hero.y + hero.height).toBeLessThan(specs.y)
    await page.getByRole('link', { name: 'Explore XPS 13' }).click()
    await expect(page.getByRole('link', { name: 'BUY XPS 13', exact: true })).toBeInViewport()
    const buyBox = await page.getByRole('link', { name: 'BUY XPS 13', exact: true }).boundingBox()
    expect(buyBox.y + buyBox.height).toBeLessThanOrEqual(height - 65)
    const panel = await page.locator('.finale-panel').boundingBox()
    const section = await page.locator('.finale').boundingBox()
    expect(panel.y + panel.height).toBeLessThanOrEqual(section.y + section.height)
    await page.screenshot({ path: `artifacts/compact-${width}-${height}.png` })
  })
}

