import IGameParams from "../src/types/IGameParams";

export default function generateField(params: IGameParams) {
    const start = Date.now();
    const size = params.columns * params.rows;

    const mines = params.mines;
    let field = new Uint8Array(size);
    const probability = mines / (size);
    const minesIndexes = new Uint32Array(Math.min(size, mines * 5));
    const emptiesIndexes = new Uint32Array(Math.min(size, (size - mines) * 5));

    let minesLength = 0;
    let emptiesLength = 0;
    let minesCount = 0;
    // const randomStream: number[] = [...Array(field.length)].map((e, i) => Number(Math.random() < probability));
    // const randomStream = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1];
    // console.log('randomStream: ', randomStream);
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

    console.log('gen time: ' + (Date.now() - start) + 'ms');

    // console.log('before remine: ', JSON.stringify({ field: Array.from(field), minesLength, emptiesLength, minesCount, minesIndexes, emptiesIndexes }));
    // printField(params, field);

    if (minesCount > mines) {
        const diff = minesCount - mines;
        const randomIndexes: number[] = getRandomIndexes(minesLength, diff);
        for (let randomIndex of randomIndexes) {
            field[minesIndexes[randomIndex]] = 0;
            emptiesIndexes[emptiesLength++] = minesIndexes[randomIndex];
            minesIndexes[randomIndex] = 999999999;
            minesCount--;
        }
    } else
        if (minesCount < mines) {
            const diff = mines - minesCount;
            const randomIndexes: number[] = getRandomIndexes(emptiesLength, diff);
            for (let randomIndex of randomIndexes) {
                field[emptiesIndexes[randomIndex]] = 9;
                minesIndexes[minesLength++] = emptiesIndexes[randomIndex];
                emptiesIndexes[randomIndex] = 999999999;
                minesCount++;
            }
        }

    console.log('resize time: ' + (Date.now() - start) + 'ms');

    const conv = (x: number, y: number) => x * params.columns + y;

    console.log('before')
    // printField(params, field);

    // const p = () => printField(params, field);

    // debugger;

    for (let j = 0; j < minesLength; j++) {
        const i = minesIndexes[j];
        if (i === 999999999) {
            continue;
        }
        const x = Math.floor(i / params.columns);
        const y = i % params.columns;

        const cXm1 = x >= 1;
        const cXp1 = x < params.columns - 1;
        const cYm1 = y >= 1;
        const cYp1 = y < params.rows - 1;

        if (cYm1 && cXm1 && (9 !== field[conv(x - 1, y - 1)])) {
            field[conv(x - 1, y - 1)]++;
        }
        if (cYm1 && (9 !== field[conv(x - 0, y - 1)])) {
            field[conv(x - 0, y - 1)]++;
        }
        if (cYm1 && cXp1 && (9 !== field[conv(x + 1, y - 1)])) {
            field[conv(x + 1, y - 1)]++;
        }

        if (cXm1 && (9 !== field[conv(x - 1, y - 0)])) {
            field[conv(x - 1, y - 0)]++;
        }
        if (cXp1 && (9 !== field[conv(x + 1, y - 0)])) {
            field[conv(x + 1, y - 0)]++;
        }

        if (cXm1 && cYp1 && (9 !== field[conv(x - 1, y + 1)])) {
            field[conv(x - 1, y + 1)]++;
        }
        if (cYp1 && (9 !== field[conv(x - 0, y + 1)])) {
            field[conv(x - 0, y + 1)]++;
        }
        if (cXp1 && cYp1 && (9 !== field[conv(x + 1, y + 1)])) {
            field[conv(x + 1, y + 1)]++;
        }
    }

    // console.log('after')
    // printField(params, field);

    // for (let x = 0; x < params.columns; x++) {
    //     for (let y = 0; y < params.rows; y++) {
    //         const i = conv(x, y);
    //         if (field[i] === 0) {
    //             let count = 0;
    //             if (y - 1 >= 0) {
    //                 count += (x - 1 >= 0) ? ((field[conv(x - 1, y - 1)] === 9) ? 1 : 0) : 0;
    //                 count += (field[conv(x, y - 1)] === 9) ? 1 : 0;
    //                 count += (x + 1 < params.columns) ? ((field[conv(x + 1, y - 1)] === 9) ? 1 : 0) : 0;
    //             }

    //             if (y + 1 < params.rows) {
    //                 count += (x - 1 >= 0) ? ((field[conv(x - 1, y + 1)] === 9) ? 1 : 0) : 0;
    //                 count += (field[conv(x, y + 1)] === 9) ? 1 : 0;
    //                 count += (x + 1 < params.columns) ? ((field[conv(x + 1, y + 1)] === 9) ? 1 : 0) : 0;
    //             }

    //             count += (x - 1 >= 0) ? ((field[conv(x - 1, y)] === 9) ? 1 : 0) : 0;
    //             count += (x + 1 < params.columns) ? ((field[conv(x + 1, y)] === 9) ? 1 : 0) : 0;

    //             field[i] = count;
    //         }
    //     }
    // }

    for (let i = 0; i < field.length; i++) {
        field[i] += 10;
    }

    console.log('generation time: ' + (Date.now() - start) + 'ms');

    return field;
}