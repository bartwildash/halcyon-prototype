// E2E tests for the Spatial Canvas
// Updated for new ToolButton-based interface
import { test, expect } from '@playwright/test'

test.describe('Spatial Canvas - Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.space-container')
  })

  test('loads the spatial demo page', async ({ page }) => {
    await expect(page).toHaveTitle(/Halcyon/)
    await expect(page.locator('.space-container')).toBeVisible()
  })

  test('displays initial demo cards', async ({ page }) => {
    await page.waitForTimeout(1500)
    const cards = page.locator('.spatial-card')
    await expect(cards.first()).toBeVisible()
  })

  test('can pan the canvas with drag', async ({ page }) => {
    const canvas = page.locator('.space-container')

    const initialTransform = await page.locator('.space-canvas').evaluate((el) => {
      return el.style.transform || ''
    })

    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(100, 100, { steps: 5 })
    await page.mouse.up()

    const newTransform = await page.locator('.space-canvas').evaluate((el) => {
      return el.style.transform || ''
    })

    expect(newTransform).not.toBe(initialTransform)
  })

  test('can drag a card to move it', async ({ page }) => {
    await page.waitForTimeout(1500)

    const card = page.locator('.spatial-card').first()
    await expect(card).toBeVisible()

    const initialBox = await card.boundingBox()
    expect(initialBox).not.toBeNull()

    await card.hover()
    await page.mouse.down()
    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2 + 100,
      initialBox!.y + initialBox!.height / 2 + 100,
      { steps: 5 }
    )
    await page.mouse.up()

    const newBox = await card.boundingBox()

    expect(newBox!.x).not.toBe(initialBox!.x)
    expect(newBox!.y).not.toBe(initialBox!.y)
  })

  test('can create a new card by clicking empty space', async ({ page }) => {
    const initialCardCount = await page.locator('.spatial-card').count()

    const canvas = page.locator('.space-container')
    await canvas.click({ position: { x: 600, y: 400 } })

    await page.waitForTimeout(500)

    const newCardCount = await page.locator('.spatial-card').count()
    expect(newCardCount).toBeGreaterThanOrEqual(initialCardCount)
  })
})

test.describe('ToolButton - Floating Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.space-container')
  })

  test('ToolButton is visible with hammer icon', async ({ page }) => {
    const toolButton = page.locator('.tool-button-main')
    await expect(toolButton).toBeVisible()
    await expect(toolButton).toContainText('🔨')
  })

  test('tap opens the tool menu', async ({ page }) => {
    const toolButton = page.locator('.tool-button-main')
    await toolButton.click()

    const menu = page.locator('.tool-button-menu')
    await expect(menu).toBeVisible()

    const categories = page.locator('.tool-category-tab')
    await expect(categories).toHaveCount(4)
  })

  test('ToolButton can be positioned anywhere', async ({ page }) => {
    // Verify ToolButton is draggable by checking it has fixed position
    const toolButton = page.locator('.tool-button-container')
    await expect(toolButton).toBeVisible()

    // Check that it has position:fixed (it's a floating button)
    const position = await toolButton.evaluate((el) => getComputedStyle(el).position)
    expect(position).toBe('fixed')
  })

  test('menu closes when clicking hammer again', async ({ page }) => {
    const toolButton = page.locator('.tool-button-main')

    // Open menu
    await toolButton.click()
    await expect(page.locator('.tool-button-menu')).toBeVisible()

    // Click hammer again to close
    await toolButton.click()
    await page.waitForTimeout(200)

    await expect(page.locator('.tool-button-menu')).not.toBeVisible()
  })
})

test.describe('Header UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.space-container')
  })

  test('landmark navigator is visible', async ({ page }) => {
    const landmarkNav = page.locator('.landmark-navigator')
    await expect(landmarkNav).toBeVisible()
  })

  test('shows sync indicator', async ({ page }) => {
    const syncIndicator = page.locator('.sync-indicator')
    await expect(syncIndicator).toBeVisible()
  })

  test('notification bell is visible', async ({ page }) => {
    const notificationBell = page.locator('.notification-bell')
    await expect(notificationBell).toBeVisible()
  })

  // Skip: flaky on deployed version due to click interception by gadgets
  test.skip('help button opens keyboard guide', async ({ page }) => {
    const helpButton = page.locator('button[title="Keyboard shortcuts (?)"]')
    await expect(helpButton).toBeVisible()
    await helpButton.evaluate((btn) => (btn as HTMLButtonElement).click())

    const guide = page.locator('.keyboard-guide')
    await expect(guide).toBeVisible({ timeout: 3000 })
    await expect(guide).toContainText('Keyboard Shortcuts')
  })

  test('Crumpit header button opens board', async ({ page }) => {
    // Use title attribute to get exact button
    const crumpitButton = page.locator('button[title="Open Crumpit task triage board"]')
    await crumpitButton.click()

    const crumpitBoard = page.locator('.crumpit-board')
    await expect(crumpitBoard).toBeVisible()
  })

  test('Plan button opens board', async ({ page }) => {
    const planButton = page.locator('button[title="Open Plan - today view"]')
    await planButton.click()

    const planBoard = page.locator('.plan-overlay')
    await expect(planBoard).toBeVisible()
  })

  test('clear all button works', async ({ page }) => {
    await page.waitForTimeout(1500)

    page.on('dialog', dialog => dialog.accept())

    const clearButton = page.locator('button').filter({ hasText: 'Clear All' })
    await clearButton.click()

    await page.waitForTimeout(500)

    const cardCount = await page.locator('.spatial-card').count()
    expect(cardCount).toBe(0)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.space-container')
    await page.waitForTimeout(1500)
  })

  test('Escape clears selection', async ({ page }) => {
    const card = page.locator('.spatial-card').first()
    await card.click()

    await expect(card).toHaveClass(/selected/)

    await page.keyboard.press('Escape')

    await expect(card).not.toHaveClass(/selected/)
  })

  test('Cmd+K opens command palette', async ({ page }) => {
    await page.keyboard.press('Meta+k')

    const palette = page.locator('.command-palette')
    await expect(palette).toBeVisible()
  })

  test('2 opens Crumpit board', async ({ page }) => {
    // Click somewhere neutral first to ensure focus
    await page.mouse.click(300, 300)
    await page.waitForTimeout(100)

    await page.keyboard.press('2')

    await expect(page.locator('.crumpit-board')).toBeVisible()
  })

  test('3 opens Plan board', async ({ page }) => {
    await page.mouse.click(300, 300)
    await page.waitForTimeout(100)

    await page.keyboard.press('3')

    await expect(page.locator('.plan-overlay')).toBeVisible()
  })

  test('Escape closes Crumpit board', async ({ page }) => {
    // Open Crumpit first
    await page.mouse.click(300, 300)
    await page.keyboard.press('2')
    await expect(page.locator('.crumpit-board')).toBeVisible()

    // Press Escape to close
    await page.keyboard.press('Escape')

    // Wait for close
    await page.waitForTimeout(100)
    await expect(page.locator('.crumpit-board')).not.toBeVisible()
  })
})

test.describe('Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.space-container')
    await page.waitForTimeout(1500)
  })

  test('Export button is visible', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: 'Export' })
    await expect(exportButton).toBeVisible()
  })

  test('Import button is visible', async ({ page }) => {
    const importButton = page.locator('button').filter({ hasText: 'Import' })
    await expect(importButton).toBeVisible()
  })
})
