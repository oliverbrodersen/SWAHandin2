export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = {
    kind : string,
    match? : Match<T>
};

export type BoardListener<T> = (event : BoardEvent<T>) => {

};

export class Board<T> {

    width : number;
    height : number;
    generator : Generator<T>;

    pieces : T[];

    listener : BoardListener<T>;
    
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
        let pos : Position = {
            col: i % this.width,
            row: Math.floor(i / this.width)
        };
        return pos;
    }
    PositionToIndex(position : Position) : number {
        return position.col + (position.row * this.width);
    }
    CoordsToIndex(col : number, row : number) : number {
        return col + (row * this.width);
    }
      
    addListener(listener: BoardListener<T>) {
        this.listener = listener;
    }

    piece(p: Position): T | undefined {
        if(p.col < 0 || p.col >= this.width || p.row < 0 || p.row >= this.height)
            return undefined;

        return this.pieces[this.PositionToIndex(p)];
    }

    swap(first: Position, second: Position) {
        var p1 = this.pieces[this.PositionToIndex(first)];
        var p2 = this.pieces[this.PositionToIndex(second)];
        this.pieces[this.PositionToIndex(first)] = p2;
        this.pieces[this.PositionToIndex(second)] = p1;
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
            var last = this.pieces[this.CoordsToIndex(0,Y)];
            var count = 0;
            for (let X = 1; X < this.width; X++) {
                const element = this.pieces[this.CoordsToIndex(X,Y)];
                if (element === last) {
                    count++;
                    if (count >= 2)
                    {
                        this.swap(first, second);
                        return true;
                    }
                } else {
                    count = 0;
                }
                last = element;
            }
        }

        // Foreach col
        for (let X = 0; X < this.width; X++) {
            var last = this.pieces[this.CoordsToIndex(X,0)];
            var count = 0;
            for (let Y = 1; Y < this.height; Y++) {
                const element = this.pieces[this.CoordsToIndex(X,Y)];
                if (element === last) {
                    count++;
                    if (count >= 2)
                    {
                        this.swap(first, second);
                        return true;
                    }
                } else {
                    count = 0;
                }
                last = element;
            }
        }

        this.swap(first, second);
        return false;
    }

    gravity(){
        for (let col = 0; col < this.width; col++) {
            for (let row = this.height - 1; row >= 0; row--) {
                let lookUp = 0;
                while(this.pieces[this.CoordsToIndex(col,row)] == undefined && row - lookUp > 0)
                {
                    lookUp++;
                    this.pieces[this.CoordsToIndex(col,row)] = this.pieces[this.CoordsToIndex(col,row - lookUp)]
                    this.pieces[this.CoordsToIndex(col,row - lookUp)] = undefined;
                }
            }
        }
    }
    
    evolveBoard()
    {
        let events : BoardEvent<T>[] = [];

        // Foreach row
        for (let Y = 0; Y < this.height; Y++) {
            var last = this.pieces[this.CoordsToIndex(0,Y)];
            var count = 0;

            let match : Match<T> = {
                matched: last,
                positions: []
            };

            for (let X = 1; X < this.width; X++) {
                const index = this.CoordsToIndex(X,Y);
                const element = this.pieces[index];
                if (element === last) {
                    count++;
                } else {
                    count = 0;
                }

                if (count == 1)
                {
                    match.positions.push(this.IndexToPosition(index - 1));
                    match.positions.push(this.IndexToPosition(index));
                }
                else if(count > 1) {
                    match.positions.push(this.IndexToPosition(index));
                }

                if (count == 0 || X == this.width-1)
                {
                    //Fire event
                    if (match.positions.length >= 3)
                    {
                        match.matched = last;
                        let event : BoardEvent<T> = { 
                            kind: "Match",
                            match: match
                        };                                                

                        if(this.listener != undefined)
                        {
                            this.listener(event);
                        }

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
        for (let X = this.width - 1; X >= 0; X--) {
            var last = this.pieces[this.CoordsToIndex(X,0)];
            var count = 0;

            let match : Match<T> = {
                matched: last,
                positions: []
            };

            for (let Y = 1; Y < this.height; Y++) {
                const index = this.CoordsToIndex(X,Y);
                const element = this.pieces[index];
                if (element === last) {
                    count++;
                } else {
                    count = 0;
                }

                if (count == 1)
                {
                    match.positions.push(this.IndexToPosition(index - this.width));
                    match.positions.push(this.IndexToPosition(index));
                }
                else if(count > 1) {
                    match.positions.push(this.IndexToPosition(index));
                }
                
                if (count == 0 || Y == this.height-1)
                {
                    //Fire event
                    if (match.positions.length >= 3)
                    {
                        match.matched = last;
                        let event : BoardEvent<T> = { 
                            kind: "Match",
                            match: match
                        };
                
                        if(this.listener != undefined)
                        {
                            this.listener(event);
                        }

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

        if (events.length == 0){
            console.log("no events");
            return;
        }

        this.printBoard();

        events.forEach(element => {
            element.match.positions.forEach(position => {
                this.pieces[this.PositionToIndex(position)] = undefined;
            });
        });

        let event : BoardEvent<T> = { 
            kind: "Refill"
        };

        if(this.listener != undefined)
            this.listener(event);

        this.printBoard();
        this.gravity();
        this.printBoard();
        
        while(this.pieces.includes(undefined)){
            this.gravity();
            for (let index = 0; index < this.width; index++) {
                const element = this.pieces[index];
                if(element == undefined){
                    this.pieces[index] = this.generator.next();
                }
            }
        }


        this.evolveBoard();
    }

    printBoard(){
        let b = "";
        for (let index = 0; index < this.pieces.length; index++) {
            const element = this.pieces[index];
            
            if(element == undefined){
                b += " ? ";
            }
            else{
                b += " " + element + " ";
            }
        
            if((index + 1) % this.width == 0 && index != 0){
                b += "\n"
            }
        }
        console.log(b);
    }

    move(first: Position, second: Position) {
        console.log("[ " + first.col + "," + first.row + "][" + second.col + "," + second.row + "]")
        if (!this.canMove(first, second))
            return;
        
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
        
        this.evolveBoard();
    }
}
