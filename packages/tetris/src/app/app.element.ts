import { LitElement, html } from 'lit'
import './app.element.css'
import './tetromino.element'
import './model.element'
import './board.element'
export class AppElement extends LitElement {
  render() {
    return html`
      <div style="max-width: 80%;margin: auto">
        <tetris-model></tetris-model>
      </div>`
  }
  protected override createRenderRoot() {
    return this
  }
}
customElements.define('effect-fun-root', AppElement)
