export type Generator<T> = { next: () => T }

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type Board<T> = {
    width: number;
    height: number;
    pieces: T[];
    generator: Generator<T>;
};

export type Effect<T> = {
    kind: string,
    match?: Match<T>,
    board? : Board<T>
};

export type MoveResult<T> = {
    board: Board<T>,
    effects: Effect<T>[]
}

export function create<T>(generator: Generator<T>, width: number, height: number): Board<T> {
    let board: Board<T> = {
        width: width,
        height: height,
        generator: generator,
        pieces: []
    };

    for (let index = 0; index < width * height; index++) {
        board.pieces[index] = generator.next();
    }

    return board;
}

export function piece<T>(board: Board<T>, p: Position): T | undefined {
    if (p.col < 0 || p.col >= board.width || p.row < 0 || p.row >= board.height)
        return undefined;

    return board.pieces[PositionToIndex(p, board.width)];
}

export function canMove<T>(board: Board<T>, first: Position, second: Position): boolean {
    if (first.col == second.col && first.row == second.row)
        return false;
    var p1 = piece(board, first);
    var p2 = piece(board, second);

    if (p1 == undefined || p2 == undefined)
        return false;

    var deltaX = first.col - second.col;
    var deltaY = first.row - second.row;
    if (deltaX != 0 && deltaY != 0)
        return false;

    swap(board, first, second);

    // Foreach row
    for (let Y = 0; Y < board.height; Y++) {
        var last = board.pieces[CoordsToIndex(0, Y, board.width)];
        var count = 0;
        for (let X = 1; X < board.width; X++) {
            const element = board.pieces[CoordsToIndex(X, Y, board.width)];
            if (element === last) {
                count++;
                if (count >= 2) {
                    swap(board, first, second);
                    return true;
                }
            } else {
                count = 0;
            }
            last = element;
        }
    }

    // Foreach col
    for (let X = 0; X < board.width; X++) {
        var last = board.pieces[CoordsToIndex(X, 0, board.width)];
        var count = 0;
        for (let Y = 1; Y < board.height; Y++) {
            const element = board.pieces[CoordsToIndex(X, Y, board.width)];
            if (element === last) {
                count++;
                if (count >= 2) {
                    swap(board, first, second);
                    return true;
                }
            } else {
                count = 0;
            }
            last = element;
        }
    }

    swap(board, first, second);
    return false;
}

export function move<T>(generator: Generator<T>, board: Board<T>, first: Position, second: Position): MoveResult<T> {
    
    let moveResult: MoveResult<T> = {
        board: board,
        effects: []
    };

    if (!canMove(board, first, second))
        return moveResult;

    if (first.col == second.col && first.row == second.row)
        return moveResult;

    var p1 = piece(board, first);
    var p2 = piece(board, second);

    if (p1 == undefined || p2 == undefined)
        return moveResult;

    var deltaX = first.col - second.col;
    var deltaY = first.row - second.row;
    if (deltaX != 0 && deltaY != 0)
        return moveResult;

    swap(board, first, second);

    moveResult = evolveBoard(moveResult);

    return moveResult;
}

