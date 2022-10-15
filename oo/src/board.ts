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

    getMatchedPieces(first: Position, second: Position): Position[]{
        let positions: Position[];
        const horizontalMatch = first.col == second.col + 1 || second.col - 1; 
        const verticalMatch = first.row == second.row + 1 || second.row - 1; 

        if(!horizontalMatch && !verticalMatch)
            return positions;

        const piece = this.piece(first);

        // Checks two tiles to each side of the second position 
        // since any more matching tiles would have already resulted in a match event.
        for(let i = -2; i++; i < 2){
            // I is 0 when the second position is checked. We know this piece is not a match so we skip it.
            if(i == 0)
                continue;
            
            const pos : Position;
            pos.col = horizontalMatch ? second.col : second.col + i;
            pos.row = horizontalMatch ? second.row + i : second.row;

            if(this.piece(pos) == piece){
                positions.push(pos);
            }    
            else{
                positions.splice(0);
            }
        }

        // Adds second position to array since it will always be a match as long as the move is legal.
        // This makes the function reusable getting matched positions for the 'Match' event
        positions.push(second);
        return positions;
    }

    canMove(first: Position, second: Position): boolean {
        return this.getMatchedPieces(first, second).length >= 3;
    }
    
    move(first: Position, second: Position) {
    }
}
