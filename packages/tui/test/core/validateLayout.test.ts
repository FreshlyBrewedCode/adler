import { describe, test, expect, beforeEach } from "bun:test"
import { validateLayout } from "../../src/core/validateLayout"
import { PanelRegistry } from "../../src/core/PanelRegistry"
import { LayoutRegistry } from "../../src/core/LayoutRegistry"
import { registerPanels } from "../../src/components/panels"
import { registerLayouts } from "../../src/components/layouts"

describe("validateLayout", () => {
  beforeEach(() => {
    PanelRegistry.clear()
    LayoutRegistry.clear()
    registerPanels()
    registerLayouts()
  })

  test("validates correct tabs tree", () => {
    const tree = {
      layout: "tabs",
      content: [{ panel: "overview" }]
    }
    expect(validateLayout(tree)).toEqual([])
  })

  test("validates correct split tree", () => {
    const tree = {
      layout: "split",
      ratio: 0.5,
      content: [{ panel: "overview" }, { panel: "logs" }]
    }
    expect(validateLayout(tree)).toEqual([])
  })

  test("detects unknown panel", () => {
    const tree = { panel: "unknown" }
    expect(validateLayout(tree)).toContain("Unknown panel: unknown")
  })

  test("detects unknown layout", () => {
    const tree = { layout: "grid", content: [{ panel: "overview" }] }
    expect(validateLayout(tree)).toContain("Unknown layout: grid")
  })

  test("detects layout with no children", () => {
    const tree = { layout: "tabs", content: [] }
    expect(validateLayout(tree)).toContain("Layout tabs must have at least one child")
  })

  test("detects split with wrong child count", () => {
    const tree = { layout: "split", content: [{ panel: "overview" }] }
    expect(validateLayout(tree)).toContain("Split layout must have exactly 2 children, got 1")
  })

  test("validates nested layouts recursively", () => {
    const tree = {
      layout: "tabs",
      content: [
        { layout: "split", content: [{ panel: "overview" }, { panel: "unknown-panel" }] }
      ]
    }
    expect(validateLayout(tree)).toContain("Unknown panel: unknown-panel")
  })
})
