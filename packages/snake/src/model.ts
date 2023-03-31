import * as IO from '@effect/io/Effect'
import { GameTick, BuiltinEvents, KeyDown } from './engine'
import { Rect, Point, point } from 'graphics-ts/Shape'
import { NonEmptyArray, dropRight } from '@effect/data/ReadonlyArray'
import * as Chunk from '@effect/data/Chunk'
import {pipe} from '@effect/data/Function'
type Chunk<A> = Chunk.Chunk<A>
export interface Model {
  readonly snake: NonEmptyArray<readonly [number, number]>
  readonly apple: readonly [number, number]
  readonly velocity: [number, number]
  readonly lastVelocity: Point
  readonly headPosition: Point
  readonly scale: number
  readonly dims: [number, number]
  readonly background: ImageData
  readonly ticks: number
  readonly updateRate: number
  bounds: Rect
  publish: (event: GameEvent) => IO.Effect<never, never, void>
}
interface AppleEat {
  _tag: 'eats'
}

export type GameEvent = BuiltinEvents | AppleEat

export function updateGameState(state: Model, events: Chunk<GameEvent>) {
  return IO.reduce(
    events,
    state,
    (model, event) => eventReducer(model, event)
  )
}

export function makeApple(
  min: number,
  max: number
): IO.Effect<never, never, Model['apple']> {
  return IO.randomWith(rnd =>
    IO.all([rnd.nextIntBetween(min, max), rnd.nextIntBetween(min, max)])
  )
}

function eventReducer(
  state: Model,
  e: GameEvent,
): IO.Effect<never, never, Model> {
  switch (e._tag) {
    case 'tick':
      return onTick(e, state)

    case 'keydown':
      return onKeyDown(e, state)

    case 'eats':
      return IO.map(makeApple(-10, 10), apple => ({
        ...state,
        // state.snake is nonempty, so `.at(-1)` is safe
        // eslint-disable-next-line
        snake: [...state.snake, state.snake.at(-1)!],
        apple,
        updateRate:
          state.updateRate > 8 && state.snake.length % 6 == 0
            ? state.updateRate / 2
            : state.updateRate,
      }))
    default:
      return IO.succeed(state)
  }
}

function onKeyDown(event: KeyDown, {velocity, snake: [head, ...tail], ...state}: Model) {
  return pipe(
    velocityFromKey(event.code, velocity),
    _velocity => (<Model>{
      ...state,
      snake: [head, ...tail],
      velocity: whiplash([head[0] + _velocity[0], head[1] + _velocity[1]], tail) ? velocity : _velocity,
    }),
    IO.succeed,
  )
}

function whiplash(next: [number, number], [neck = [Infinity, Infinity]]: (readonly [number, number])[]): boolean {
  return next[0] != 0 && next[1] != 0 && next[0] == neck[0] && next[1] == neck[1]
}

function onTick(e: GameTick, state0: Model) {
  return pipe(
    applyVelocity({
      ...state0,
      ticks: e.tick,
    }, e.tick),
    IO.succeed,
    IO.tap(({ snake: [head], apple, publish }) =>
      head[0] == apple[0] && head[1] == apple[1]
        ? publish({ _tag: 'eats' })
        : IO.unit()
    ),
    IO.map<Model, Model>(state =>
      checkCollision(state)
        ? {
            ...state,
            velocity: [0, 0],
          }
        : state
    )
  )
}

function checkCollision(model: Model) {
  const [head, ,...tail]  = model.snake
  return (
    (tail.length > 1 && tail.some(([x, y]) => x == head[0] && y == head[1])) ||
    Math.abs(head[0]) >= model.bounds.width ||
    Math.abs(head[1]) >= model.bounds.height
  )
}

function applyVelocity(state: Model, tick: number): Model {
  const tickInterval = state.updateRate
  const [[x, y]] = state.snake
  const [dx, dy] = state.velocity
  return dx == 0 && dy == 0
  ? state :
    tick % tickInterval != 0
    ? {
      ...state,
      headPosition: point(
        state.headPosition.x + (state.lastVelocity.x * (1/tickInterval)),
        state.headPosition.y + (state.lastVelocity.y * (1/tickInterval)),
      ),
    }
    : {
        ...state,
        lastVelocity: point(dx, dy),
        snake: [[x + dx, y + dy] as const, ...dropRight(1)(state.snake)],
        headPosition: point(x, y),
      }
}

function velocityFromKey(
  code: string,
  [x, y]: [number, number]
): [number, number] {
  switch (code) {
    case 'ArrowLeft':
      return x == 0 ? [-1, 0] : [x, y]
    case 'ArrowRight':
      return x == 0 ? [1, 0] : [x, y]
    case 'ArrowUp':
      return y == 0 ? [0, -1] : [x, y]
    case 'ArrowDown':
      return y == 0 ? [0, 1] : [x, y]
    case 'Space':
      return [0, 0]
    default:
      return [x, y]
  }
}

