import './app.element.css'
import * as IO from '@effect/io/Effect'
import { DrawsTetrominosTag, LiveDrawsTetrominos } from './drawables/tetromino'
import { ShapeTag, Tetromino } from '../model/tetromino'
import * as C from 'graphics-ts/Canvas'
import { pipe } from '@effect/data/Function'

export class TetronomiElement extends HTMLElement {
  connectedCallback() {
    IO.runSync(
      pipe(
        IO.all([
          // eslint-disable-next-line
          IO.sync(() => this.getAttribute('piece') as ShapeTag),
          // eslint-disable-next-line
          IO.sync(() => parseInt(this.getAttribute('rotation')!)),
        ]),
        IO.map(([type, r]) => new Tetromino(type, r)),
        IO.flatMap(piece =>
          pipe(
            IO.sync(() => this.appendChild(document.createElement('canvas'))),
            // eslint-disable-next-line
            IO.flatMap(_ => IO.sync(() => [piece, _.getContext('2d')!] as const))
          )
        ),
        IO.flatMap(([piece, canvas]) => renderPiece(piece, canvas))
      )
    )
  }
}
const renderPiece = (tetromino: Tetromino, canvas: CanvasRenderingContext2D) =>
  pipe(
    IO.serviceWithEffect(DrawsTetrominosTag, draw =>
      pipe(
        C.setDimensions({
          width: 100,
          height: 100,
        }),
        IO.zipRight(C.dimensions),
        IO.flatMap(({ width, height }) =>
          IO.collectAllDiscard([
            C.translate(width / 2, height / 2),
            draw(tetromino),
          ])
        ),
      )
    ),
    IO.provideSomeLayer(LiveDrawsTetrominos),
    C.renderTo(canvas)
  )
customElements.define('effect-fun-tetromino', TetronomiElement)
