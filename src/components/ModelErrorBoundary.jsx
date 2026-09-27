import { Component } from 'react'
import { reportEvent } from '../services/telemetry'
import { ERROR_MESSAGE } from '../data/ranger'

// Se o .glb não carregar, o app não fica em branco: mostra a mensagem de erro
// e reporta MODEL_LOAD_FAILURE para o monitoramento.
export default class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    reportEvent('MODEL_LOAD_FAILURE', this.props.screen)
  }

  render() {
    if (this.state.failed) return <p className="emptyBody" style={{ position: 'absolute', bottom: 24, left: 24 }}>{ERROR_MESSAGE}</p>
    return this.props.children
  }
}
