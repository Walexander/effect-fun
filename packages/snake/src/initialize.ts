import * as IO from '@effect/io/Effect'
import { rect } from 'graphics-ts/Shape'
import { pipe } from '@effect/data/Function'
import {
  Engine,
} from './engine'
import * as C from 'graphics-ts/Canvas'
import { NonEmptyArray } from '@effect/data/ReadonlyArray'
import { gridBackground } from './draw-game'
import { Model, makeApple, GameEvent } from './model'

export function initialize (engine: Engine<GameEvent>): IO.Effect<CanvasRenderingContext2D, never, Model> {
  return pipe(
    C.dimensions,
    IO.flatMap(({width}) =>
      IO.all({
        snake: IO.succeed(<NonEmptyArray<[number, number]>>[[0, 0]]),
        apple: makeApple(-10, 10),
        dims: IO.map(C.dimensions, ({width, height}) => <[number, number]>[width, height]),
        scale: IO.succeed(width / 25),
        velocity: IO.succeed<[number, number]>([0, 0]),
        publish: IO.succeed(engine.publish.bind(engine)),
        bounds: IO.succeed(rect(-width / 50, -width / 50, width / 50, width / 50)),
        background: gridBackground(width, width)
      })
    )
  )
}
