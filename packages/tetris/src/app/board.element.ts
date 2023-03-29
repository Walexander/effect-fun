import * as RA from '@effect/data/ReadonlyArray'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { html, css, LitElement } from 'lit'
import { Tetromino } from './model/tetromino'
import * as Color from 'graphics-ts/Color'
import { point, Point } from 'graphics-ts/Shape'

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
      margin: auto;
    }
    .row {
      display: flex;
      height: var(--size, 2rem);
      width: 100%;
    }
    .row.deleted .cell {
        opacity: 0;
    }
    .cell {
      aspect-ratio: 1/1;
      flex-basis: var(--size, 2rem);
      max-width: var(--size, 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg, transparent);
      background: transparent;
      color: var(--fg, black);
      border: 1px solid var(--border-color, black);
    }
    .block {
      width: 99%;
      height: 99%;
      box-shadow: inset 0px 0px 1px 3px hsla(0 0% 50% / 0.75);
      background: var(--bg);
    }
    .last .block {
      box-shadow: none;
      background: transparent;
display: none;
    }

    .projected .block {
      opacity: 0.25;
    }
    .last {
      background: #000;
      --fg: transparent;
      --border-color: transparent;
    }
  `
  @property({ attribute: false })
  declare board: Board.GameGrid
  @property({ attribute: false })
  declare active: Tetromino
  @property({ attribute: false })
  declare projected: Tetromino

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
      const filled = this.board.filled(point)
      const isActive = this.active.path.points.some(p => p.x == point.x && p.y == point.y)
      const isProjection =
            this.projected.path.points.some(p => p.x == point.x && p.y == point.y)
      const color = filled ||
        ((isActive || isProjection) &&
          this.active.color) ||
        false
      const classes = {
        cell: true,
        full: !!color,
        projected: isProjection && !isActive,
        last: point.y == height,
      }
      return html`
        <div
          class=${classMap(classes)}
          id="cell-${point.x}-${point.y}"
        >${!color ? undefined : html`<div style="--bg: ${toColor(color)}" class="block"></div>`}</div>
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
          style="--col-count: ${width}; --row-count: ${height}"
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
