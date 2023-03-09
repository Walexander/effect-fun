import * as IO from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'
import {
  BuiltinEvents,
  KeyDown,
  Engine,
  engineLive,
  EngineTag,
  GameTick,
} from './engine'
import * as C from 'graphics-ts/Canvas'
import { NonEmptyArray } from '@effect/data/ReadonlyArray'
import * as RA from '@effect/data/ReadonlyArray'
import { Chunk } from '@effect/data/Chunk'
interface Model {
  readonly snake: NonEmptyArray<readonly [number, number]>
  readonly apple: readonly [number, number]
  readonly velocity: [number, number]
}
export function main() {
  return IO.runPromise(pipe(program, IO.catchAllCause(IO.logErrorCause)))
}

interface AppleEat {
  _tag: 'eats'
}
type GameEvent = BuiltinEvents | AppleEat
const Engine = EngineTag<GameEvent>()

const initialize: IO.Effect<never, never, Model> = IO.all({
  snake: IO.succeed(<NonEmptyArray<[number, number]>>[[0, 0]]),
  apple: makeApple(-10, 10),
  velocity: IO.succeed<[number, number]>([0, 0]),
})
const program = pipe(
  IO.serviceWithEffect(Engine, engine =>
    engine.renderLoop<Model>(initialize, updateGameState(engine), drawGame)
  ),
  IO.provideSomeLayer(engineLive(Engine))
)

function updateGameState(engine: Engine<GameEvent>) {
  return (state: Model, events: Chunk<GameEvent>) =>
    IO.reduce(events, state, (model, event) =>
      IO.tap(eventReducer(model, event, engine.publish.bind(engine)), _ =>
        event._tag != 'tick'
          ? IO.log(`Got event: ${event._tag} -- ${JSON.stringify(_)}`)
          : IO.unit()
      )
    )
}
const scaleX = 2
const scaleY = 2
function drawGame(state: Model) {
  return pipe(
    IO.unit(),
    IO.zipRight(C.withContext(
      IO.collectAll([
        C.translate(50, 50),
        C.scale(scaleX, scaleY),
        C.clearRect(-50, -50, 100, 100),
        drawSnake(state.snake),
        drawApple(state.apple),
      ])
    )),
    IO.zipRight(C.withContext(
      IO.collectAll([
        C.translate(20, 30),
        drawDebug(state)
      ])
    )),
    C.renderTo('canvas'),
    IO.orDie,
    IO.as(void null)
  )
}
type PublishFn = (g: AppleEat) => IO.Effect<never, never, void>
function eventReducer(
  state: Model,
  e: GameEvent,
  publish: PublishFn
): IO.Effect<never, never, Model> {
  switch (e._tag) {
    case 'tick':
      return onTick(e, state, publish)

    case 'keydown':
      return onKeyDown(e, state)

    case 'eats':
      return IO.map(
        makeApple(-10, 10),
        apple => ({
          ...state,
          // state.snake is nonempty, so `.at(-1)` is safe
          // eslint-disable-next-line
          snake: [...state.snake, state.snake.at(-1)!],
          apple,
        })
      )

    default:
      return IO.succeed(state)
  }
}

function onKeyDown(event: KeyDown, state: Model) {
  return pipe(velocityFromKey(event.code, state.velocity), velocity =>
    IO.succeed({
      ...state,
      velocity,
    })
  )
}

function onTick(e: GameTick, state: Model, publish: PublishFn) {
  return pipe(
    applyVelocity(state, e.tick),
    IO.succeed,
    IO.tap(({ snake: [head], apple }) =>
      head[0] == apple[0] && head[1] == apple[1]
        ? publish({ _tag: 'eats' })
        : IO.unit()
    )
  )
}

function makeApple(
  min: number,
  max: number
): IO.Effect<never, never, Model['apple']> {
  return IO.randomWith(rnd =>
    IO.all([rnd.nextIntBetween(min, max), rnd.nextIntBetween(min, max)])
  )
}

function applyVelocity(state: Model, tick: number): Model {
  const [[x, y]] = state.snake
  const [dx, dy] = state.velocity
  return tick % 10 != 0
    ? state
    : {
        ...state,
        snake: [[x + dx, y + dy] as const, ...RA.dropRight(1)(state.snake)],
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
    default:
      return [x, y]
  }
}


function drawSnake(snake: Model['snake']) {
  const Canvas = C
  const [head, ...tail] = snake
  const drawTail = C.withContext(
    IO.collectAllDiscard([
      Canvas.setFillStyle('lightblue'),
      IO.forEach(tail, ([x, y]) => C.fillRect(x, y, scaleX, scaleY)),
      Canvas.fill(),
    ])
  )
  const drawHead = C.withContext(
    IO.collectAllDiscard([
      C.setFillStyle('blue'),
      C.fillRect(head[0], head[1], scaleX, scaleY),
      C.fill(),
    ])
  )
  return C.withContext(IO.zipRight(drawTail, drawHead))
}

function drawApple([x, y]: Model['apple']) {
  return C.withContext(
    IO.collectAllDiscard([
      C.setFillStyle('red'),
      C.fillPath(
        C.arc(x + scaleX / 2, y + scaleX / 2, scaleX / 2, 0, Math.PI * 2)
      ),
    ])
  )
}
function drawDebug({ snake: [head, ...tail], apple }: Model) {
  return pipe(
    IO.collectAllDiscard([
      C.fillText(
        `[${head[0].toFixed(0).padEnd(3, ' ')}, ${head[1].toFixed(0)}]`,
        -15,
        0
      ),
      C.setFillStyle('red'),
      C.fillText(
        `[${apple[0].toFixed(0).padEnd(3, ' ')}, ${apple[1].toFixed(0)}]`,
        -15,
        -15
      ),
      C.fillText(`[${tail.length + 1}]`, -15, 15),
    ])
  )
}
