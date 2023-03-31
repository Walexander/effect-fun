import * as S from 'graphics-ts/Shape'
import * as Color from 'graphics-ts/Color'
import * as RA from '@effect/data/ReadonlyArray'
import { path, translate, plusPoint } from '../path-utils'
export type ShapeTag = 's' | 'z' | 'i' | 'o'| 'l' | 'j' | 't'
export const TetrominoTags: ShapeTag[] = [ 's' , 'z' , 'i' , 'o', 'l' , 'j' , 't' ]
export enum Tetrominos {
  S = 's',
  Z = 'z',
  I = 'i',
  O = 'o',
  L = 'l',
  J = 'j',
  T = 't'
}

const Shapes: Record<ShapeTag, S.Path> = {
  s: path([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
    S.point(1, -1),
  ]),
  z: path([
    S.point(-1, -1),
    S.point(0, -1),
    S.point(0, 0),
    S.point(1, 0),
  ]),
  i: path([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
    S.point(2, 0),
  ]),
  o: path([
    S.point(-1, -1),
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
  ]),
  l: path([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
    S.point(1, -1)
  ]),
  j: path([
    S.point(-1, -1),
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
  ]),
  t: path([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
    S.point(1, 0),
  ])
}

const Colors: Record<ShapeTag, Color.Color> = {
  s: Color.hsla(120, 0.5, 0.5, 1),
  z: Color.hsla(0, 0.5, 0.5, 1),
  i: Color.hsla(180, 0.5, 0.5, 1),
  o: Color.hsla(60, 0.5, 0.5, 1),
  l: Color.hsla(39, 0.5, 0.5, 1),
  j: Color.hsla(240, 0.5, 0.5, 1),
  t: Color.hsla(276, 0.5, 0.5, 1),
}

const Rotations: Record<ShapeTag, [S.Path, S.Path, S.Path, S.Path]> = {
  s: rotateAround(Shapes.s),
  z: rotateAround(Shapes.z),
  i: rotateAround(Shapes.i),
  o: [Shapes.o, Shapes.o, Shapes.o, Shapes.o],
  l: rotateAround(Shapes.l),
  j: rotateAround(Shapes.j),
  t: rotateAround(Shapes.t),
}
export class Tetromino {
  static deck = tetrominoDeck
  static tags = TetrominoTags
  constructor(
    readonly type: ShapeTag,
    readonly rotation = 0,
    readonly translation = S.point(0, 0)
  ) {
  }

  get path(): S.Path {
      // eslint-disable-next-line
    const path_ = Rotations[this.type].at(this.rotation)!
    return translate(path_)(this.translation)
  }

  get color() {
    return Colors[this.type]
  }

  get center() {
    return this.path.points.findIndex(({x, y}) => x == 0 && y == 0)
  }

  turnLeft() {
    return new Tetromino(this.type, (this.rotation + 4 - 1) % 4, this.translation)
  }

  turnRight() {
    return new Tetromino(this.type, (this.rotation + 1) % 4, this.translation)
  }

  translate(point: S.Point) {
    return new Tetromino(this.type, this.rotation, plusPoint(this.translation)(point))
  }
}
export const zero = new Tetromino(Tetrominos.I)
export function tetrominoDeck() {
  return TetrominoTags.map(_ => new Tetromino(_, 0))
}
function rotateAround(path: S.Path): [S.Path, S.Path, S.Path, S.Path] {
  const once = rotateClockwise(path)
  const twice = rotateClockwise(once)
  const thrice = rotateClockwise(twice)
  return [
    path,
    once,
    twice,
    thrice
  ]
}

export function rotateClockwise(path: S.Path): S.Path {
  return S.path(RA.Foldable)(
    path.points.map(
      (point) => S.point(-point.y, point.x))
  )
}
