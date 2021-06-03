import IGameParams from '../types/IGameParams';
import SliceWorker from '../workers/SliceWorker/index.worker';
import SliceWorkerProxy from '../workers/SliceWorker/SliceWorkerProxy';

export interface IColorizationResult {
    colors: Uint32Array;
    colorsIndexes: Record<number, Uint32Array>;
}

const colorizationWorker = new SliceWorkerProxy(new SliceWorker())

export async function newColorizeField(fieldBuffer: SharedArrayBuffer, params: IGameParams) {
    const colorsBuffer = new SharedArrayBuffer(fieldBuffer.byteLength * 4);
    return colorizationWorker.processSlice(fieldBuffer, params, colorsBuffer).then(result => {
        return ({
            colors: new Uint32Array(colorsBuffer),
            colorsIndexes: result.colorsIndexes,
        });
    })
}