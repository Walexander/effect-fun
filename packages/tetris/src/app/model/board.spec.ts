import * as S from 'graphics-ts/Shape'
import * as RA from '@effect/data/ReadonlyArray'
import * as IO from '@effect/io/Effect'
import * as Board from './board'
import { shuffledDeck } from './deck'
import { black, white } from 'graphics-ts/Color'

const path = S.path(RA.Foldable)
const point = S.point
describe('Board', () => {
  const deck = IO.runSync(shuffledDeck())
  const empty = (width: number, height: number) => Board.empty(width, height)
  it('can be created', () => {
    const board = empty(10, 20)
    expect(board).to.be.ok
  })

  describe('dimensions', () => {
    it('stores rows and columns', () =>
      expect(empty(10, 20).dimensions).to.deep.equal({
        width: 10,
        height: 20,
      }))
  })

  describe('lock', () => {
    it('cannot lock rows outside of dims', () =>
      expect(empty(1, 1).lock(path([point(1, 1)]), black)).to.deep.equal(
        Board.empty(1, 1)
      ))
  })
  describe('empty', () => {
    const board = Board.empty(3, 3)
    it('returns a grid', () =>
      expect(board.lock(deck[0].path, deck[0].color)).to.be.ok)

    describe('floor', () => {
      it('returns one element for each row', () =>
        expect(board.floor).toHaveLength(board.dimensions.width))

      it('empty grid has floor equal to width', () =>
        expect(board.floor).to.deep.equal([3, 3, 3]))

      it('lock updates horizonal floor', () =>
        expect(
          board.lock(path([point(0, 2), point(1, 2)]), deck[0].color).floor
        ).to.deep.equal([2, 2, 3]))
      it('lock updates vertical floor', () =>
        expect(
          board.lock(path([point(0, 2), point(0, 1)]), black).floor
        ).to.deep.equal([1, 3, 3]))
    })
  })

  describe('clear', () => {
    const board = Board.empty(4, 3)
    describe('empty', () => {
      it('is identity', () => expect(board.clear()).to.deep.equal([0, board]))
    })
    describe('non empty', () => {
      const board_ = board.lock(path([point(0, 2), point(1, 2)]), white)
      it('does not clear non-empty lines', () =>
        expect(board_.clear()).to.deep.equal([0, board_]))
    })
    describe('single locked row', () => {
      const board_ = Board.empty(2, 1).lock(
        path([point(0, 0), point(1, 0)]),
        white
      )
      it('clears the empty lines, returns a score of 1', () =>
        expect(board_.clear()).to.deep.equal([1, Board.empty(2, 1)]))
    })
    describe('multiple locked rows', () => {
      const board_ = Board.empty(2, 2)
        .lock(path([point(0, 0), point(1, 0)]), white)
        .lock(path([point(0, 1), point(1, 1)]), white)
      it('clears the empty lines, returns a score of 1', () =>
        expect(board_.clear()).to.deep.equal([2, Board.empty(2, 2)]))
    })
  })

  describe('filled()', () => {
    const board = Board.empty(2, 2)
    it('empty board return false everywhere', () =>
      expect([
        board.filled(point(0, 0)),
        board.filled(point(1, 0)),
        board.filled(point(0, 1)),
        board.filled(point(1, 1)),
      ]).to.deep.equal(new Array(4).fill(false)).all)

    describe('non-empty board', () => {
      const board_ = board.lock(path([point(0, 0)]), white)
      it('locked pieces return true', () =>
        expect(board_.filled(point(0, 0))).to.be.ok)
      it('unlocked pieces are false', () =>
        expect([
          board_.filled(point(1, 0)),
          board_.filled(point(0, 1)),
          board_.filled(point(1, 1)),
        ]).to.deep.equal([false, false, false]))
    })
  })

  describe('project', () => {
    it('empty board projects onto last row', () => {
      const board = Board.empty(2, 3)
      expect(board.project(path([point(0, 0)]))).to.deep.equal(
        point(0, 2)
      )
    })
    it('projects onto the first filled column', () => {
      const board = Board.empty(2, 3).lock(path([point(0, 2)]), white)
      expect(board.project(path([point(0, 0)])))
        .to.deep.equal(point(0, 1))
    })
  })
})
