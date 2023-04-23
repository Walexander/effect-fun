import { Engine, BuiltinEvents } from "./definition"
import { Tag } from '@effect/data/Context'
import * as IO from '@effect/io/Effect'
import * as Queue from '@effect/io/Queue'
import * as S from '@effect/stream/Stream'
import * as Chunk from '@effect/data/Chunk'
import { pipe } from '@effect/data/Function'

class DomEngineLive<E> implements Engine<E> {
  constructor(readonly eventQueue: Queue.Queue<E|BuiltinEvents>) {}

  publish(event: E|BuiltinEvents) {
    return this.eventQueue.offer(event);
  }

  renderLoop<A, R1, R2>(
    initialize: IO.Effect<R1, never, A>,
    eventHandler: (v: A, event: Chunk.Chunk<E|BuiltinEvents>) => IO.Effect<never, never, A>,
    render: (model: A) => IO.Effect<R2, never, void>
  ): IO.Effect<R1 | R2, never, void> {
    return pipe(
      S.fromEffect(initialize),
      S.flatMap((initial) =>
        pipe(
          animationFrameStream(window),
          S.mapAccum(<readonly [number, number]>[0, 0], gameTick),
          S.tap(this.publish.bind(this)),
          S.mapAccumEffect(initial, update(this.eventQueue)),
          S.tap(render)
        )
      ),
      S.runDrain,
      IO.zipPar(keyEvent('keyup', this.eventQueue)),
      IO.zipPar(keyEvent('keydown', this.eventQueue)),
    )

    function update(queue: Queue.Queue<E|BuiltinEvents>) {
      return (state: A) => pipe(
        queue.takeAll(),
        IO.flatMap((events) => eventHandler(state, events)),
        IO.map(_ => [_, _] as const)
      )
    }

    function gameTick([ticks, last]: readonly [number, number], now: number) {
      return [[ticks + 1, now], <E>{
        _tag: 'tick',
        now,
        tick: ticks + 1,
        elapsed: now - last,
      }] as const
    }
  }
}

function animationFrameStream(window: Window) {
  return S.asyncEffect<never, never, number>((emit) => {
    return IO.sync(() => window.requestAnimationFrame(loop))
    function loop(time: number) {
      return emit(pipe(
        IO.sync(() => window.requestAnimationFrame(loop)),
        IO.as(Chunk.of(time))
      ))
    }
  })
}

function keyEvent<E>(eventType: 'keyup'|'keydown', queue: Queue.Queue<E>) {
  return pipe(
    S.asyncEffect<never, never, KeyboardEvent>((emit) =>
      IO.sync(() =>
        document.addEventListener(eventType, (ev) => emit(IO.succeed(Chunk.of(ev))))
      )
    ),
    // S.tap(_ => IO.sync(() => _.preventDefault())),
    S.map(event => (<E>{
      _tag: eventType,
      code: event.code,
      key: event.key
    })),
    S.tap(_ => queue.offer(_)),
    S.runDrain
  )
}

export const LiveDomEngine = <E>(tag: Tag<Engine<E>>) =>
  IO.toLayer(
    IO.gen(function* ($) {
      const queue = yield* $(Queue.unbounded<E|BuiltinEvents>());
      return new DomEngineLive(queue);
    }),
    tag
  )
