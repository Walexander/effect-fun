import * as Board from './model/board'

import * as RA from '@effect/data/ReadonlyArray'
import { customElement, property } from 'lit/decorators.js'
import {classMap} from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import { point, path as path$ } from 'graphics-ts/Shape'
import { Tetromino } from './model/tetromino'
import { shuffle } from './model/deck'
import './deck.element'
import {pipe} from '@effect/data/Function'
const path = path$(RA.Foldable)

@customElement('tetris-board')
export class TetrisBoardElement extends LitElement {
  static styles = css`
  main {
    position: relative;
    display: flex;
    flex-direction: row;
    min-height: 90vh;
    padding: 2rem 0;
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
    .cell {
      aspect-ratio: 1/1;
      max-width: var(--size, 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg, transparent);
      color: var(--fg, black);
    }
    .full {
      --bg: black;
      --fg: white;
    }
    .last {
      --bg: grey;
      --fg: transparent;
      aspect-ratio: 2/1;
    }
  `
  @property({ attribute: false })
  declare board: Board.GameGrid<Tetromino>

  @property({ type: Number })
  declare width: number
  @property({ type: Number })
  declare height: number

  constructor() {
    super()
    this.width = 1
    this.height = 1
  }

  render() {
    const { width, height } = this.board.dimensions
    const row = (rowId: number) =>
      RA.range(0, width - 1).map(
        colId => pipe(
          [`cell-${rowId}-${colId}`,
           {
              cell: true,
              full: this.board.filled({x: colId, y: rowId}),
              last: rowId == height
            }
          ] as const,
          ([id, classes]) => html`<div id=${id} class=${classMap(classes)}">x</div>`
        )
      )
    return html`
      <main>
        <section class=board style="--size: 2.5rem; --col-count: ${width}; --row-count: ${height}">
          ${RA.range(0, height).map(row)}
        </section>
      </main>
`
  }
}
