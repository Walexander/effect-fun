import { Drawable } from 'graphics-ts/Drawable'
import * as IO from '@effect/io/Effect'
import * as C from 'graphics-ts/Canvas'
import * as Color from 'graphics-ts/Color'
import * as S from 'graphics-ts/Shape'
import * as D from 'graphics-ts/Drawing'
import * as Context from '@effect/data/Context'
import { Tetromino } from '../model/tetromino'
import { flow } from '@effect/data/Function'

export const DrawsTetrominosTag = Context.Tag<Drawable<Tetromino>>(
  '@effect-fun/tetris/drawable/tetromino'
)

export const LiveDrawsTetrominos = IO.toLayer(
  C.use(DrawsTetrominosImpl(20)),
  DrawsTetrominosTag
)

function DrawsTetrominosImpl(scale: number) {
  const outline = outlinedPath(scale)
  return (canvas: CanvasRenderingContext2D): Drawable<Tetromino> =>
    flow(draw, IO.provideService(C.Tag, canvas))
  function draw(a: Tetromino) {
    return D.render(
      D.many([
        // D.scale(scale, scale)(D.outline(a.path, D.outlineColor(a.color))),
        D.many(
          a.path.points.map(_ => D.fill(outline(_), D.fillStyle(a.color)))
        ),
        D.many(
          a.path.points.map(_ =>
            D.outline(outline(_), D.outlineColor(Color.white))
          )
        ),
      ])
    )
  }
}

function outlinedPath(scale: number) {
  return (point: S.Point) =>
    S.rect(
      point.x * scale + scale / -2,
      point.y * scale + scale / -2,
      scale,
      scale
    )
}
