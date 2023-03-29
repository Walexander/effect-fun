import type { Path, Point } from 'graphics-ts/Shape'
import { point } from 'graphics-ts/Shape'
import { translate } from '../../path-utils'
import * as RA from '@effect/data/ReadonlyArray'
import * as N from '@effect/data/Number'
import * as O from '@effect/data/Option'
import * as Tuple from '@effect/data/Tuple'
import { Color, black } from 'graphics-ts/Color'
import { flow, identity, pipe, constant } from '@effect/data/Function'

export interface GameGrid {
  /**
   * find and remove all continuous rows
  */
  clear: () => readonly [number, GameGrid]
  readonly dimensions: { width: number; height: number }
  /**
   * check the status of a point on the grid
  */
  filled: <P extends { x: number; y: number }>(p: P) => Color | false
  /**
   * The first filled row as a list of columns
  */
  readonly floor: number[]
  /**
   * Check if a path can be placed into the grid
  */
  isLegal: (path: Path) => boolean
  /**
   * Lock the `next` path using `color`
  */
  lock(next: Path, color: Color): GameGrid
  /**
   * project a `path` onto the grid's floor
  */
  project(path: Path): Point
  /**
   * test if any points in `path` rest on a filled space
  */
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

  // Find a translation `Point` for a `Path`
  // corresponding with where it will land
  project(path: Path) {
    // translate function on the path
    const xlate: (p: Point) => Path = translate(path)
    // the "lowest" column of our path
    const maxRow = Math.max(...path.points.map(_ => _.y))

    // iterate over rows below our path and
    // and find the first one we touch
    const projectedRow = RA.range(1, this.dimensions.height - maxRow).find(
      rowStep => this.touches(xlate(point(0, rowStep)))
    )
    // our projection is one "above" the row we touch
    return point(0, (projectedRow??0) - 1)
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
