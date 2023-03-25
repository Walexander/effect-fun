import './app.element.css'
import * as IO from '@effect/io/Effect'
import * as RA from '@effect/data/ReadonlyArray'
import { ShapeTag, Tetromino } from './model/tetromino'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { shuffledDeck } from './model/deck'
import { pipe } from '@effect/data/Function'
import './tetromino.element'
import './model.element'
import './board.element'
export class AppElement extends LitElement {
  @state()
  declare deck: Tetromino[]

  render() {
    return html`
      <div style="max-width: 80%;margin: auto">
        <tetris-model></tetris-model>
      </div>`
  }
  protected override createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    pipe(
      shuffledDeck(),
      IO.tap(d => IO.sync(() => (this.deck = d))),
      IO.runPromise
    )
  }
}

function makePieceRotations(tag: ShapeTag) {
  return RA.range(0, 3).map(
    i =>
      html`<effect-fun-tetromino
        piece=${tag}
        rotation=${i}
      ></effect-fun-tetromino>`
  )
}
customElements.define('effect-fun-root', AppElement)
