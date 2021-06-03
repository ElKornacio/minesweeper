import { IFieldSlice } from "../../utils/generateField";

import WasmKitInit from '../../wasm/plyoro-script';
//@ts-ignore
import wasmkitPath from '../../wasm/plyoro-script.wasm.bin';

declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

function mulberry32(a: number) {
    var t;
    return function () {
        t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0);
    }
}

let WasmKit: {
    HEAPU8: Uint8Array;
    createControllerBuffer: (bytes: number) => { ptr: number, size: number, free: () => void };
    generateFieldSlice: (fieldPtr: number, offset: number, size: number, mines: number, minesIndexesBufferPtr: number, emptiesIndexesBufferPtr: number, resultsBufferPtr: number) => void;
    calculateField: (columns: number, rows: number, mines: number, fieldPtr: number, fieldLength: number, minesIndexesPtr: number, minesLength: number) => void;
} = null as any;

const wasmKitAvailable = WasmKitInit({
    locateFile: (file: string) => wasmkitPath
})().then((_WasmKit: any) => {
    WasmKit = _WasmKit;
})

function generateFieldSlice(buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexesBuffer: SharedArrayBuffer, emptiesIndexesBuffer: SharedArrayBuffer): IFieldSlice {
    // const minesIndexes = new Uint32Array(minesIndexesBuffer);
    // const emptiesIndexes = new Uint32Array(emptiesIndexesBuffer);
    const vStart = Date.now();
    const fieldBufferPtr = WasmKit.createControllerBuffer(buffer.byteLength);
    // WasmKit.HEAPU8.set(new Uint8Array(buffer), fieldBufferPtr.ptr);

    const minesIndexesBufferPtr = WasmKit.createControllerBuffer(minesIndexesBuffer.byteLength);
    // const minesIndexesU8 = new Uint8Array(minesIndexesBuffer);
    // WasmKit.HEAPU8.set(minesIndexesU8, minesIndexesBuffer.ptr);
    const emptiesIndexesBufferPtr = WasmKit.createControllerBuffer(emptiesIndexesBuffer.byteLength);

    const resultsBufferPtr = WasmKit.createControllerBuffer(4 * 2);
    console.log('create end: ' + (Date.now() - vStart) + 'ms');

    const start = Date.now();
    WasmKit.generateFieldSlice(fieldBufferPtr.ptr, offset, size, mines, minesIndexesBufferPtr.ptr, emptiesIndexesBufferPtr.ptr, resultsBufferPtr.ptr);
    console.log('calc took: ' + (Date.now() - start) + 'ms');
    
    // set field
    new Uint8Array(buffer).set(WasmKit.HEAPU8.slice(fieldBufferPtr.ptr, fieldBufferPtr.ptr + buffer.byteLength));
    console.log('full end: ' + (Date.now() - vStart) + 'ms');

    // console.log('offset: ', offset);
    // let field = new Uint8Array(buffer);
    // const probability = Math.floor((mines / size) * 4294967296);
    // const minesIndexes = new Uint32Array(minesIndexesBuffer);
    // const emptiesIndexes = new Uint32Array(emptiesIndexesBuffer);

    // let minesLength = 0;
    // let emptiesLength = 0;

    // const rand = mulberry32(Math.floor(Math.random() * 4294967296));

    // var i = 0;
    // while (i < size) {
    //     if (rand() < probability) {
    //         field[offset + i] = 9;
    //         minesIndexes[minesLength++] = i + offset;
    //     } else {
    //         field[offset + i] = 0;
    //         emptiesIndexes[emptiesLength++] = i + offset;
    //     }
    //     i++;
    // }

    return {
        offset: offset,
        emptiesLength: 0,
        minesLength: 0,
        minesCount: 0//minesLength
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
            console.log('Worker got offset: ' + offset);
            const start = Date.now();
            const result = generate(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
            console.log('Worker done: ' + (Date.now() - start) + 'ms');
            self.postMessage({ id, type: 'generate', data: result });
        }
    };
    wasmKitAvailable.then(() => {
        self.postMessage({
            type: 'inited',
            data: 'Im initialized'
        });
    });
})();