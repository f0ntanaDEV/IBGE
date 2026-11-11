import { Component, type ReactNode } from "react"

type Props = { children: ReactNode; fallback: ReactNode }
type State = { failed: boolean }

export class MotionBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
