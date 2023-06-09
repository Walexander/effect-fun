import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import * as Deck from '../model/deck'
import * as TM from '../model/tetris-model'
import './deck.element'
import './board.element'

@customElement('tetris-model')
export class TetrisModelElement extends LitElement {
  static styles = css`
    main {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: center;
      column-gap: 1rem;
      align-items: center;
      min-height: 90vh;
      max-height: 95vh;
      background: #111111;
      color: white;
    }
    main.over {
      --over: '';
      --over-text: 'Game Over!';
    }
    main.paused {
      --over: '';
      --over-text: 'Paused';
      --bg: hsla(0deg 100% 0% / 0.5);
    }
    .deck {
      flex-basis: 200px;
    }
    .board {
      position: relative;
      border: 4px solid white;
    }
    .board::before {
      content: var(--over, unset);
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      background: var(--bg, hsla(0deg 0% 50% /0.7));
      backdrop-filter: blur(4px);
      z-index: 1;
    }
    .board::after {
      content: var(--over-text, unset);
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: red;
      font-size: 2rem;
      z-index: 1;
    }
  `

  @property({attribute: false})
  declare game: TM.TetrisGame
  connectedCallback() {
    super.connectedCallback()
    this.game = TM.make(10, 12, Deck.make())
    const height = window.innerHeight * 0.8
    this.style.setProperty('--size', (height / 20) + 'px')
  }
  render() {
    return html`
      <main
        class="${classMap({
          over: this.game.isOver,
          paused: this.game.status == 'Paused',
        })}"
      >
        <section class="deck">
          <tetris-deck
            .deck=${this.game.isOver ? [] : [...this.game.bullpen.preview]}
          ></tetris-deck>
        </section>
        <section class="board">
          <tetris-board
            .active=${this.game.active}
            .board=${this.game.board}
            .projected=${this.game.active.translate(this.game.board.project(this.game.active.path))}
            width="10"
            height="12"
          ></tetris-board>
        </section>
        <section class="scoreboard">
          <h2>Score<br />${this.game.score * 1000}</h2>
        </section>
      </main>
    `
  }
}
