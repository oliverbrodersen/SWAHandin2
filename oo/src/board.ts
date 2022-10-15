export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = ?;

export type BoardListener<T> = ?;

export class Board<T> {

    width : number;
    height : number;
    generator : Generator<T>;

    pieces : T[];

    constructor(generator: Generator<T>, width : number, height : number) {
        this.generator = generator;
        this.width = width;
        this.height = height;

        //Fill the board
        var boardSize = width * height;
        for (let index = 0; index < boardSize; index++) {
            this.pieces[index] = generator.next();
        }
    }

    IndexToPosition(i : number) : Position {
        const pos : Position;
        pos.col = i % this.width;
        pos.row = i / this.width;
        return pos;
    }
    PositionToIndex(position : Position) : number {
        return position.col + position.row * this.width;
    }
      
    addListener(listener: BoardListener<T>) {
    }

    piece(p: Position): T | undefined {
        return this.pieces[this.PositionToIndex(p)];
    }

    canMove(first: Position, second: Position): boolean {

        //Check row
        

        //Check col

        return true;
    }
    
    move(first: Position, second: Position) {
    }
}
