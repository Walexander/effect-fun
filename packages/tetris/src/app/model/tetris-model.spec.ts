import * as TM from './tetris-model'
import * as Deck from './deck'
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
