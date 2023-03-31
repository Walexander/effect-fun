import { Tetromino } from './tetromino'
import * as RA from '@effect/data/ReadonlyArray'
import * as S from 'graphics-ts/Shape'

describe('Tetronimonoo', () => {
  it('should construct', () =>
    expect(new Tetromino('s')).to.toBeInstanceOf(Tetromino))
  describe('#path', () =>
    it('returns the correct path', () =>
      expect(new Tetromino('s').path).to.deep.equal(
        S.path(RA.Foldable)([
          S.point(-1, 0),
          S.point(0, 0),
          S.point(0, -1),
          S.point(1, -1),
        ])
      )))

  describe('turnLeft', () =>
    it('/should rotate', () =>
      expect(new Tetromino('s').turnLeft().path).to.deep.equal(
        S.path(RA.Foldable)([
          S.point(0, 1),
          S.point(0, 0),
          S.point(-1, 0),
          S.point(-1, -1),
        ])
      )))
  it('should fail', () =>
    expect(new Tetromino('s')).to.toBeInstanceOf(Tetromino))
})
