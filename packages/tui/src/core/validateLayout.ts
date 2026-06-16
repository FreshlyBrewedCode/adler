import type { TreeNode } from "./types"
import { PanelRegistry } from "./PanelRegistry"
import { LayoutRegistry } from "./LayoutRegistry"

export function validateLayout(node: TreeNode): string[] {
  const errors: string[] = []

  if ("panel" in node) {
    if (!PanelRegistry.get(node.panel)) {
      errors.push(`Unknown panel: ${node.panel}`)
    }
    return errors
  }

  const layout = LayoutRegistry.get(node.layout)
  if (!layout) {
    errors.push(`Unknown layout: ${node.layout}`)
    return errors
  }

  if (node.content.length === 0) {
    errors.push(`Layout ${node.layout} must have at least one child`)
  }

  if (node.layout === "split" && node.content.length !== 2) {
    errors.push(`Split layout must have exactly 2 children, got ${node.content.length}`)
  }

  for (const child of node.content) {
    errors.push(...validateLayout(child as TreeNode))
  }

  return errors
}
