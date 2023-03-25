import * as Context from '@effect/data/Context'
import * as IO from '@effect/io/Effect'
import * as Chunk from '@effect/data/Chunk'
type Chunk<A> = Chunk.Chunk<A>

export const EngineTag = <E>() => Context.Tag<Engine<E>>()
export interface GameTick {
  _tag: 'tick'
  now: number
  elapsed: number
  tick: number
}
export interface KeyUp {
  _tag: 'keyup'
  code: string
  key: string
}
export interface KeyDown {
  _tag: 'keydown'
  code: string
  key: string
}
export type BuiltinEvents = GameTick | KeyDown | KeyUp

export interface Engine<Event> {
  publish(event: Event|BuiltinEvents): IO.Effect<never, never, void>
  renderLoop<A, R1, R2>(
    initialize: IO.Effect<R1, never, A>,
    eventHandler: (v: A, events: Chunk<Event|BuiltinEvents>) => IO.Effect<never, never, A>,
    render: (model: A) => IO.Effect<R2, never, void>
  ): IO.Effect<R1 | R2, never, void>
}
