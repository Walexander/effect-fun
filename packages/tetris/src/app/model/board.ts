import type { Path, Point } from 'graphics-ts/Shape'
import { path as path$, point} from 'graphics-ts/Shape'
import * as RA from '@effect/data/ReadonlyArray'
import * as N from '@effect/data/Number'
import * as O from '@effect/data/Option'
import * as Tuple from '@effect/data/Tuple'
import { flow, identity, pipe, constant  } from '@effect/data/Function'
import { Tetromino } from './tetromino'

const path = path$(RA.Foldable)

export interface GameGrid<T> {
  // activate: (t: T) => GameGrid<T>
  readonly active: T
  add: (t: T) => GameGrid<T>
  clear: () => readonly [number, GameGrid<T>]
  readonly dimensions: { width: number; height: number }
  filled: <P extends { x: number; y: number }>(p: P) => boolean
  readonly floor: number[]
  isLegal: (point: Point) => boolean
  lock(next: T): GameGrid<T>
  isOver: boolean
}

const plusPoint = (p1: Point) => (p2: Point) => point(p1.x + p2.x, p1.y + p2.y)
class BoardData implements GameGrid<Tetromino> {
  constructor(
    readonly dims: { width: number; height: number },
    readonly grid: boolean[][],
    readonly active: Tetromino,
  ) {}

  add(piece: Tetromino): GameGrid<Tetromino> {
    return piece.path.points.every(
        ({x, y}) => (x >= 0 && x < this.dims.width) && (y < 0 || !this.grid[y][x]))
      ? new BoardData(this.dims, this.grid, piece)
      : this
  }

  clear(): [number, GameGrid<Tetromino>] {
    const grid = RA.filter(this.grid, this.isClear.bind(this))
    const score = this.grid.length - grid.length
    const emptyRows =
      score > 0
        ? RA.makeBy(score, constant(RA.makeBy(this.dims.width, constant(false))))
        : RA.empty()
    return Tuple.tuple<[number, GameGrid<Tetromino>]>(
      score,
      new BoardData(this.dims, RA.prependAll(grid, emptyRows), this.active)
    )
  }

  isClear(row: boolean[], rowIndex: number) {
    return rowIndex == this.dims.height || row.some(locked => !locked)
  }

  get dimensions() {
    return {
      ...this.dims,
    }
  }

  filled(point: Point) {
    return this.grid[point.y][point.x] ||
      !!this.active.path.points.some(({x, y}) => x == point.x && y == point.y)
  }

  get floor() {
    return RA.map(
      transpose(this.grid),
      flow(
        RA.filterMap((locked, i) => (locked ? O.some(i) : O.none())),
        RA.combineMap(N.MonoidMin)(identity)
      )
    )
  }

  drop() {
    return new BoardData(this.dims, this.grid,
      this.active.translate(plusPoint(point(0, 1))(this.active.translation))
    )
  }

  move(direction: 'L' | 'R') {
    const modifier = direction == 'L' ? -1 : 1
    const updated = this.active.translate(plusPoint(point(modifier, 0))(this.active.translation))


    path(this.active.path.points.map(({x, y}) => point(x + modifier, y)))

    return new BoardData(this.dims, this.grid,
      updated.path.points.every(this.isLegal.bind(this)) ? updated : this.active
    )
  }
  rotate(direction: 'L' | 'R') {
    const active = direction == 'L' ? this.active.turnLeft() : this.active.turnRight()
    return new BoardData(this.dimensions, this.grid, active)
  }

  isLegal(point: Point) {
    return !this.grid[point.y]?.[point.x] && point.x >= 0 && point.x < this.dimensions.width
  }

  lock(next: Tetromino): GameGrid<Tetromino> {
    const grid = pipe(
      this.active?.path.points || [],
      RA.filter(p => p.x < this.dims.width && p.y < this.dims.height),
      RA.reduce(this.grid, (prev, curr) =>
        RA.modify(prev, curr.y, row => RA.modify(row, curr.x, constant(true)))
      )
    )
    return new BoardData(this.dims, grid, next)
  }

  get isOver() {
    return this.active.path.points.some(_ => this.grid[_.y][_.x])
  }
}

export function empty(width: number, height: number, active: Tetromino): GameGrid<Tetromino> {
  return new BoardData({ width, height }, makeGrid(width, height), active)
}

export function transpose<A>(array: A[][]) {
  return pipe(
    RA.range(0, array[0].length - 1),
    RA.map(column => array.map((a) => a[column])),
  )
}

function makeGrid(width: number, height: number): boolean[][] {
  return new Array(height)
    .fill(new Array(width).fill(false))
    .map(_ => _.slice(0))
    .concat([new Array(width).fill(true).slice(0)])
}