function evolveBoard<T>(moveResult : MoveResult<T>): MoveResult<T> {
    let events: Effect<T>[] = [];

    // Foreach row
    for (let Y = 0; Y < moveResult.board.height; Y++) {
        var last = moveResult.board.pieces[CoordsToIndex(0, Y, moveResult.board.width)];
        var count = 0;

        let match: Match<T> = {
            matched: last,
            positions: []
        };

        for (let X = 1; X < moveResult.board.width; X++) {
            const index = CoordsToIndex(X, Y, moveResult.board.width);
            const element = moveResult.board.pieces[index];
            if (element === last) {
                count++;
            } else {
                count = 0;
            }

            if (count == 1) {
                match.positions.push(IndexToPosition(index - 1, moveResult.board.width));
                match.positions.push(IndexToPosition(index, moveResult.board.width));
            }
            else if (count > 1) {
                match.positions.push(IndexToPosition(index, moveResult.board.width));
            }

            if (count == 0 || X == moveResult.board.width - 1) {
                //Fire event
                if (match.positions.length >= 3) {
                    match.matched = last;
                    let event: Effect<T> = {
                        kind: "Match",
                        match: match
                    };

                    events.push(event);
                    match = {
                        matched: last,
                        positions: []
                    };
                }
                match.positions = [];
            }

            last = element;
        }
    }

    // Foreach col
    for (let X = moveResult.board.width - 1; X >= 0; X--) {
        var last = moveResult.board.pieces[CoordsToIndex(X, 0, moveResult.board.width)];
        var count = 0;

        let match: Match<T> = {
            matched: last,
            positions: []
        };

        for (let Y = 1; Y < moveResult.board.height; Y++) {
            const index = CoordsToIndex(X, Y, moveResult.board.width);
            const element = moveResult.board.pieces[index];
            if (element === last) {
                count++;
            } else {
                count = 0;
            }

            if (count == 1) {
                match.positions.push(IndexToPosition(index - moveResult.board.width, moveResult.board.width));
                match.positions.push(IndexToPosition(index, moveResult.board.width));
            }
            else if (count > 1) {
                match.positions.push(IndexToPosition(index, moveResult.board.width));
            }

            if (count == 0 || Y == moveResult.board.height - 1) {
                //Fire event
                if (match.positions.length >= 3) {
                    match.matched = last;
                    let event: Effect<T> = {
                        kind: "Match",
                        match: match
                    };

                    events.push(event);
                    match = {
                        matched: last,
                        positions: []
                    };
                }
                match.positions = [];
            }

            last = element;
        }
    }

    moveResult.effects = moveResult.effects.concat(events);

    if (events.length == 0) {
        return moveResult;
    }

    events.forEach(element => {
        element.match.positions.forEach(position => {
            moveResult.board.pieces[PositionToIndex(position, moveResult.board.width)] = undefined;
        });
    });

    while (moveResult.board.pieces.includes(undefined)) {
        gravity(moveResult.board);
        for (let index = 0; index < moveResult.board.width; index++) {
            const element = moveResult.board.pieces[index];
            if (element == undefined) {
                moveResult.board.pieces[index] = moveResult.board.generator.next();
            }
        }
    }

    let event: Effect<T> = {
        kind: "Refill",
        board: moveResult.board
    };
    moveResult.effects.push(event);

    moveResult = evolveBoard(moveResult);

    return moveResult;
}

function gravity<T>(board: Board<T>) {
    for (let col = 0; col < board.width; col++) {
        for (let row = board.height - 1; row >= 0; row--) {
            let lookUp = 0;
            while (board.pieces[CoordsToIndex(col, row, board.width)] == undefined && row - lookUp > 0) {
                lookUp++;
                board.pieces[CoordsToIndex(col, row, board.width)] = board.pieces[CoordsToIndex(col, row - lookUp, board.width)]
                board.pieces[CoordsToIndex(col, row - lookUp, board.width)] = undefined;
            }
        }
    }
}

function swap<T>(board: Board<T>, first: Position, second: Position) {
    var p1 = board.pieces[PositionToIndex(first, board.width)];
    var p2 = board.pieces[PositionToIndex(second, board.width)];
    board.pieces[PositionToIndex(first, board.width)] = p2;
    board.pieces[PositionToIndex(second, board.width)] = p1;
}

function IndexToPosition(i: number, width: number): Position {
    let pos: Position = {
        col: i % width,
        row: Math.floor(i / width)
    };
    return pos;
}

function PositionToIndex(position: Position, width: number): number {
    return position.col + (position.row * width);
}
function CoordsToIndex(col: number, row: number, width: number): number {
    return col + (row * width);
}