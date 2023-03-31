import * as IO from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'
import * as C from 'graphics-ts/Canvas'
import * as RA from '@effect/data/ReadonlyArray'
const wallThickness = 25
export const whiteBackground = (width: number, height: number) =>
  pipe(
    IO.collectAllDiscard([
      C.clearRect(0, 0, width, height),
      C.setFillStyle('lightgrey'),
      C.fillPath(C.rect(0, 0, width, height)),
      C.setFillStyle('red'),
      C.fillPath(C.rect(0, 0, wallThickness, height)),
      C.fillPath(C.rect(0, 0, width, wallThickness)),
      C.fillPath(C.rect(width - wallThickness, 0, wallThickness, height)),
      C.fillPath(C.rect(0, height - wallThickness, width, wallThickness)),
      C.fillPath(C.rect(0, 0, 0, 0)),
    ]),
    C.withContext,
    IO.zipRight(C.getImageData(0, 0, width, height))
  )

function wallGradient(w: number, h: number) {
  return pipe(
    IO.collectAllDiscard(<Array<IO.Effect<CanvasGradient, never, unknown>>>[
      C.addColorStop(0, 'purple'),
      C.addColorStop(0.33, 'cyan'),
      C.addColorStop(0.66, 'purple'),
      C.addColorStop(1, 'cyan'),
    ]),
    IO.zipRight(IO.service(C.GradientTag)),
    IO.provideSomeLayer(IO.toLayer(C.createLinearGradient(0, 0, w, h), C.GradientTag))
  )
}

function drawWalls(width: number, height: number, scale: number) {
  return IO.collectAllDiscard([
    IO.flatMap(
      wallGradient(width, height),
      C.setFillStyle
    ),
    C.fillPath(C.rect(0, 0, scale, height)),
    C.fillPath(C.rect(0, 0, width, scale)),
    C.fillPath(C.rect(width - scale, 0, scale, height)),
    C.fillPath(C.rect(0, height - scale, width, scale)),
  ])
}
export function gridBackground(width: number, height: number, scale = 24) {
  return IO.zipRight(
    C.withContext(
      IO.collectAllDiscard([
        C.clearRect(0, 0, width, height),
        C.setStrokeStyle('lightgrey'),
        C.beginPath,
        strokeLines(width, 'x', scale),
        strokeLines(height, 'y', scale),
        C.closePath,
        drawWalls(width, height, scale),
        C.fillPath(C.rect(0, 0, 0, 0)),
      ])
    ),
    C.getImageData(0, 0, width, height)
  )
}
function strokeLines(size: number, direction: 'x' | 'y', scale: number) {
  return C.strokePath(
    IO.forEachDiscard(RA.range(0, scale), start =>
      gridLine(
        scale,
        ...(<[[number, number], [number, number]]>(direction == 'x'
          ? [
            [start, 0],
            [start, size],
          ]
          : [
            [0, start],
            [size, start],
          ]))
      )
    )
  )
}

function gridLine(
  scale: number,
  [fromX, fromY]: [number, number],
  [toX, toY]: [number, number]
) {
  return C.withContext(
    IO.collectAllDiscard([
      C.scale(scale, scale),
      C.moveTo(fromX, fromY),
      C.lineTo(toX, toY),
    ])
  )
}

