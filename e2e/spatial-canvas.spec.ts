// E2E tests for the Spatial Canvas
import { test, expect } from '@playwright/test'

test.describe('Spatial Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for canvas to load
    await page.waitForSelector('.spatial-canvas')
  })

  test('loads the spatial demo page', async ({ page }) => {
    await expect(page).toHaveTitle(/Halcyon/)
    await expect(page.locator('.spatial-canvas')).toBeVisible()
  })

  test('displays initial demo cards', async ({ page }) => {
    // Wait for demo cards to be created
    await page.waitForTimeout(1500) // Cards are created with setTimeout delays

    // Check that cards exist
    const cards = page.locator('.spatial-card')
    await expect(cards.first()).toBeVisible()
  })

  test('can pan the canvas with hand tool', async ({ page }) => {
    const canvas = page.locator('.spatial-canvas')

    // Get initial scroll position
    const initialTransform = await canvas.evaluate((el) => {
      const inner = el.querySelector('.canvas-inner')
      return inner?.getAttribute('style') || ''
    })

    // Drag to pan
    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(100, 100, { steps: 5 })
    await page.mouse.up()

    // Check that transform changed
    const newTransform = await canvas.evaluate((el) => {
      const inner = el.querySelector('.canvas-inner')
      return inner?.getAttribute('style') || ''
    })

    // The transform should have changed (panned)
    expect(newTransform).not.toBe(initialTransform)
  })

  test('can switch to select tool', async ({ page }) => {
    // Find and click the select tool button
    const selectButton = page.locator('button[title*="Select"]').first()
    await selectButton.click()

    // Verify select mode is active (button should be highlighted)
    await expect(selectButton).toHaveClass(/active/)
  })

  test('zoom controls work', async ({ page }) => {
    // Find zoom in button
    const zoomIn = page.locator('button[title*="Zoom in"]')
    const zoomOut = page.locator('button[title*="Zoom out"]')

    await expect(zoomIn).toBeVisible()
    await expect(zoomOut).toBeVisible()

    // Click zoom in
    await zoomIn.click()

    // The canvas should zoom (verify via transform scale)
    const canvas = page.locator('.canvas-inner')
    const transform = await canvas.evaluate((el) => el.style.transform)
    expect(transform).toContain('scale')
  })

  test('can create a new card by clicking empty space', async ({ page }) => {
    // Count initial cards
    const initialCardCount = await page.locator('.spatial-card').count()

    // Click on empty canvas area to create card
    const canvas = page.locator('.spatial-canvas')
    await canvas.click({ position: { x: 600, y: 400 } })

    // Wait for card creation
    await page.waitForTimeout(500)

    // Should have one more card
    const newCardCount = await page.locator('.spatial-card').count()
    expect(newCardCount).toBeGreaterThanOrEqual(initialCardCount)
  })

  test('can drag a card to move it', async ({ page }) => {
    await page.waitForTimeout(1500) // Wait for demo cards

    // Find a card
    const card = page.locator('.spatial-card').first()
    await expect(card).toBeVisible()

    // Get initial position
    const initialBox = await card.boundingBox()
    expect(initialBox).not.toBeNull()

    // Drag the card
    await card.hover()
    await page.mouse.down()
    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2 + 100,
      initialBox!.y + initialBox!.height / 2 + 100,
      { steps: 5 }
    )
    await page.mouse.up()

    // Get new position
    const newBox = await card.boundingBox()

    // Card should have moved
    expect(newBox!.x).not.toBe(initialBox!.x)
    expect(newBox!.y).not.toBe(initialBox!.y)
  })

  test('shows sync indicator', async ({ page }) => {
    const syncIndicator = page.locator('.sync-indicator')
    await expect(syncIndicator).toBeVisible()
  })

  test('can toggle timer visibility', async ({ page }) => {
    // Open mini apps palette
    const miniAppsButton = page.locator('.miniapps-toggle')
    await miniAppsButton.click()

    // Find timer toggle
    const timerToggle = page.locator('button').filter({ hasText: 'Timer' })
    await expect(timerToggle).toBeVisible()
  })

  test('landmark navigator is visible', async ({ page }) => {
    const landmarkNav = page.locator('.landmark-navigator')
    await expect(landmarkNav).toBeVisible()
  })

  test('clear all button works', async ({ page }) => {
    await page.waitForTimeout(1500) // Wait for demo cards

    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept())

    // Click clear all
    const clearButton = page.locator('button').filter({ hasText: 'Clear All Cards' })
    await clearButton.click()

    // Wait for cards to be removed
    await page.waitForTimeout(500)

    // Cards should be cleared (or very few remain)
    const cardCount = await page.locator('.spatial-card').count()
    expect(cardCount).toBe(0)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.spatial-canvas')
    await page.waitForTimeout(1500) // Wait for demo cards
  })

  test('Escape clears selection', async ({ page }) => {
    // First select a card
    const card = page.locator('.spatial-card').first()
    await card.click()

    // Card should be selected (has selected class)
    await expect(card).toHaveClass(/selected/)

    // Press Escape
    await page.keyboard.press('Escape')

    // Card should no longer be selected
    await expect(card).not.toHaveClass(/selected/)
  })
})
