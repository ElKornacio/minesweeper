import { autobind } from 'core-decorators';
import IGameParams from '../../types/IGameParams';

export default class GameWorkerProxy {

    private readonly worker: Worker;
    private _isInitialized: boolean = false;
    private _isPowerOn: boolean = false;

    readonly initPromise: Promise<SharedArrayBuffer>;
    private readonly initPromiseResolve: (fieldBuffer: SharedArrayBuffer) => void;
    private newGamePromiseResolve: () => void = null as any;

    constructor(worker: Worker) {
        let resolve: (fieldBuffer: SharedArrayBuffer) => void;

        this.initPromise = new Promise<SharedArrayBuffer>(_resolve => {
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
            this.initPromiseResolve(data.buffer);
        } else
        if (type === 'new-game-complete') {
            this.newGamePromiseResolve();
        }
    }

    get isInitialized() {
        return this._isInitialized;
    }

    newGame(params: IGameParams) {
        return new Promise<void>((resolve) => {
            this.newGamePromiseResolve = resolve;
            this.worker.postMessage({ type: 'new-game', data: params });
        })
    }

}