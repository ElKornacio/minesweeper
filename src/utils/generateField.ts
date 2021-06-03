import GenerationWorker from '../workers/GenerationWorker/index.worker';
import GenerationWorkerProxy from '../workers/GenerationWorker/GenerationWorkerProxy';

import IGameParams from '../types/IGameParams';

import { concat32Arrays } from '../utils/concatBinaryArrays';
import getRandomIndexes from '../utils/getRandomIndexes';
import touchAround from './touches';

import WasmKitInit from '../wasm/plyoro-script';
//@ts-ignore
import wasmkitPath from '../wasm/plyoro-script.wasm.bin';

const MAX_FIELD_SIZE = 10000 * 10000;
const MAX_GENERATION_WORKERS_COUNT = 10;
const SLICE_THRESHOLD = MAX_FIELD_SIZE / MAX_GENERATION_WORKERS_COUNT;

const generationWorkerProxies = [...new Array(MAX_GENERATION_WORKERS_COUNT)].map(e => 
    new GenerationWorkerProxy(new GenerationWorker())
);

let WasmKit: {
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    createControllerBuffer: (bytes: number) => { ptr: number, size: number, free: () => void };
    generateFieldSlice: (fieldPtr: number, offset: number, size: number, mines: number, minesIndexesBufferPtr: number, emptiesIndexesBufferPtr: number, resultsBufferPtr: number) => void;
    calculateField: (columns: number, rows: number, mines: number, fieldPtr: number, fieldLength: number, minesIndexesPtr: number, minesLength: number) => void;
} = null as any;

const workersAvailable = Promise.all(generationWorkerProxies.map(s => s.initPromise))
const wasmKitAvailable = WasmKitInit({
    locateFile: (file: string) => wasmkitPath
})().then((_WasmKit: any) => {
    WasmKit = _WasmKit;
})

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

export function processField(params: IGameParams, field: Uint8Array, slice: IFieldFullSlice) {
    let start = Date.now();
    const mines = params.mines;
    const size = params.columns * params.rows;

    const minesOverhead = Math.max(100, Math.floor(mines / 3));
    const minesIndexes = slice.minesIndexes;
    const emptiesOverhead = Math.max(100, Math.floor(mines / 3));
    const emptiesIndexes = slice.emptiesIndexes;

    let minesLength = minesIndexes.length - minesOverhead;
    let emptiesLength = emptiesIndexes.length - emptiesOverhead;
    let minesCount = slice.minesCount;
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

    console.log('Processing end: ', (Date.now() - start) + 'ms');
    start = Date.now();

    calculateField(params, field, minesIndexes, minesLength);

    console.log('Calculation end: ', (Date.now() - start) + 'ms');

    return { field, emptySubstitute };
}

// export async function requestFieldSlice(workerIndex: number, buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): Promise<IFieldSlice> {
//     return generationWorkerProxies[workerIndex].generateSlice(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
//     // return generateFieldSlice(offset, size, mines);
// }

