import * as IO from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'
import { Model } from './model'
import * as C from 'graphics-ts/Canvas'

export function drawGame(state: Model) {
  return state.ticks % 4 == 0
    ? IO.unit()
    : IO.collectAllDiscard([
      C.putImageData(state.background, 0, 0),
      C.withContext(pipe(
        C.translate(state.dims[0] / 2, state.dims[1] / 2),
        IO.zipRight(
          C.withContext(
            IO.collectAll([
              C.translate(state.dims[0] / -2.25, state.dims[1] / -2.75),
              C.scale(state.scale / 6, state.scale / 6),
              drawDebug(state),
            ])
          )
        ),
        IO.zipRight(IO.collectAll([drawSnake(state), drawApple(state)]))
      )),
    ])
}

function drawSnake({
  snake,
  velocity: [dx, dy],
  scale,
  headPosition,
  updateRate,
}: Model) {
  const [head, ...tail] = snake
  const drawTail = C.withContext(
    IO.collectAllDiscard([
      C.setFillStyle(`green`),
      IO.forEach(tail, point =>
        IO.zipRight(
          C.fillPath(C.withContext(drawSegment(...point, scale))),
          C.strokePath(C.withContext(drawSegment(...point, scale)))
        )
      ),
    ])
  )
  const drawHead = C.withContext(
    IO.collectAllDiscard([
      C.withContext(
        IO.collectAllDiscard([
          C.setFillStyle('transparent'),
          C.fillPath(
            updateRate <= 6
              ? drawSegment(...head, scale, true)
              : drawSegment(headPosition.x, headPosition.y, scale, false)
          ),
          //
          C.rotate(Math.atan2(dy, dx)),
          C.setFillStyle(`black`),
          C.withContext(
            C.fillPath(
              IO.collectAllDiscard([
                C.rect(-scale / 2, -scale / 2, scale / 2, scale),
                C.rotate((22 * Math.PI) / 180),
                C.arc(0, 0, scale / 2, 0, Math.PI * 2),
                C.lineTo(0, 0),
                C.closePath,
              ])
            )
          ),
        ])
      ),
    ])
  )
  return C.withContext(IO.zipRight(drawTail, drawHead))
}
function drawApple({ apple: [x, y], scale }: Model) {
  return C.withContext(
    IO.collectAllDiscard([
      C.setFillStyle('red'),
      C.fillPath(C.withContext(drawSegment(x, y, scale, true))),
    ])
  )
}

function drawSegment(x: number, y: number, scale: number, arc = false) {
  return pipe(
    C.scale(scale, scale),
    IO.zipRight(C.translate(x, y)),
    IO.zipRight(C.scale(1 / scale, 1 / scale)),
    IO.zipRight(
      arc
        ? C.arc(0, 0, scale / 2, 0, Math.PI * 2)
        : C.rect(-scale / 2, -scale / 2, scale, scale)
    )
  )
}
function drawDebug({ updateRate, snake: [head, ...tail] }: Model) {
  return pipe(
    IO.collectAllDiscard([
      C.fillText(`[Score: ${tail.length + 1}]`, 0, 0),
      C.fillText(
        `[${head[0].toFixed(0).padEnd(3, ' ')}, ${head[1].toFixed(0)}]`,
        0,
        12
      ),
      C.fillText(updateRate.toFixed(0).padEnd(5), 0, 24),
    ])
  )
}
