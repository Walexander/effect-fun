import * as RA from '@effect/data/ReadonlyArray'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import { Tetromino } from './model/tetromino'
import * as Color from 'graphics-ts/Color'
import { pipe } from '@effect/data/Function'

import * as Board from './model/board'

@customElement('tetris-board')
export class TetrisBoardElement extends LitElement {
  static styles = css`
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
  declare board: Board.GameGrid
  @property({ attribute: false })
  declare active: Tetromino

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
      RA.range(0, width - 1).map(colId => {
        const id = `cell-${rowId}-${colId}`
        const color =
          this.board.filled({ x: colId, y: rowId }) ||
          (this.active.path.points.some(
            ({ x, y }) => x == colId && y == rowId
          ) &&
            this.active.color) ||
          false
        const classes = {
          cell: true,
          full: !!color,
          last: rowId == height,
        }
        return pipe(
          html`<div style="--bg: ${toColor(color)}" id=${id} class=${classMap(
            classes
          )}">x</div>`
        )
      })
    return html`
      <main>
        <section
          class="board"
          style="--size: 2.5rem; --col-count: ${width}; --row-count: ${height}"
        >
          ${RA.range(0, height).map(row)}
        </section>
      </main>
    `
  }
}

function toColor(color: false | Color.Color) {
  return Color.toCss(color || Color.white)
}