export async function requestFieldSlice(workerIndex: number, buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): Promise<IFieldSlice> {
    return generationWorkerProxies[workerIndex].generateSlice(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
    // return generateFieldSlice(offset, size, mines);
}

// function turboFanPleaseOptimizeMe(i: number, params: IGameParams, field: Uint8Array) {
//     const x = Math.floor(i / params.columns);
//     const y = i % params.columns;

//     const cXm1 = x >= 1;
//     const cXp1 = x < params.columns - 1;
//     const cYm1 = y >= 1;
//     const cYp1 = y < params.rows - 1;

//     if (cYm1 && cXm1 && (9 !== field[(x - 1) * params.columns + y - 1])) {
//         field[(x - 1) * params.columns + y - 1]++;
//     }
//     if (cYm1 && (9 !== field[(x - 0) * params.columns + y - 1])) {
//         field[(x - 0) * params.columns + y - 1]++;
//     }
//     if (cYm1 && cXp1 && (9 !== field[(x + 1) * params.columns + y - 1])) {
//         field[(x + 1) * params.columns + y - 1]++;
//     }

//     if (cXm1 && (9 !== field[(x - 1) * params.columns + y - 0])) {
//         field[(x - 1) * params.columns + y - 0]++;
//     }
//     if (cXp1 && (9 !== field[(x + 1) * params.columns + y - 0])) {
//         field[(x + 1) * params.columns + y - 0]++;
//     }

//     if (cXm1 && cYp1 && (9 !== field[(x - 1) * params.columns + y + 1])) {
//         field[(x - 1) * params.columns + y + 1]++;
//     }
//     if (cYp1 && (9 !== field[(x - 0) * params.columns + y + 1])) {
//         field[(x - 0) * params.columns + y + 1]++;
//     }
//     if (cXp1 && cYp1 && (9 !== field[(x + 1) * params.columns + y + 1])) {
//         field[(x + 1) * params.columns + y + 1]++;
//     }
// }

function calculateField(params: IGameParams, field: Uint8Array, minesIndexes: Uint32Array, minesLength: number) {
    const conv = (x: number, y: number) => x * params.columns + y;

    console.log('minesLength: ', minesLength);

    const fieldBuffer = WasmKit.createControllerBuffer(field.length);
    WasmKit.HEAPU8.set(field, fieldBuffer.ptr);
    const minesIndexesBuffer = WasmKit.createControllerBuffer(minesIndexes.byteLength);
    const minesIndexesU8 = new Uint8Array(minesIndexes.buffer);
    WasmKit.HEAPU8.set(minesIndexesU8, minesIndexesBuffer.ptr);
    const start = Date.now();
    WasmKit.calculateField(params.columns, params.rows, params.mines, fieldBuffer.ptr, field.length, minesIndexesBuffer.ptr, minesLength);
    console.log('calc took: ' + (Date.now() - start) + 'ms');
    field.set(WasmKit.HEAPU8.slice(fieldBuffer.ptr, fieldBuffer.ptr + field.length));

    // console.log(WasmKit.HEAPU8[fieldBuffer.ptr]);

    // const touch = (x1: number, y1: number) => {
    //     const i = conv(x1, y1);
    //     if (field[i] !== 9) {
    //         field[i]++;
    //     }
    // }

    // for (let j = 0; j < minesLength; j++) {
    //     const i = minesIndexes[j];
    //     if (i === 999999999) {
    //         continue;
    //     }
    //     turboFanPleaseOptimizeMe(i, params, field);
    // }

    // for (let i = 0; i < field.length; i++) {
    //     field[i] += 10;
    // }
}

export async function newGenerateField(params: IGameParams) {
    await workersAvailable;
    await wasmKitAvailable;
    console.log('Workers and WasmKit available');
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

    // const buffer = new SharedArrayBuffer(size);

    let offset = 0;
    // const slicesParams = slicesSizes.map((v, idx) => {
    //     const mines = Math.floor(params.mines * (v / size));
    //     const minesIndexesSize = Math.min(v, mines * 5) * 32;
    //     const emptiesIndexesSize = Math.min(v, (size - mines) * 5) * 4;
    //     const r = {
    //         minesIndexes: new SharedArrayBuffer(minesIndexesSize),
    //         emptiesIndexes: new SharedArrayBuffer(emptiesIndexesSize),
    //         buffer: buffer,
    //         offset,
    //         size: v,
    //         mines: mines
    //     };
    //     offset += v;

    //     // return requestFieldSlice(idx, r.buffer, r.offset, r.size, r.mines, r.minesIndexes, r.emptiesIndexes).then(result => ({
    //     //     ...result,
    //     //     minesIndexes: new Uint32Array(r.minesIndexes).slice(0, result.minesLength),
    //     //     emptiesIndexes: new Uint32Array(r.emptiesIndexes).slice(0, result.emptiesLength),
    //     // }));
    // });

    // const field = new Uint8Array(buffer);

    const slicesStart = Date.now();
    console.log('Slices start');
    // const slices = await Promise.all(slicesParams);
    const v = size;
    const mines = params.mines;

    const minesIndexesSize = Math.min(v, mines * 5) * 32;
    const emptiesIndexesSize = Math.min(v, (size - mines) * 5) * 4;
    
    const fieldBufferPtr = WasmKit.createControllerBuffer(size);
    const minesIndexesBufferPtr = WasmKit.createControllerBuffer(minesIndexesSize);
    const emptiesIndexesBufferPtr = WasmKit.createControllerBuffer(emptiesIndexesSize);

    const resultsBufferPtr = WasmKit.createControllerBuffer(4 * 2);

    const vStart = Date.now();
    WasmKit.generateFieldSlice(fieldBufferPtr.ptr, 0, size, mines, minesIndexesBufferPtr.ptr, emptiesIndexesBufferPtr.ptr, resultsBufferPtr.ptr);
    console.log('calc took: ' + (Date.now() - vStart) + 'ms');

    const minesLength = WasmKit.HEAPU32[resultsBufferPtr.ptr / 4];
    const emptiesLength = WasmKit.HEAPU32[resultsBufferPtr.ptr / 4 + 1];
    console.log('minesLength: ', minesLength);
    console.log('emptiesLength: ', emptiesLength);

    const buffer = new SharedArrayBuffer(size);
    const field = new Uint8Array(buffer);
    field.set(WasmKit.HEAPU8.slice(fieldBufferPtr.ptr, fieldBufferPtr.ptr + size));
    const minesIndexes = WasmKit.HEAPU32.slice(minesIndexesBufferPtr.ptr / 4, minesIndexesBufferPtr.ptr / 4 + minesLength);
    const emptiesIndexes = WasmKit.HEAPU32.slice(emptiesIndexesBufferPtr.ptr / 4, emptiesIndexesBufferPtr.ptr / 4 + emptiesLength);

    const slice = {
        offset: 0,
        emptiesIndexes,
        minesIndexes,
        minesCount: minesLength
    };
    // set field
    //new Uint8Array(buffer).set(WasmKit.HEAPU8.slice(fieldBufferPtr.ptr, fieldBufferPtr.ptr + buffer.byteLength));

    console.log('Slices generation: ' + (Date.now() - slicesStart) + 'ms');

    // field.set(new Uint8Array(buffer), 0);
    // console.log('field: ', field);
    const { field: pField, emptySubstitute } = processField(params, field, slice);
    return { buffer, field: pField, emptySubstitute };
}