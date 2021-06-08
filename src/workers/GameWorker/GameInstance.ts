import FieldArray from "../../types/FieldArray";
import IGameParams from "../../types/IGameParams";
import IPowerOnData from "../../types/IPowerOnData";

import MagicWorker from "../MagicWorker/index.magic.worker";
import MagicWorkerProxy from "../MagicWorker/MagicWorkerProxy";

const MAX_FIELD_SIZE = 10000 * 10000;
const SLICES = 8;
const SLICE_SIZE = MAX_FIELD_SIZE / SLICES;

interface IWorkerParams {
    powerOn: IPowerOnData;

    proxy: MagicWorkerProxy;

    minesIndexes: Uint32Array;
    emptiesIndexes: Uint32Array;
    results: Uint32Array;
}

export default class GameInstance {

    fieldBuffer: SharedArrayBuffer;
    field: FieldArray;

    workersParams: IWorkerParams[] = [];
    workersPoweredOn: Promise<void>;

    constructor() {
        this.fieldBuffer = new SharedArrayBuffer(MAX_FIELD_SIZE);
        this.field = new Uint8Array(this.fieldBuffer);

        const workers = [...new Array(SLICES)].map(e => new MagicWorkerProxy(new MagicWorker()));

        for (let i = 0; i < SLICES; i++) {
            const minesIndexesBuffer = new SharedArrayBuffer(SLICE_SIZE * 4);
            const emptiesIndexesBuffer = new SharedArrayBuffer(SLICE_SIZE * 4);
            const resultsBuffer = new SharedArrayBuffer(2 * 4);

            const results = new Uint32Array(minesIndexesBuffer);
            const minesIndexes = new Uint32Array(emptiesIndexesBuffer);
            const emptiesIndexes = new Uint32Array(resultsBuffer);

            this.workersParams.push({
                proxy: workers[i],

                powerOn: {
                    offset: i * SLICE_SIZE,
                    fieldBuffer: this.fieldBuffer,
                    minesIndexesBuffer,
                    emptiesIndexesBuffer,
                    resultsBuffer,
                    sliceSize: SLICE_SIZE,
                },

                minesIndexes,
                emptiesIndexes,
                results
            });
        }

        this.workersPoweredOn = Promise.all(workers.map(w => w.powerOnPromise)).then(() => {
            console.log('Workers powered on');
        });

        workers.forEach((s, idx) => s.initPromise.then(() => {
            s.powerOn(this.workersParams[idx].powerOn);
        }));
    }

    async newGame(params: IGameParams) {
        await this.workersPoweredOn;
        const size = params.columns * params.rows;

        const promises: Promise<void>[] = [];

        let sizeLeft = size;
        for (let i = 0; i < this.workersParams.length; i++) {
            const workerSize = Math.min(SLICE_SIZE, sizeLeft);
            sizeLeft -= SLICE_SIZE;
            if (!workerSize) {
                break;
            }

            promises.push(
                this.workersParams[i].proxy.generate(workerSize, Math.floor(params.mines * (workerSize / size)))
            );
        }

        await Promise.all(promises);

        console.log('new game: ', params);

        return {};
    }

}