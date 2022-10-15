export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = {};

export type BoardListener<T> = {};

export class Board<T> {

    width : number;
    height : number;
    generator : Generator<T>;

    pieces : T[];

    constructor(generator: Generator<T>, width : number, height : number) {
        this.generator = generator;
        this.width = width;
        this.height = height;
        this.pieces =  [];

        //Fill the board
        var boardSize = width * height;
        for (let index = 0; index < boardSize; index++) {
            this.pieces[index] = generator.next();
        }
    }

    IndexToPosition(i : number) : Position {
        let pos : Position;
        pos.col = i % this.width;
        pos.row = i / this.width;
        return pos;
    }
    PositionToIndex(position : Position) : number {
        return position.col + (position.row * this.width);
    }
    CoordsToIndex(col : number, row : number) : number {
        return col + (row * this.width);
    }
      
    addListener(listener: BoardListener<T>) {
    }

    piece(p: Position): T | undefined {
        if(p.col < 0 || p.col >= this.width || p.row < 0 || p.row >= this.height)
            return undefined;

        return this.pieces[this.PositionToIndex(p)];
    }

    swap(first: Position, second: Position) {
        var p1 = this.piece[this.PositionToIndex(first)];
        this.piece[this.PositionToIndex(first)] = this.piece[this.PositionToIndex(second)];
        this.piece[this.PositionToIndex(second)] = p1;
    }

    canMove(first: Position, second: Position): boolean {
        
        if (first.col == second.col && first.row == second.row)
            return false;

        var p1 = this.piece(first);
        var p2 = this.piece(second);

        if (p1 == undefined || p2 == undefined)
            return false;

        var deltaX = first.col - second.col;
        var deltaY = first.row - second.row;
        if (deltaX != 0 && deltaY != 0)
            return false;
        
        this.swap(first, second);

        // Foreach row
        for (let Y = 0; Y < this.height; Y++) {
            var last = this.piece[this.CoordsToIndex(0,Y)];
            var count = 0;
            for (let X = 1; X < this.width; X++) {
                const element = this.piece[this.CoordsToIndex(X,Y)];
                if (element == last) {
                    count++;
                } else {
                    count = 0;
                }
                last = element;
            }
            if (count >= 3)
            {
                this.swap(first, second);
                return true;
            }
        }

        // Foreach col
        for (let X = 0; X < this.width; X++) {
            var last = this.piece[this.CoordsToIndex(X,0)];
            var count = 0;
            for (let Y = 1; Y < this.height; Y++) {
                const element = this.piece[this.CoordsToIndex(X,Y)];
                if (element == last) {
                    count++;
                } else {
                    count = 0;
                }
                last = element;
            }
            if (count >= 3)
            {
                this.swap(first, second);
                return true;
            }
        }

        this.swap(first, second);
        return false;
    }
    
    move(first: Position, second: Position) {
    }
}
