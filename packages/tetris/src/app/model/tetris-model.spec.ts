import { Tetrominos } from './tetromino'
import * as IO from '@effect/io/Effect'
import * as MQ from '@effect/data/MutableQueue'
import * as TM from './tetris-model'
import * as Deck from './deck'
import {pipe} from '@effect/data/Function'


const size = Object.keys(Tetrominos).length
MQ.bounded(size)
describe('model', () =>  {
  let deck = Deck.make()
  beforeEach(() => {
    deck = Deck.make()
  })
  describe('make()', () => {
    it('TetrisModel.make()', () => expect(TM.make(10, 2, deck)).to.be.ok)
    it('accepts a deck', () => {
      expect(TM.make(10, 1, deck).bullpen).to.equal(deck)
    })
  })
  describe('tick())', () => {
    it('drops the piece', () => {
      void null
    })
  })
})
