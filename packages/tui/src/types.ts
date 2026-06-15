import type { Session, Span, Event, ContextItem } from "@adler/sdk"

export interface AppState {
  session: Session | null
  spans: Span[]
  events: Event[]
  context: ContextItem[]
  activeTab: number
  isHelpOpen: boolean
  agentsSelectedIndex: number
  tracesSelectedIndex: number
  logsSelectedIndex: number
  logsFilter: "all" | "info" | "warn" | "error"
  logsAutoScroll: boolean
  logsView: "session" | "daemon"
  daemonEvents: Event[]
}

export type AppAction =
  | { type: "setState"; payload: Partial<AppState> }
  | { type: "snapshot"; payload: { session: Session; spans: Span[]; events: Event[]; context: ContextItem[] } }
  | { type: "event"; payload: Event }
  | { type: "daemonEvent"; payload: Event }
  | { type: "daemonSnapshot"; payload: Event[] }
  | { type: "nextTab" }
  | { type: "prevTab" }
  | { type: "setTab"; tab: number }
  | { type: "toggleHelp" }
  | { type: "selectAgent"; index: number }
  | { type: "selectTrace"; index: number }
  | { type: "selectLog"; index: number }
  | { type: "setLogsFilter"; filter: "all" | "info" | "warn" | "error" }
  | { type: "toggleLogsAutoScroll" }
  | { type: "toggleLogsView" }

export const initialState: AppState = {
  session: null,
  spans: [],
  events: [],
  context: [],
  activeTab: 0,
  isHelpOpen: false,
  agentsSelectedIndex: 0,
  tracesSelectedIndex: 0,
  logsSelectedIndex: 0,
  logsFilter: "all",
  logsAutoScroll: true,
  logsView: "session",
  daemonEvents: [],
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setState":
      return { ...state, ...action.payload }
    case "snapshot":
      return {
        ...state,
        session: action.payload.session,
        spans: action.payload.spans,
        events: action.payload.events,
        context: action.payload.context,
      }
    case "event":
      return { ...state, events: [action.payload, ...state.events] }
    case "daemonEvent":
      return { ...state, daemonEvents: [action.payload, ...state.daemonEvents] }
    case "daemonSnapshot":
      return { ...state, daemonEvents: action.payload }
    case "nextTab":
      return { ...state, activeTab: Math.min(4, state.activeTab + 1) }
    case "prevTab":
      return { ...state, activeTab: Math.max(0, state.activeTab - 1) }
    case "setTab":
      return { ...state, activeTab: action.tab }
    case "toggleHelp":
      return { ...state, isHelpOpen: !state.isHelpOpen }
    case "selectAgent":
      return { ...state, agentsSelectedIndex: action.index }
    case "selectTrace":
      return { ...state, tracesSelectedIndex: action.index }
    case "selectLog":
      return { ...state, logsSelectedIndex: action.index }
    case "setLogsFilter":
      return { ...state, logsFilter: action.filter, logsSelectedIndex: 0 }
    case "toggleLogsAutoScroll":
      return { ...state, logsAutoScroll: !state.logsAutoScroll }
    case "toggleLogsView":
      return { ...state, logsView: state.logsView === "session" ? "daemon" : "session", logsSelectedIndex: 0 }
    default:
      return state
  }
}
