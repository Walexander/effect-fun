import type { Path, Point } from 'graphics-ts/Shape'
import * as RA from '@effect/data/ReadonlyArray'
import * as N from '@effect/data/Number'
import * as O from '@effect/data/Option'
import * as Tuple from '@effect/data/Tuple'
import { Color, black } from 'graphics-ts/Color'
import { flow, identity, pipe, constant } from '@effect/data/Function'
export interface GameGrid {
  clear: () => readonly [number, GameGrid]
  readonly dimensions: { width: number; height: number }
  filled: <P extends { x: number; y: number }>(p: P) => Color | false
  readonly floor: number[]
  isLegal: (path: Path) => boolean
  lock(next: Path, color: Color): GameGrid
  touches: (path: Path) => boolean
}

class BoardData implements GameGrid {
  constructor(
    readonly dims: { width: number; height: number },
    readonly grid: (Color | false)[][]
  ) {}

  clear(): [number, GameGrid] {
    const grid = RA.filter(this.grid, this.isClear.bind(this))
    const score = this.grid.length - grid.length
    const emptyRows: Array<Color | false>[] =
      score > 0
        ? RA.makeBy(
            score,
            constant(RA.makeBy(this.dims.width, constant(false)))
          )
        : RA.empty()
    return Tuple.tuple<[number, GameGrid]>(
      score,
      new BoardData(this.dims, RA.prependAll(grid, emptyRows))
    )
  }

  isClear(row: (Color | false)[], rowIndex: number) {
    return rowIndex == this.dims.height || row.some(locked => !locked)
  }

  get dimensions() {
    return {
      ...this.dims,
    }
  }

  filled(point: Point) {
    return (
      point.y < this.grid.length &&
      point.x < this.dimensions.width &&
      point.y >= 0 &&
      this.grid[point.y][point.x]
    )
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

  isLegal(path: Path) {
    return path.points.every(
      ({ x, y }) => !this.grid[y]?.[x] && x >= 0 && x < this.dimensions.width
    )
  }

  touches(path: Path) {
    return path.points.some(this.filled.bind(this))
  }

  lock(next: Path, color: Color): GameGrid {
    const grid = pipe(
      next.points || [],
      RA.reduce(this.grid, (prev, curr) =>
        RA.modify(prev, curr.y, row => RA.modify(row, curr.x, constant(color)))
      )
    )
    return new BoardData(this.dims, grid)
  }
}

export function empty(width: number, height: number): GameGrid {
  return new BoardData({ width, height }, makeGrid(width, height))
}

export function transpose<A>(array: A[][]) {
  return pipe(
    RA.range(0, array[0].length - 1),
    RA.map(column => array.map(a => a[column]))
  )
}

function makeGrid(width: number, height: number): (Color | false)[][] {
  return new Array(height)
    .fill(new Array(width).fill(false))
    .map(_ => _.slice(0))
    .concat([new Array(width).fill(black).slice(0)])
}
