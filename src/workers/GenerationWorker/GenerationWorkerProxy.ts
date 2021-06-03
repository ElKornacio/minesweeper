import { autobind } from 'core-decorators';
import { IGameParams } from '../../components/Field';
import { IFieldSlice } from '../../components/Field/generateField';

export default class GenerationWorkerProxy {

    private readonly worker: Worker;
    private _isInitialized: boolean = false;

    readonly initPromise: Promise<void>;
    private readonly initPromiseResolve: () => void;

    private generateResolve: Record<string, (value: IFieldSlice) => void> = {};

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
        if (type === 'generate') {
            this.generateResolve[id](data);
            delete this.generateResolve[id];
        }
    }

    get isInitialized() {
        return this._isInitialized;
    }

    generateSlice(buffer: SharedArrayBuffer, offset: number, size: number, mines: number, minesIndexes: SharedArrayBuffer, emptiesIndexes: SharedArrayBuffer): Promise<IFieldSlice> {
        return new Promise<IFieldSlice>((resolve) => {
            const id = String(Math.random() * 10000000);
            this.generateResolve[id] = resolve;
            this.worker.postMessage({ id, type: 'generate', data: { buffer, offset, size, mines, minesIndexes, emptiesIndexes }});
        })
    }

}