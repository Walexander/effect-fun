import * as IO from '@effect/io/Effect'
import { Rect, rect } from 'graphics-ts/Shape'
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
import * as Chunk from '@effect/data/Chunk'
type Chunk<A> = Chunk.Chunk<A>
interface Model {
  readonly snake: NonEmptyArray<readonly [number, number]>
  readonly apple: readonly [number, number]
  readonly velocity: [number, number]
  readonly scale: number
  readonly dims: [number, number]
  readonly background: ImageData
  bounds: Rect
  publish: (event: GameEvent) => IO.Effect<never, never, void>
}
export function main() {
  return IO.runPromise(
    pipe(
      program,
      C.renderTo('canvas'),
      IO.catchAllCause(IO.logErrorCause)
    )
  )
}
interface AppleEat {
  _tag: 'eats'
}

type GameEvent = BuiltinEvents | AppleEat
const Engine = EngineTag<GameEvent>()

function initialize (engine: Engine<GameEvent>): IO.Effect<CanvasRenderingContext2D, never, Model> {
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
        background: whiteBackground(width, width)
      })
    )
  )
}
const program = pipe(
  IO.serviceWithEffect(Engine, engine =>
    engine.renderLoop(initialize(engine), updateGameState, drawGame())
  ),
  IO.provideSomeLayer(engineLive(Engine))
)

function updateGameState(state: Model, events: Chunk<GameEvent>) {
  return IO.reduce(
    events,
    state,
    (model, event) => eventReducer(model, event)
  )
}

function drawGame()  {
  return (state: Model) => pipe(
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

function onTick(e: GameTick, state: Model) {
  return pipe(
    applyVelocity(state, e.tick),
    IO.succeed,
    IO.tap(({ snake: [head], apple }) =>
      head[0] == apple[0] && head[1] == apple[1]
        ? state.publish({ _tag: 'eats' })
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
  return tick % 4 != 0 || (dx == 0 && dy == 0)
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
function gridLine ([fromX, fromY]: [number, number], [toX, toY]: [number, number])  {
  return C.withContext(IO.collectAllDiscard([
    C.scale(25, 25),
    C.moveTo(fromX, fromY),
    C.lineTo(toX, toY),
  ]))
}
const wallThickness = 25
const whiteBackground = (width: number, height: number) => pipe(
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
const gridBackground = (width: number, height: number) => pipe(
  IO.collectAllDiscard([
    C.clearRect(0, 0, width, height),
    C.setStrokeStyle('lightgrey'),
    C.beginPath,
    strokeLines(width, 'x'),
    strokeLines(height, 'y'),
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
void gridBackground

function strokeLines(size: number, direction: 'x'|'y') {
  return C.strokePath(IO.forEachDiscard(
    RA.range(0, size / 20)
    , start =>
        pipe(
          (gridLine(...<[[number, number], [number, number]]>(
            direction == 'x'
              ? [ [start , 0], [start, size] ]
              : [ [0, start], [size, start] ]
          ))
          )
        )
      ))
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
        C.rotate(22 * Math.PI / 180),
        C.rotate(Math.atan2(dy, dx)),
        C.withContext(C.strokePath(IO.collectAllDiscard([
          C.beginPath,
          C.moveTo(0, 0),
          C.lineTo(scale, 0),
          C.arc(0, 0, scale, 0,  Math.PI * 1.75),
          C.lineTo(0, 0),
          C.closePath,
        ]))),
        C.setFillStyle(`hsla(90deg, 50%, 30%, 0.75)`),
        C.fillPath(IO.collectAllDiscard([
          C.beginPath,
          C.moveTo(0, 0),
          C.lineTo(scale, 0),
          C.arc(0, 0, scale, 0,  Math.PI * 1.75),
          C.lineTo(0, 0),
          C.closePath,
        ])
        )
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
