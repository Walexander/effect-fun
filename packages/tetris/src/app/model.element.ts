import * as Board from './model/board'

import * as RA from '@effect/data/ReadonlyArray'
import { customElement, state } from 'lit/decorators.js'
import {classMap} from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import { point, path as path$ } from 'graphics-ts/Shape'
import { Tetromino } from './model/tetromino'
import * as Deck from './model/deck'
import './deck.element'
import {pipe} from '@effect/data/Function'
import * as TM from './model/tetris-model'
const path = path$(RA.Foldable)
import './board.element'

@customElement('tetris-model')
export class TetrisModelElement extends LitElement {
  static styles = css`
  main {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-height: 90vh;
  }
  main.over {
      --over: '';
      --over-text: 'Game Over!';
  }
  .board::before {
    content: var(--over, unset);
    position: absolute;
    left:0;
    right: 0;
    bottom: 0;
    top: 0;
    background: hsla(180deg 50% 50% /0.9);
    backdrop-filter: blur(4px);
  }
  .board::after {
    content: var(--over-text, unset);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: red;
    font-size: 2rem;
  }
    .board {
      position: relative;
      flex-basis: 90%;
      display: grid;
      align-items: center;
      justify-content: center;
      grid-template-columns: repeat(var(--col-count, 10), var(--size, 1fr));
      grid-template-rows: repeat(var(--row-count, 16), var(--size, 1fr));
      margin: auto;
    }
`

  @state()
  declare game: TM.TetrisGame
  connectedCallback() {
    super.connectedCallback()
    this.game = TM.make(10, 12, Deck.make())
    document.addEventListener('keydown', this.onInput.bind(this))
  }
  onInput(e: KeyboardEvent) {
    switch(e.code) {
      case 'Space':
        this.game = this.game.tick()
        return e.preventDefault()
      case 'ArrowRight':
      case 'ArrowLeft':
        this.game = this.game.move(e.code == 'ArrowRight' ? 'R' : 'L')
        return e.preventDefault()
      case 'ArrowUp':
      case 'ArrowDown':
        this.game = this.game.spin(e.code == 'ArrowUp' ? 'L' : 'R')
        return e.preventDefault()
      default:
        return void null
    }
  }

  render() {

    return html`
      <main class="${classMap({
        over: false
      })}">
        <section class="deck">
          <tetris-deck .deck=${[...this.game.bullpen.preview]}></tetris-deck>
        </section>
        <section><tetris-board .board=${this.game.board} width=10 height=12></tetris-board></section>
        <section class=scoreboard>
              <h2>Score ${this.game.score * 1000}</h2>
        </section>
      </main>
`
  }
}
