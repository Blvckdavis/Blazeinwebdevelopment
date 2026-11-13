import { Component } from 'react'

// Decorative rendering must never prevent access to the product page.
export default class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}
