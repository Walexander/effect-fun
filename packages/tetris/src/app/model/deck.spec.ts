import * as Deck from './deck'
import * as IO from '@effect/io/Effect'
import {pipe} from '@effect/data/Function'
  describe('shuffledDeck', () => {
    it('should return 7 pieces', () =>pipe(
      Deck.shuffledDeck(),
      IO.map(_ => expect(_).toHaveLength(7)),
      IO.runPromise
    ))
    it('should return them in different order', () => pipe(
      IO.all([Deck.shuffledDeck(), Deck.shuffledDeck()]),
      IO.map(([left, right]) => expect(left).not.to.deep.equal(right)),
      IO.runPromise
    ))
  })
