import { Tetromino } from './tetromino'
import * as Board from './board'
import type { GameGrid } from './board'
import { point } from 'graphics-ts/Shape'
import * as Deck from './deck'

export interface TetrisModel<Board> {
  readonly active: Tetromino
  readonly board: Board
  readonly bullpen: Deck.Deck
  readonly isOver: boolean
  readonly score: number
  readonly status: 'Active' | 'Paused' | 'Over'
}
export interface TetrisGame extends TetrisModel<GameGrid> {
  drop(): TetrisGame
  move(direction: 'L' | 'R'): TetrisGame
  tick(): TetrisGame
  toggle(): TetrisGame
  spin(direction: 'L' | 'R'): TetrisGame
}
export class PausedTetrisGame implements TetrisGame {
  constructor(
    readonly score: number,
    readonly board: GameGrid,
    readonly bullpen = Deck.make(),
    readonly active: Tetromino
  ) {}
  get status(): 'Paused' {
    return 'Paused'
  }
  get isOver() {
    return false
  }
  drop(): TetrisGame {
    return this
  }
  move(): TetrisGame {
    return this
  }
  tick(): TetrisGame {
    return this
  }
  toggle(): TetrisGame {
    return new ActiveTetrisGame(
      this.score,
      this.board,
      this.bullpen,
      'Active',
      this.active
    )
  }
  spin(): TetrisGame {
    return this
  }
}
export class ActiveTetrisGame implements TetrisGame {
  constructor(
    readonly score: number,
    readonly board: GameGrid,
    readonly bullpen = Deck.make(),
    readonly status: 'Active' | 'Paused' | 'Over' = 'Paused',
    readonly active: Tetromino
  ) {}

  get isOver() {
    return this.status == 'Over'
  }

  drop(): TetrisGame {
    return new ActiveTetrisGame(
      this.score,
      this.board,
      this.bullpen,
      this.status,
      this.active.translate(point(0, 1))
    )
  }

  move(direction: 'L' | 'R'): TetrisGame {
    const modifier = direction == 'L' ? -1 : 1
    const updated = this.active.translate(point(modifier, 0))
    return new ActiveTetrisGame(
      this.score,
      this.board,
      this.bullpen,
      this.status,
      this.board.isLegal(updated.path) ? updated : this.active
    )
  }

  tick(): TetrisGame {
    const next = this.active.translate(point(0, 1))
    const touching = this.board.touches(next.path)
    return touching
      ? this.lockAndClear()
      : new ActiveTetrisGame(
          this.score,
          this.board,
          this.bullpen,
          this.status,
          next
        )
  }

  lockAndClear() {
    const next_ = this.bullpen
      .next()
      .translate(point(Math.floor(this.board.dimensions.width / 2), 0))
    const [score, board] = this.board
      .lock(this.active.path, this.active.color)
      .clear()

    return new ActiveTetrisGame(
      score + this.score,
      board,
      this.bullpen,
      this.active.path.points.some(({ y }) => y <= 0) ? 'Over' : this.status,
      next_
    )
  }

  toggle() {
    return new PausedTetrisGame(
      this.score,
      this.board,
      this.bullpen,
      this.active
    )
  }

  spin(direction: 'L' | 'R'): TetrisGame {
    let next =
      direction == 'L' ? this.active.turnLeft() : this.active.turnRight()
    // wall kick
    if (next.path.points.some(_ => _.x < 0)) next = next.translate(point(1, 0))
    else if (next.path.points.some(_ => _.x >= this.board.dimensions.width))
      next = next.translate(point(-1, 0))
    // floor kick
    if (next.path.points.some(_ => _.y >= this.board.dimensions.height))
      next = next.translate(
        point(
          0,
          next.path.points.reduce((pMax, p) => (p.y >= pMax ? p.y : pMax), 0) -
            this.board.dimensions.height -
            1
        )
      )

    return this.board.isLegal(next.path)
      ? new ActiveTetrisGame(
          this.score,
          this.board,
          this.bullpen,
          this.status,
          next
        )
      : this
  }
}

export function make(
  width: number,
  height: number,
  deck: Deck.Deck
): TetrisGame {
  const active = deck.next().translate(point(Math.floor(width / 2), 1))
  const board = Board.empty(width, height)
  return new ActiveTetrisGame(0, board, deck, 'Active', active)
}
