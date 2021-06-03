import { autobind } from 'core-decorators';
import IGameParams from '../../types/IGameParams';

export interface ISliceProcessingResult {
    colorsIndexes: Record<string, Uint32Array>;
}

export default class SliceWorkerProxy {

    private readonly worker: Worker;
    private _isInitialized: boolean = false;

    readonly initPromise: Promise<void>;
    private readonly initPromiseResolve: () => void;

    private sliceResolve: Record<string, (value: ISliceProcessingResult) => void> = {};

    constructor(worker: Worker) {
        let resolve: () => void;
        this.initPromise = new Promise(_resolve => {
            resolve = _resolve;
        });
        this.initPromiseResolve = resolve!;
        this.worker = worker;
        this.worker.onmessage = this.handleMessage;
    }

    @autobind
    handleMessage(e: MessageEvent) {
        const { type, id, data } = e.data;
        if (type === 'inited') {
            this._isInitialized = true;
            this.initPromiseResolve();
        } else
        if (type === 'slice') {
            this.sliceResolve[id](data);
            delete this.sliceResolve[id];
        }
    }

    get isInitialized() {
        return this._isInitialized;
    }

    processSlice(fieldBuffer: SharedArrayBuffer, params: IGameParams, colorsBuffer: SharedArrayBuffer): Promise<ISliceProcessingResult> {
        return new Promise<ISliceProcessingResult>((resolve) => {
            const id = String(Math.random() * 10000000);
            this.sliceResolve[id] = resolve;
            this.worker.postMessage({ id, type: 'slice', data: { fieldBuffer, params, colorsBuffer }});
        })
    }

}