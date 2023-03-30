import * as IO from '@effect/io/Effect'
import { TetrisGameElement, initialize, updateTetrisGame, drawTetrisGame } from './tetris-game'
import * as E from '@effect-fun/engine'
import {pipe} from '@effect/data/Function'
import {TetrisModelElement} from './app/model.element'
const Engine = E.EngineTag<E.BuiltinEvents>()

const LiveTetrisElement = IO.toLayer(
  pipe(
    IO.sync(() => new TetrisModelElement()),
    IO.flatMap((element) => IO.sync(() => document.body.appendChild( element)))
  ),
  TetrisGameElement
)

export function main() {
  return IO.runPromise(
    pipe(
      IO.serviceWithEffect(Engine, engine =>
        engine.renderLoop(initialize, updateTetrisGame, drawTetrisGame)
      ),
      IO.provideSomeLayer(E.LiveDomEngine(Engine)),
      IO.provideSomeLayer(LiveTetrisElement),
      IO.catchAllCause(IO.logFatalCause)
    )
  )
}
void main()
