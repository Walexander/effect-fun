import { customElement, property } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import {css, html, LitElement} from 'lit'
import {Tetromino} from './model/tetromino'
import './tetromino.element'


@customElement('tetris-deck')
export class DeckElement extends LitElement {
  static styles = css`
section { justify-content: center; display: flex; flex-direction: column-reverse; align-items: center; column-gap: 1rem; text-align: center;}
`
  @property({attribute: false})
  declare deck: Tetromino[]

  constructor() {
    super()
    this.deck = []
  }

  render() {
    return html`<h2>Deck</h2><section>
    ${repeat(this.deck, _ => _.type, _ => html`
          <div>
            <effect-fun-tetromino id=${_.type} piece=${_.type}></effect-fun-tetromino>
          </div>
`)}
  </section>`
  }
}
