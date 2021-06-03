import GenerationWorker from '../workers/GenerationWorker/index.worker';
import GenerationWorkerProxy from '../workers/GenerationWorker/GenerationWorkerProxy';

import IGameParams from '../types/IGameParams';

import { concat32Arrays } from '../utils/concatBinaryArrays';
import getRandomIndexes from '../utils/getRandomIndexes';

const MAX_FIELD_SIZE = 10000 * 10000;
const MAX_GENERATION_WORKERS_COUNT = 10;
const SLICE_THRESHOLD = MAX_FIELD_SIZE / MAX_GENERATION_WORKERS_COUNT;

const generationWorkerProxies = [...new Array(MAX_GENERATION_WORKERS_COUNT)].map(e => 
    new GenerationWorkerProxy(new GenerationWorker())
);

const workersAvailable = Promise.all(generationWorkerProxies.map(s => s.initPromise))

export interface IFieldSlice {
    offset: number;
    emptiesLength: number;
    minesLength: number;
    minesCount: number;
}

export interface IFieldFullSlice {
    offset: number;
    emptiesIndexes: Uint32Array;
    minesIndexes: Uint32Array;
    minesCount: number;
}

export function processField(params: IGameParams, field: Uint8Array, slices: IFieldFullSlice[]) {
    const mines = params.mines;
    const size = params.columns * params.rows;

    const minesOverhead = Math.max(100, Math.floor(mines / 3));
    const minesIndexes = concat32Arrays(slices.map(v => v.minesIndexes), minesOverhead);
    const emptiesOverhead = Math.max(100, Math.floor(mines / 3));
    const emptiesIndexes = concat32Arrays(slices.map(v => v.emptiesIndexes), emptiesOverhead);

    let minesLength = minesIndexes.length - minesOverhead;
    let emptiesLength = emptiesIndexes.length - emptiesOverhead;
    let minesCount = slices.map(v => v.minesCount).reduce((p, c) => p + c, 0);
    let emptiesCount = size - minesCount;

    if (minesCount > mines) {
        const diff = minesCount - mines;
        const randomIndexes: number[] = getRandomIndexes(minesLength, diff);
        for (let randomIndex of randomIndexes) {
            field[minesIndexes[randomIndex]] = 0;
            emptiesIndexes[emptiesLength++] = minesIndexes[randomIndex];
            minesIndexes[randomIndex] = 999999999;
            minesCount--;
            emptiesCount++;
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
            emptiesCount--;
        }
    }

    let emptySubstitute = null;
    if (emptiesCount !== 0) {
        let i;
        while ((i = emptiesIndexes[Math.floor(Math.random() * emptiesLength)]) === 999999999) {

        }
        emptySubstitute = i;
    }

    calculateField(params, field, minesIndexes, minesLength);

    return { field, emptySubstitute };
}

export async function requestFieldSlice(workerIndex: number, buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): Promise<IFieldSlice> {
    return generationWorkerProxies[workerIndex].generateSlice(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
    // return generateFieldSlice(offset, size, mines);
}

function calculateField(params: IGameParams, field: Uint8Array, minesIndexes: Uint32Array, minesLength: number) {
    const conv = (x: number, y: number) => x * params.columns + y;

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

    // for (let i = 0; i < field.length; i++) {
    //     field[i] += 10;
    // }
}

export async function newGenerateField(params: IGameParams) {
    await workersAvailable;
    console.log('Workers available');
    const start = Date.now();
    const size = params.columns * params.rows;

    let sliceCount = Math.floor(size / SLICE_THRESHOLD);
    const slicesSizes: number[] = [];
    for (let i = 0; i < sliceCount; i++) {
        slicesSizes.push(SLICE_THRESHOLD);
    }
    const lastSliceSize = size % SLICE_THRESHOLD;
    if (lastSliceSize > 0) {
        sliceCount += 1;
        slicesSizes.push(lastSliceSize);
    }

    const buffer = new SharedArrayBuffer(size);

    let offset = 0;
    const slicesParams = slicesSizes.map((v, idx) => {
        const mines = Math.floor(params.mines * (v / size));
        const minesIndexesSize = Math.min(v, mines * 5) * 32;
        const emptiesIndexesSize = Math.min(v, (size - mines) * 5) * 4;
        const r = {
            minesIndexes: new SharedArrayBuffer(minesIndexesSize),
            emptiesIndexes: new SharedArrayBuffer(emptiesIndexesSize),
            buffer: buffer,
            offset,
            size: v,
            mines: mines
        };
        offset += v;
        return requestFieldSlice(idx, r.buffer, r.offset, r.size, r.mines, r.minesIndexes, r.emptiesIndexes).then(result => ({
            ...result,
            minesIndexes: new Uint32Array(r.minesIndexes).slice(0, result.minesLength),
            emptiesIndexes: new Uint32Array(r.emptiesIndexes).slice(0, result.emptiesLength),
        }));
    });

    const field = new Uint8Array(buffer);

    const slicesStart = Date.now();
    console.log('Slices start');
    const slices = await Promise.all(slicesParams);
    console.log('Slices generation: ' + (Date.now() - slicesStart) + 'ms');

    // field.set(new Uint8Array(buffer), 0);
    // console.log('field: ', field);
    const { field: pField, emptySubstitute } = processField(params, field, slices);
    return { buffer, field: pField, emptySubstitute };
}