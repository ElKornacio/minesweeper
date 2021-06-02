import { IGameParams } from ".";

function getRandomIndexes(length: number, amount: number): number[] {
    if (amount > length) {
        throw new Error('Cant generate more unique indexes than array length');
    }
    const randomIndexes: number[] = [];
    for (let i = 0; i < amount; i++) {
        let ri;
        while (randomIndexes.includes(ri = Math.floor(Math.random() * length))) {
        }
        randomIndexes.push(ri);
    }
    return randomIndexes;
}

export default function generateField(params: IGameParams) {
    const size = params.columns * params.rows;
    const mines = params.mines;
    const field = new Uint8Array(size);
    const probability = mines / (size);
    const minesIndexes = new Uint32Array(Math.min(size, mines * 5));
    const emptiesIndexes = new Uint32Array(Math.min(size, (size - mines) * 5));

    let minesLength = 0;
    let emptiesLength = 0;
    let minesCount = 0;
    for (let i = 0; i < field.length; i++) {
        if (Math.random() < probability) {
            field[i] = 9;
            minesIndexes[minesLength++] = i;
            minesCount++;
        } else {
            field[i] = 0;
            emptiesIndexes[emptiesLength++] = i;
        }
    }

    if (minesCount > mines) {
        const diff = minesCount - mines;
        const randomIndexes: number[] = getRandomIndexes(minesLength, diff);
        for (let randomIndex of randomIndexes) {
            field[minesIndexes[randomIndex]] = 0;
            minesCount--;
        }
    } else
        if (minesCount < mines) {
            const diff = mines - minesCount;
            const randomIndexes: number[] = getRandomIndexes(emptiesLength, diff);
            for (let randomIndex of randomIndexes) {
                field[emptiesIndexes[randomIndex]] = 9;
                minesCount++;
            }
        }

    const conv = (x: number, y: number) => x * params.columns + y;

    for (let x = 0; x < params.columns; x++) {
        for (let y = 0; y < params.rows; y++) {
            const i = conv(x, y);
            if (field[i] === 0) {
                let count = 0;
                if (y - 1 >= 0) {
                    count += (x - 1 >= 0) ? ((field[conv(x - 1, y - 1)] === 9) ? 1 : 0) : 0;
                    count += (field[conv(x, y - 1)] === 9) ? 1 : 0;
                    count += (x + 1 < params.columns) ? ((field[conv(x + 1, y - 1)] === 9) ? 1 : 0) : 0;
                }

                if (y + 1 < params.rows) {
                    count += (x - 1 >= 0) ? ((field[conv(x - 1, y + 1)] === 9) ? 1 : 0) : 0;
                    count += (field[conv(x, y + 1)] === 9) ? 1 : 0;
                    count += (x + 1 < params.columns) ? ((field[conv(x + 1, y + 1)] === 9) ? 1 : 0) : 0;
                }

                count += (x - 1 >= 0) ? ((field[conv(x - 1, y)] === 9) ? 1 : 0) : 0;
                count += (x + 1 < params.columns) ? ((field[conv(x + 1, y)] === 9) ? 1 : 0) : 0;

                field[i] = count;
            }
        }
    }

    // for (let i = 0; i < field.length; i++) {
    //     field[i] += 10;
    // }

    return field;
}