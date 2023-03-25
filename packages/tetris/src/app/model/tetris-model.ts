import * as IO from '@effect/io/Effect'
import * as MQ from '@effect/data/MutableQueue'
import { Tetromino } from './tetromino'
import * as RA from '@effect/data/ReadonlyArray'
import * as Board from './board'
import type { GameGrid } from './board'
import { shuffledDeck } from './deck'
import { point, path as path$, Point } from 'graphics-ts/Shape'
import * as Deck from './deck'

export interface TetrisModel<Board> {
  readonly score: number
  readonly board: Board
  // readonly tickInterval: Duration
  readonly bullpen: Deck.Deck
  readonly status: 'Active' | 'Paused' | 'Over'
}
export interface TetrisGame extends TetrisModel<GameGrid<Tetromino>> {
  readonly score: number
  drop(): TetrisGame
  move(direction: 'L'|'R'): TetrisGame
  tick(): TetrisGame
  spin(direction: 'L'|'R'): TetrisGame
}
export class TetrisModelImpl implements TetrisGame {
  constructor(readonly score: number,
    readonly board: GameGrid<Tetromino>,
    // readonly tickInterval: Duration = millis(160),
    readonly bullpen = Deck.make(),
    readonly status: 'Active' | 'Paused' = 'Paused'
  ) {}

  drop(): TetrisGame {
    return new TetrisModelImpl(this.score,
      this.board.add(this.board.active.translate(point(0, 1))),
      this.bullpen,
      this.status
    )
  }

  move(direction: 'L'|'R'): TetrisGame {
    const modifier = direction == 'L' ? -1 : 1
    const updated = this.board.active.translate(
      point(modifier, 0)
    )
    const active = updated.path.points.every(
      this.board.isLegal.bind(this.board)
    )
      ? updated
      : this.board.active
    return new TetrisModelImpl(this.score, this.board.add(active), this.bullpen)
  }

  tick(): TetrisGame {
    const next = this.board.active.translate(point(0, 1))
    const touching = next.path.points.some(({ x, y }) => y == this.board.floor[x])
    if(!touching)
      return new TetrisModelImpl(this.score, this.board.add(next), this.bullpen)

    const [score, board] = this.board.lock(
      this.bullpen.next()
        .translate(point(Math.floor(this.board.dimensions.width / 2), 0))
    ).clear()

    return new TetrisModelImpl(
      score + this.score,
      board,
      this.bullpen,
      this.status
    )
  }

  spin(direction: 'L'|'R'): TetrisGame {
    return new TetrisModelImpl(
      this.score,
      this.board.add(
        direction == 'L'
          ? this.board.active.turnLeft()
          : this.board.active.turnRight()
      ),
      this.bullpen,
      this.status
    )
  }
}

export function make(
  width: number,
  height: number,
  deck: Deck.Deck
): TetrisGame {
  const active = deck.next().translate(point(Math.floor(width / 2), 1))
  const board = Board.empty(width, height, active)
  return new TetrisModelImpl(0, board, deck, 'Active')
}
