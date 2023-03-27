import * as RA from '@effect/data/ReadonlyArray'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import { Tetromino } from './model/tetromino'
import * as Color from 'graphics-ts/Color'
import { point, Point } from 'graphics-ts/Shape'
import { pipe } from '@effect/data/Function'

import * as Board from './model/board'

@customElement('tetris-board')
export class TetrisBoardElement extends LitElement {
  static styles = css`
    .board {
      position: relative;
      background: #333333;
      flex-basis: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      grid-template-columns: repeat(var(--col-count, 10), var(--size, 1fr));
      grid-template-rows: repeat(var(--row-count, 16), var(--size, 1fr));
      margin: auto;
    }
    .row {
      display: flex;
      height: var(--size);
      width: 100%;
    }
    .row.deleted .cell {
        opacity: 0;
        transition: opacity ease-in 2s;
    }
    .cell {
      aspect-ratio: 1/1;
      flex-basis: var(--size);
      max-width: var(--size, 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg, transparent);
      color: var(--fg, black);
      border: 1px solid var(--border-color, black);
    }
    .full {
      --border-color: white;
      --bg: black;
      --fg: white;
      box-shadow: inset 0px 0px 1px 3px #ccc
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
    const cell = (point: Point) => {
      const color =
        this.board.filled(point) ||
        (this.active.path.points.some(p => p.x == point.x && p.y == point.y) &&
          this.active.color) ||
        false
      return html`
        <div
          class=${classMap({
            cell: true,
            full: !!color,
            last: point.y == height,
          })}
          id="cell-${point.x}-${point.y}"
          style="--bg: ${toColor(color)}"
        ></div>
      `
    }
    const row = (rowId: number) => html`
    <div class=row id="row-${rowId}">
      ${RA.range(0, width - 1).map(colId => {
        return cell(point(colId, rowId))
      })}
    </div>
`
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
  return color ? Color.toCss(color) : 'inherit'
}
