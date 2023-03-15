import * as IO from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'
import {
  Engine,
  LiveDomEngine,
  EngineTag,
} from './engine'
import * as C from 'graphics-ts/Canvas'
import { initialize, updateGameState, drawGame, GameEvent } from './snake-game'

export function main(canvasId: string) {
  return IO.runPromise(
    pipe(
      program,
      IO.provideSomeLayer(LiveDomEngine(Engine)),
      C.renderTo(canvasId),
      IO.catchAllCause(IO.logErrorCause)
    )
  )
}
const Engine = EngineTag<GameEvent>()

const program = IO.serviceWithEffect(Engine, engine =>
  engine.renderLoop(initialize(engine), updateGameState, drawGame)
)
