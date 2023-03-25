import * as RA from '@effect/data/ReadonlyArray'
import * as IO from '@effect/io/Effect'
import * as Eq from '@effect/data/Number'
import * as Ord from '@effect/data/typeclass/Order'
import * as Str from '@effect/data/String'
import * as MQ from '@effect/data/MutableQueue'
import * as Tuple from '@effect/data/Tuple'
import { Tetromino, TetrominoTags, zero } from './tetromino'
import {flow, pipe} from '@effect/data/Function'
const tetrominoOrder = Ord.contramap((tetromino: Tetromino) => tetromino.type)(Str.Order)
const order = Tuple.getOrder(Eq.Order, tetrominoOrder)
export interface Deck {
  next: () => Tetromino
  preview: Iterable<Tetromino>
}
export class DeckImpl implements Deck {
  preview: MQ.MutableQueue<Tetromino>

  constructor() {
    this.preview = MQ.unbounded<Tetromino>()
  }
  refill(): Deck {
    void MQ.offerAll(this.preview, IO.runSync(shuffledDeck()))
    return this
  }

  next(): Tetromino {
    const size = MQ.length(this.preview)
    if(size <= 0 )
      this.refill()
    return MQ.poll(this.preview, zero)
  }
}
export function make(): Deck {
  return new DeckImpl()
}
export function shuffledDeck() {
  return pipe(
    IO.forEach(RA.range(0, TetrominoTags.length - 1), () => IO.randomWith(_ => _.next())),
    IO.map(flow(
      RA.zip(Tetromino.deck()),
      RA.sort(order),
      RA.map(Tuple.getSecond),
    )),
  )
}
export const shuffle = () => IO.runSync(shuffledDeck())
