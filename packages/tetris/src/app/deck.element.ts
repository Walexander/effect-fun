import { customElement, property } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import {css, html, LitElement} from 'lit'
import {Tetromino} from './model/tetromino'
import './tetromino.element'


@customElement('tetris-deck')
export class DeckElement extends LitElement {
  static styles = css`
    section {
      justify-content: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      column-gap: 1rem;
      text-align: center;
    }
  `
  @property({ attribute: false })
  declare deck: Tetromino[]

  constructor() {
    super()
    this.deck = []
  }

  render() {
    const deck = repeat(
      this.deck,
      _ => _.type,
      _ =>
        html`<effect-fun-tetromino
          id=${_.type}
          piece=${_.type}
        ></effect-fun-tetromino>`
    )
    return html`<h2>Deck</h2>
      <section>${deck}</section>`
  }
}
