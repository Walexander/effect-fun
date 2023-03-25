import * as Board from './board'
import * as S from 'graphics-ts/Shape'
import * as RA from '@effect/data/ReadonlyArray'
import * as IO from '@effect/io/Effect'
import {shuffledDeck} from './deck'

const path = S.path(RA.Foldable)
const point = S.point
describe('Board', () => {
  const deck = IO.runSync(shuffledDeck())
  const empty = (width: number, height: number) => Board.empty(width, height, deck[0])
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

  describe('empty', () => {
    const board = Board.empty(3, 3, deck[0])
    it('returns a grid', () =>
      expect(board
        .lock(deck[0])).to.be.ok)

    describe('floor', () => {
      it('returns one element for each row', () =>
        expect(board.floor).toHaveLength(board.dimensions.width))

      it('empty grid has floor equal to width', () =>
        expect(board.floor).to.deep.equal([3, 3, 3]))

      // it.skip('lock updates the floor', () =>
      //   expect(
      //     board.add(deck)
      //     .lock().floor
      //   ).to.deep.equal([2, 2, 3]))
      // it('lock updates the floor', () =>
      //   expect(
      //     board.add(path([point(0, 2), point(0, 1)])).lock().floor
      //   ).to.deep.equal([1, 3, 3]))
    })
  })

//   describe('lock', () => {
//     it('cannot lock rows outside of dims', () =>
//       expect(empty(1, 1)
//         .add(path([point(1, 1)]))
//         .lock()).to.deep.equal(
//         Board.empty(1,1).lock()
//       )
//     )
//     it('locks the active path', () => {
//       expect(Board.empty(1, 1).lock()).to.be.ok
//     })
//   })

//   describe('clear', () => {
//     const board = Board.empty(4, 3, deck[0])
//     describe('empty', () => {
//       it('is identity', () => expect(board.clear()).to.deep.equal([0, board]))
//     })
//     describe('non empty', () => {
//       const board_ = board.add(path([point(0, 2), point(1, 2)])).lock()
//       it('does not clear non-empty lines', () =>
//         expect(board_.clear()).to.deep.equal([0, board_]))
//     })
//     describe('single locked row', () => {
//       const board_ = Board.empty(2, 1).add(path([point(0, 0), point(1, 0)])).lock()
//       it('clears the empty lines, returns a score of 1', () =>
//         expect(
//           board_.clear()
//         ).to.deep.equal([1, Board.empty(2, 1)]))
//     })
//     describe('multiple locked rows', () => {
//       const board_ = Board.empty(2, 2)
//         .add(path([point(0, 0), point(1, 0)]))
//         .lock()
//         .add(path([point(0, 1), point(1, 1)]))
//         .lock()
//       it('clears the empty lines, returns a score of 1', () =>
//         expect(board_.clear()).to.deep.equal([2, Board.empty(2, 2)]))
//     })
//   })

//   describe('filled()', () => {
//     const board = Board.empty(2, 2, deck[0])
//     it('empty board return false everywhere', () => expect([
//       board.filled(point(0, 0)),
//       board.filled(point(1, 0)),
//       board.filled(point(0, 1)),
//       board.filled(point(1, 1)),
//     ]).to.deep.equal(new Array(4).fill(false)).all)

//     describe('non-empty board', () => {
//       const board_ = board.add(path([point(0, 0)])).lock()
//       it('locked pieces return true', () => expect(board_.filled(
//         point(0, 0)
//       )).to.be.ok)
//       it('unlocked pieces are false', () => expect([
//           board_.filled(point(1, 0)),
//           board_.filled(point(0, 1)),
//           board_.filled(point(1, 1)),
//       ]).to.deep.equal([false, false, false]))
//     })
//   })

//   describe('add', () => {
//     const board = Board.empty(2, 2, deck[0])
//     it('adds the piece', () => expect(board.add({
//       points: [point(0, 0), point(0, 1)]
//     })).to.be.ok)

//     it('marks added pieces as filled', () => expect(board.add({
//       points: [point(0, 0), point(0, 1)]
//     }).filled(point(0, 0))).to.equal(true))
//   })

//   describe('transpose', () => {
//     it('transposes 1x2 array', () =>
//       expect(Board.transpose([[0, 1]])).to.deep.equal([[0], [1]]))
//     it('transposes 2x2 array', () =>
//       expect(
//         Board.transpose([
//           [0, 1],
//           [2, 3],
//         ])
//       ).to.deep.equal([
//         [0, 2],
//         [1, 3],
//       ]))
//   })
})
