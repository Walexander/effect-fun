import * as S from 'graphics-ts/Shape'
import * as Color from 'graphics-ts/Color'
import * as RA from '@effect/data/ReadonlyArray'
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
  s: S.path(RA.Foldable)([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
    S.point(1, -1),
  ]),
  z: S.path(RA.Foldable)([
    S.point(-1, -1),
    S.point(0, -1),
    S.point(0, 0),
    S.point(1, 0),
  ]),
  i: S.path(RA.Foldable)([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
    S.point(2, 0),
  ]),
  o: S.path(RA.Foldable)([
    S.point(-1, -1),
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
  ]),
  l: S.path(RA.Foldable)([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
    S.point(1, -1)
  ]),
  j: S.path(RA.Foldable)([
    S.point(-1, -1),
    S.point(-1, 0),
    S.point(0, 0),
    S.point(1, 0),
  ]),
  t: S.path(RA.Foldable)([
    S.point(-1, 0),
    S.point(0, 0),
    S.point(0, -1),
    S.point(1, 0),
  ])
}

const Colors: Record<ShapeTag, Color.Color> = {
  s: Color.hsla(120, 1, 0.5, 1),
  z: Color.hsla(0, 1, 0.5, 1),
  i: Color.hsla(180, 1, 0.5, 1),
  o: Color.hsla(60, 0.75, 0.5, 1),
  l: Color.hsla(39, 1, 0.5, 1),
  j: Color.hsla(240, 1, 0.5, 1),
  t: Color.hsla(276, 1, 0.5, 1),
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
const Rotations: Record<ShapeTag, [S.Path, S.Path, S.Path, S.Path]> = {
  s: rotateAround(Shapes.s),
  z: rotateAround(Shapes.z),
  i: rotateAround(Shapes.i),
  o: [Shapes.o, Shapes.o, Shapes.o, Shapes.o],
  l: rotateAround(Shapes.l),
  j: rotateAround(Shapes.j),
  t: rotateAround(Shapes.t),
}
const plusPoint = (p1: S.Point) => (p2: S.Point) => S.point(p1.x + p2.x, p1.y + p2.y)

// const Bounds: Record<ShapeTag, S.Rect> = {
//   s: S.rect(0, 0, 3, 3),
//   z: S.rect(0, 0, 3, 3),
// }
export class Tetromino {
  static deck = tetrominoDeck
  static tags = TetrominoTags
  readonly color: Color.Color
  constructor(
    readonly type: ShapeTag,
    readonly rotation = 0,
    readonly translation = S.point(0, 0)
  ) {
    this.color = Colors[this.type]
  }

  get path(): S.Path {
    return S.path(RA.Foldable)(
    // eslint-disable-next-line
      Rotations[this.type]
        .at(this.rotation)!
        .points.map(({ x, y }) =>
          S.point(x + this.translation.x, y + this.translation.y)
        )
    )
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
