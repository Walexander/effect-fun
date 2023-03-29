import type { Path, Point } from 'graphics-ts/Shape'
import { point, path as path$ } from 'graphics-ts/Shape'
import * as RA from '@effect/data/ReadonlyArray'
export const path = path$(RA.Foldable)
export const plusPoint = (p1: Point) => (p2: Point) => point(p1.x + p2.x, p1.y + p2.y)
/**
* Translate a path by the given vector
*
* @category operations
* @since 1.0.0
*/
export function translate(path_: Path): (point: Point) => Path {
  return (point: Point) => path(path_.points.map(plusPoint(point)))
}
