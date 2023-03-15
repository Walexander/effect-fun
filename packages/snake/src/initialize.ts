import * as IO from '@effect/io/Effect'
import { rect, point } from 'graphics-ts/Shape'
import { Engine } from './engine'
import * as C from 'graphics-ts/Canvas'
import { NonEmptyArray } from '@effect/data/ReadonlyArray'
import { gridBackground } from './draw-game'
import { Model, makeApple, GameEvent } from './model'

export function initialize(
  engine: Engine<GameEvent>
): IO.Effect<CanvasRenderingContext2D, never, Model> {
  return IO.flatMap(C.dimensions, ({ width }) =>
    IO.all({
      snake: IO.succeed(<NonEmptyArray<[number, number]>>[[0, 0], [-1, 0], [-2, 0], [-3, 0], [-3, -1]]),
      headPosition: IO.succeed(point(0, 0)),
      ticks: IO.succeed(0),
      updateRate: IO.succeed(16),
      apple: makeApple(-5, 5),
      lastVelocity: IO.succeed(point(0, 0)),
      dims: IO.map(
        C.dimensions,
        ({ width, height }) => <[number, number]>[width, height]
      ),
      scale: IO.succeed(width / 25),
      velocity: IO.succeed<[number, number]>([0, 0]),
      publish: IO.succeed(engine.publish.bind(engine)),
      bounds: IO.succeed(
        rect(-width / 50, -width / 50, width / 50, width / 50)
      ),
      background: gridBackground(width, width),
    })
  )
}
