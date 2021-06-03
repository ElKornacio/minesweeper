import { autobind } from 'core-decorators';
import GameWorker from './index.worker';

export default class GameWorkerProxy {

    private readonly worker: Worker;
    private _isInitialized: boolean = false;

    readonly initPromise: Promise<void>;
    private readonly initPromiseResolve: () => void;

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
        const { type, data } = e.data;
        if (type === 'inited') {
            this._isInitialized = true;
            this.initPromiseResolve();
        }
    }

    get isInitialized() {
        return this._isInitialized;
    }

}