import { describe, test, expect } from "bun:test"
import type { PanelDefinition, LayoutDefinition, TreeNode, LayoutNode, PanelNode } from "../../src/core/types"

describe("core types", () => {
  test("TreeNode array can contain both LayoutNode and PanelNode", () => {
    const nodes: TreeNode[] = [
      { type: "layout", layout: "tabs", props: {}, children: [] },
      { type: "panel", id: "overview" }
    ]
    expect(nodes[0].type).toBe("layout")
    expect(nodes[1].type).toBe("panel")
  })

  test("LayoutNode can contain nested LayoutNode children", () => {
    const node: LayoutNode = {
      type: "layout",
      layout: "split",
      props: { direction: "horizontal" },
      children: [
        {
          type: "layout",
          layout: "tabs",
          props: { tabPosition: "top" },
          children: [{ type: "panel", id: "nested" }]
        }
      ]
    }
    expect(node.children[0].type).toBe("layout")
    expect((node.children[0] as LayoutNode).layout).toBe("tabs")
  })

  test("PanelDefinition hotkeys are optional and can be omitted", () => {
    const panel: PanelDefinition = {
      id: "no-hotkeys",
      title: "No Hotkeys",
      component: () => null
    }
    expect(panel.hotkeys).toBeUndefined()
  })

  test("PanelDefinition has required fields", () => {
    const panel: PanelDefinition = {
      id: "test",
      title: "Test",
      component: () => null,
      hotkeys: [{ key: "a", description: "do a" }]
    }
    expect(panel.hotkeys).toBeDefined()
    expect(panel.hotkeys).toHaveLength(1)
  })

  test("LayoutDefinition has the required fields", () => {
    const layout: LayoutDefinition = {
      id: "tabs",
      component: () => null
    }
    expect(layout.id).toBe("tabs")
    expect(layout.component).toBeDefined()
  })
})
