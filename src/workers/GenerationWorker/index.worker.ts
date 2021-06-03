import { IGameParams } from "../../components/Field";
import type { IFieldSlice } from "../../components/Field/generateField";

declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function printField(params: IGameParams, field: Uint8Array) {
    for (let y = 0; y < params.rows; y++) {
        let s = '';
        for (let x = 0; x < params.columns; x++) {
            s += field[x * params.columns + y] + ' ';
        }
        console.log(s);
    }
}

function generateFieldSlice(buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexesBuffer: SharedArrayBuffer, emptiesIndexesBuffer: SharedArrayBuffer): IFieldSlice {
    let field = new Uint8Array(buffer);
    const probability = mines / size;
    const minesIndexes = new Uint32Array(minesIndexesBuffer);
    const emptiesIndexes = new Uint32Array(emptiesIndexesBuffer);

    let minesLength = 0;
    let emptiesLength = 0;
    let minesCount = 0;

    const rand = mulberry32(Math.random() * 4294967296);

    for (let i = 0; i < size; i++) {
        if (rand() < probability) {
            field[offset + i] = 9;
            minesIndexes[minesLength++] = i + offset;
            minesCount++;
        } else {
            field[offset + i] = 0;
            emptiesIndexes[emptiesLength++] = i + offset;
        }
    }

    return {
        offset: offset,
        emptiesLength,
        minesLength,
        minesCount
    }
}

function generate(buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): IFieldSlice {
    return generateFieldSlice(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
}

(() => {
    self.onmessage = (ev) => {
        const { type, id, data } = ev.data;
        if (type === 'generate') {
            const { buffer, offset, size, mines, minesIndexes, emptiesIndexes } = data as { buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer };
            // console.log('Worker got offset: ' + offset);
            const start = Date.now();
            const result = generate(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
            // console.log('Worker done: ' + (Date.now() - start) + 'ms');
            self.postMessage({ id, type: 'generate', data: result });
        }
    };
    self.postMessage({
        type: 'inited',
        data: 'Im initialized'
    });
})();