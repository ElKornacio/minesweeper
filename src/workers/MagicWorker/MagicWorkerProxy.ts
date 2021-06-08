import { autobind } from 'core-decorators';
import IPowerOnData from '../../types/IPowerOnData';
import { IFieldSlice } from '../../utils/generateField';

export default class MagicWorkerProxy {

    private readonly worker: Worker;
    private _isInitialized: boolean = false;
    private _isPowerOn: boolean = false;

    readonly initPromise: Promise<void>;
    private readonly initPromiseResolve: () => void;

    readonly powerOnPromise: Promise<void>;
    private readonly powerOnPromiseResolve: () => void;

    private generateResolve: Record<string, () => void> = {};

    constructor(worker: Worker) {
        let resolve: () => void;

        this.initPromise = new Promise(_resolve => {
            resolve = _resolve;
        });
        this.initPromiseResolve = resolve!;

        this.powerOnPromise = new Promise(_resolve => {
            resolve = _resolve;
        });
        this.powerOnPromiseResolve = resolve!;

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
        if (type === 'power-on-complete') {
            this._isPowerOn = true;
            this.powerOnPromiseResolve();
        } else
        if (type === 'generate-complete') {
            this.generateResolve[id]();
            delete this.generateResolve[id];
        }
    }

    get isInitialized() {
        return this._isInitialized;
    }

    powerOn(data: IPowerOnData) {
        return new Promise<IFieldSlice>((resolve) => {
            this.worker.postMessage({ type: 'power-on', data });
        })
    }

    generate(size: number, mines: number): Promise<void> {
        return new Promise<void>((resolve) => {
            const id = String(Math.random() * 10000000);
            this.generateResolve[id] = resolve;
            this.worker.postMessage({ id, type: 'generate', data: { size, mines }});
        })
    }

}