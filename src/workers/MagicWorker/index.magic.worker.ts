import FieldArray from "../../types/FieldArray";
import IPowerOnData from "../../types/IPowerOnData";
import { IFieldSlice } from "../../utils/generateField";

import WasmKitInit from '../../wasm/plyoro-script';
//@ts-ignore
import wasmkitPath from '../../wasm/plyoro-script.wasm.bin';

let WasmKit: {
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    createControllerBuffer: (bytes: number) => { ptr: number, size: number, free: () => void };
    generateFieldSlice: (fieldPtr: number, offset: number, size: number, mines: number, minesIndexesBufferPtr: number, emptiesIndexesBufferPtr: number, resultsBufferPtr: number) => void;
    calculateField: (columns: number, rows: number, mines: number, fieldPtr: number, fieldLength: number, minesIndexesPtr: number, minesLength: number) => void;
    initRandom: (sliceSize: number) => void;
} = null as any;

const wasmKitAvailable = WasmKitInit({
    locateFile: (file: string) => wasmkitPath
})().then((_WasmKit: any) => {
    WasmKit = _WasmKit;
})

declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0);
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

interface IControlledBuffer {
    ptr: number;
    size: number;
    free: () => void;
}

function generate(buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): IFieldSlice {
    return generateFieldSlice(buffer, offset, size, mines, minesIndexes, emptiesIndexes);
}

class MagicInstance implements IPowerOnData {

    offset: number;
    sliceSize: number;
    fieldBuffer: SharedArrayBuffer;

    minesIndexesBuffer: SharedArrayBuffer;
    emptiesIndexesBuffer: SharedArrayBuffer;
    resultsBuffer: SharedArrayBuffer;

    field: FieldArray;
    results: Uint32Array;

    minesIndexes: Uint32Array;
    emptiesIndexes: Uint32Array;
    randomStream: Uint32Array;

    lastSize: number = 0;

    fieldBufferPtr: IControlledBuffer;
    minesIndexesBufferPtr: IControlledBuffer;
    emptiesIndexesBufferPtr: IControlledBuffer;

    resultsBufferPtr: IControlledBuffer;

    constructor(data: IPowerOnData) {
        this.offset = data.offset;
        this.sliceSize = data.sliceSize;
        this.fieldBuffer = data.fieldBuffer;

        this.randomStream = new Uint32Array(this.sliceSize);

        this.minesIndexesBuffer = data.minesIndexesBuffer;
        this.emptiesIndexesBuffer = data.emptiesIndexesBuffer;
        this.resultsBuffer = data.resultsBuffer;

        this.field = new Uint8Array(this.fieldBuffer);
        this.results = new Uint32Array(this.resultsBuffer); // 0 - minesLength, 1 - emptiesLength

        this.minesIndexes = new Uint32Array(this.minesIndexesBuffer);
        this.emptiesIndexes = new Uint32Array(this.emptiesIndexesBuffer);

        this.fieldBufferPtr = WasmKit.createControllerBuffer(data.sliceSize);
        this.minesIndexesBufferPtr = WasmKit.createControllerBuffer(data.minesIndexesBuffer.byteLength);
        this.emptiesIndexesBufferPtr = WasmKit.createControllerBuffer(data.emptiesIndexesBuffer.byteLength);

        this.resultsBufferPtr = WasmKit.createControllerBuffer(4 * 2);
        // WasmKit.initRandom(data.sliceSize);
        const rand = mulberry32(Math.random() * 4294967296);
        for (let i = 0; i < data.sliceSize; i++) {
            this.randomStream[i] = rand();
        }
    }

    generate(size: number, mines: number) {
        this.lastSize = size;

        const v = size;        

        //const vStart = Date.now();
        //WasmKit.generateFieldSlice(this.fieldBufferPtr.ptr, 0, size, mines, this.minesIndexesBufferPtr.ptr, this.emptiesIndexesBufferPtr.ptr, this.resultsBufferPtr.ptr);
        //this.field.set(WasmKit.HEAPU8.slice(fieldBufferPtr.ptr, fieldBufferPtr.ptr + size), this.offset);
        //console.log('calc took: ' + (Date.now() - vStart) + 'ms ' + size + ' ' + mines);

        const probability = Math.floor(mines / size * 4294967296);
        
        for (let i = 0; i < size; i++) {
            if (this.randomStream[i] < probability) {
                this.field[this.offset + i] = 9;
                this.minesIndexes[this.results[0]++] = i + this.offset;
            } else {
                this.field[this.offset + i] = 0;
                this.emptiesIndexes[this.results[1]++] = i + this.offset;
            }
        }
    }

}

(() => {
    let instance: MagicInstance;
    self.onmessage = (ev) => {
        const { type, id, data } = ev.data;
        if (type === 'power-on') {
            instance = new MagicInstance(data);
            self.postMessage({ id, type: 'power-on-complete' });
        } else
        if (type === 'generate') {
            const { size, mines } = data as { size: number, mines: number };
            // console.log('got generate: ', size, mines);
            const result = instance!.generate(size, mines);
            self.postMessage({ id, type: 'generate-complete', data: result });
        }
    };
    wasmKitAvailable.then(() => {
        self.postMessage({
            type: 'inited',
            data: 'Im initialized'
        });
    });
})();