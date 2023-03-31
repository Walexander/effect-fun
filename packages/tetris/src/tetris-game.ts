import {Chunk} from '@effect/data/Chunk'
import * as Context from '@effect/data/Context'
import * as IO from '@effect/io/Effect'
import * as E from '@effect-fun/engine'
import * as D from './model/deck'
import { make, TetrisGame } from './model/tetris-model'
import {TetrisModelElement} from './app/model.element'

export const initialize = IO.succeed(make(10, 21, D.make()))
export type GameEvent = E.BuiltinEvents

export function updateTetrisGame(state: TetrisGame, events: Chunk<GameEvent>) {
  return IO.reduce(
    events,
    state,
    (model, event) => {
      switch(event._tag) {
        case 'keydown':
          return onInput(model, event.code)
        case 'tick':
          return event.tick % 60 == 0 ? IO.succeed(model.tick()) : IO.succeed(model)
        default:
          return IO.succeed(model)
      }
    }
  )
}

function onInput(game: TetrisGame, code: string) {
  switch (code) {
    case 'Space':
      return game.isOver
        ? initialize
        : IO.succeed(game.spin('L'))
    case 'ArrowRight':
    case 'ArrowLeft':
      return IO.succeed(game.move(code == 'ArrowRight' ? 'R' : 'L'))
    case 'ArrowDown':
      return IO.succeed(game.tick())
    case 'ArrowUp':
      return IO.succeed(game.drop())
    case 'KeyP':
      return IO.succeed(game.toggle())
    default:
      return IO.succeed(game)
  }
}
export const TetrisGameElement = Context.Tag<TetrisModelElement>()
export function drawTetrisGame(game: TetrisGame) {
  return IO.serviceWithEffect(TetrisGameElement, (element) => IO.sync(() => element.game = game))
}
