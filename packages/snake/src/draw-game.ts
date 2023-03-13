import * as IO from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'
import { Model } from './model'
import * as C from 'graphics-ts/Canvas'
import * as RA from '@effect/data/ReadonlyArray'
const wallThickness = 25
export const whiteBackground = (width: number, height: number) => pipe(
  IO.collectAllDiscard([
    C.clearRect(0, 0, width, height),
    C.setFillStyle('lightgrey'),
    C.fillPath(C.rect(0, 0,width, height)),
    C.setFillStyle('red'),
    C.fillPath(C.rect(0, 0, wallThickness, height)),
    C.fillPath(C.rect(0, 0, width, wallThickness)),
    C.fillPath(C.rect(width - wallThickness, 0, wallThickness, height)),
    C.fillPath(C.rect(0, height - wallThickness, width, wallThickness)),
    C.fillPath(C.rect(0, 0, 0, 0)),
  ]),
  C.withContext,
  IO.zipRight(C.getImageData(0, 0, width, height)),
)
export const gridBackground = (width: number, height: number, scale = 24) => pipe(
  IO.collectAllDiscard([
    C.clearRect(0, 0, width, height),
    C.setStrokeStyle('lightgrey'),
    C.beginPath,
    strokeLines(width, 'x', scale),
    strokeLines(height, 'y', scale),
    C.closePath,
    C.fillPath(C.rect(0, 0, wallThickness, height)),
    C.fillPath(C.rect(0, 0, width, wallThickness)),
    C.fillPath(C.rect(width - wallThickness, 0, wallThickness, height)),
    C.fillPath(C.rect(0, height - wallThickness, width, wallThickness)),
    C.fillPath(C.rect(0, 0, 0, 0)),
  ]),
  C.withContext,
  IO.zipRight(C.getImageData(0, 0, width, height)),
)

function strokeLines(size: number, direction: 'x'|'y', scale: number) {
  return C.strokePath(IO.forEachDiscard(
    RA.range(0, scale)
    , start =>
        pipe(
          (gridLine(scale, ...<[[number, number], [number, number]]>(
            direction == 'x'
              ? [ [start , 0], [start, size] ]
              : [ [0, start], [size, start] ]
          ))
          )
        )
      ))
}

function gridLine (scale: number, [fromX, fromY]: [number, number], [toX, toY]: [number, number])  {
  return C.withContext(IO.collectAllDiscard([
    C.scale(scale, scale),
    C.moveTo(fromX, fromY),
    C.lineTo(toX, toY),
  ]))
}

export function drawGame(state: Model) {
  return state.ticks % 6 != 0 ? IO.unit() : pipe(
    C.setFillStyle('black'),
    IO.zipRight(C.putImageData(state.background, 0, 0)),
    IO.zipRight(pipe(
      C.translate(state.dims[0] / 2,state.dims[1]  / 2),
      IO.zipRight(C.withContext(
        IO.collectAll([
          C.translate(state.dims[0] / -2.25, state.dims[1] / -2.75),
          C.scale(state.scale / 6, state.scale / 6),
          drawDebug(state)
        ])
      )),
      IO.zipRight(
        IO.collectAll([
          drawSnake(state),
          drawApple(state),
        ])
      ),
      C.withContext
    )),
    IO.as(void null)
  )
}

function drawSnake({snake, velocity: [dx, dy], scale}: Model) {
  const Canvas = C
  const [head, ...tail] = snake
  const drawTail = pipe(
    IO.unit(),
    IO.zipRight(IO.collectAllDiscard([
      Canvas.setFillStyle('green'),
      IO.forEach(tail,
        (point) => IO.zipRight(
          C.fillPath(C.withContext(drawSegment(...point, scale))),
          dx == 0 && dy == 0 ? C.strokePath(C.withContext(drawSegment(...point, scale))) : IO.unit()
        )
      ),
    ])),
    C.withContext,
  )
  const drawHead = C.withContext(
    IO.collectAllDiscard([
      C.withContext(IO.collectAllDiscard([
        C.setFillStyle('transparent'),
        C.fillPath(drawSegment(...head, scale, true)),
        C.rotate(Math.atan2(dy, dx)),
        C.setFillStyle(`green`),
        C.withContext(C.fillPath(IO.collectAllDiscard([
          C.rect(0 - scale / 2, 0 - scale / 2, scale / 2, scale),
          C.rotate(22 * Math.PI / 180),
          C.arc(0, 0, scale / 2, 0,  Math.PI * 2),
          C.lineTo(0, 0),
          C.closePath,
        ]))),
      ]))
    ])
  )
  return C.withContext(
    IO.zipRight(drawTail, drawHead)
  )
}
function drawApple({apple: [x, y], scale}: Model) {
  return C.withContext(
    IO.collectAllDiscard([
      C.setFillStyle('orange'),
      C.fillPath(C.withContext(drawSegment(x, y, scale, true))),
    ])
  )
}

function drawSegment(x: number, y: number, scale: number, arc = false) {
  return (
    pipe(
      C.scale(scale, scale),
      IO.zipRight(C.translate(x, y)),
      IO.zipRight(C.scale(1 / scale, 1 / scale)),
      IO.zipRight(
        arc
          ? C.arc(0, 0, scale / 2, 0, Math.PI * 2)
          : C.rect(-scale / 2, -scale / 2, scale, scale)
      )
    )
  )
}
function drawDebug({ snake: [head, ...tail] }: Model) {
  return pipe(
    IO.collectAllDiscard([
      // C.setFillStyle('red'),
      // C.fillText(
      //   `[${apple[0].toFixed(0).padEnd(3, ' ')}, ${apple[1].toFixed(0)}]`,
      //   0,
      //   15
      // ),
      C.fillText(`[Score: ${tail.length + 1}]`, 0, 0),
      C.fillText(
        `[${head[0].toFixed(0).padEnd(3, ' ')}, ${head[1].toFixed(0)}]`,
        0,
        12
      ),
    ])
  )
}
