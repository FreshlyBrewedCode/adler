import { Box, Text } from "ink"
import type { TreeNode } from "./types"
import { PanelRegistry } from "./PanelRegistry"
import { LayoutRegistry } from "./LayoutRegistry"
import { PanelChrome } from "../components/PanelChrome"
import type { AppState, AppAction } from "../types"
import React from "react"

interface LayoutRendererProps {
  node: TreeNode
  state: AppState
  dispatch: React.Dispatch<AppAction>
  width: number
  height: number
  focusPath: number[]
  onFocusChange: (path: number[]) => void
}

export function LayoutRenderer({
  node,
  state,
  dispatch,
  width,
  height,
  focusPath,
  onFocusChange,
}: LayoutRendererProps) {
  if (node.type === "panel") {
    const panel = PanelRegistry.get(node.id)
    if (!panel) {
      return (
        <Box width={width} height={height}>
          <Text color="red">Unknown panel: {node.id}</Text>
        </Box>
      )
    }
    return (
      <PanelChrome title={panel.title} width={width} height={height}>
        <panel.component state={state} dispatch={dispatch} width={width} height={height} />
      </PanelChrome>
    )
  }

  const layout = LayoutRegistry.get(node.layout)
  if (!layout) {
    return (
      <Box width={width} height={height}>
        <Text color="red">Unknown layout: {node.layout}</Text>
      </Box>
    )
  }

  const children = node.children.map((child, i) => {
    let childWidth = width
    let childHeight = height

    if (node.layout === "split") {
      const ratio = (node.props.ratio as number) ?? 0.5
      const direction = (node.props.direction as "horizontal" | "vertical") ?? "horizontal"
      if (direction === "horizontal") {
        childWidth = i === 0 ? Math.floor(width * ratio) : width - Math.floor(width * ratio)
      } else {
        childHeight = i === 0 ? Math.floor(height * ratio) : height - Math.floor(height * ratio)
      }
    }

    return (
      <LayoutRenderer
        key={i}
        node={child}
        state={state}
        dispatch={dispatch}
        width={childWidth}
        height={childHeight}
        focusPath={focusPath.slice(1)}
        onFocusChange={(subPath) => onFocusChange([i, ...subPath])}
      />
    )
  })

  return (
    <layout.component
      layoutProps={node.props}
      width={width}
      height={height}
      state={state}
      dispatch={dispatch}
      focusPath={focusPath}
      onFocusChange={onFocusChange}
    >
      {children}
    </layout.component>
  )
}
