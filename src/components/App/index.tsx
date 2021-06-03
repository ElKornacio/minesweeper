import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import DigitsCounter from '../DigitsCounter';
import FaceButton from '../FaceButton';
import Field, { IGameParams } from '../Field';
import { newColorizeField } from '../Field/colorizeField';
import { newGenerateField } from '../Field/generateField';


import './style.scss';
function Header({ params, gameId, gameState, onNewGame, minesLeft }: { params: IGameParams, gameId: string, gameState: 'none' | 'win' | 'lose', onNewGame: (columns: number, rows: number, mines: number) => void, minesLeft: number }) {
    const [ time, setTime ] = useState(0);

    useEffect(() => {
        let timer: any = null;
        if (gameState === 'none') {
            timer = setTimeout(() => setTime(time + 1), 1000);
        }
        return () => (timer ? clearTimeout(timer) : void 0);
    }, [time, gameState]);

    useEffect(() => {
        if (gameState === 'none') {
            setTime(0);
        }
    }, [gameId, gameState])

    return (
        <div className="header">
            <div className="time"><DigitsCounter value={time} /></div>
            <div className="restart">
                <FaceButton
                    state={gameState === 'none' ? "unpressed" : (gameState === 'lose' ? 'lose' : 'win')}
                    onClick={() => {
                        const [ columnsS, rowsS, minesS ] = prompt('Введите параметры через запятую: Columns,Rows,Mines', `${params.columns},${params.rows},${params.mines}`)!.split(',');
                        onNewGame(Number(columnsS), Number(rowsS), Number(minesS));
                    }}
                />
            </div>
            <div className="mines-left"><DigitsCounter value={minesLeft} /></div>
        </div>
    )
}

function printField(params: IGameParams, field: Uint8Array) {
    return;
    for (let y = 0; y < params.rows; y++) {
        let s = '';
        for (let x = 0; x < params.columns; x++) {
            s += field[x * params.columns + y];
        }
        console.log(s);
    }
}

class PrebuiltArray extends Uint32Array {

    internalLength: number = 0;

    constructor(length: number) {
        super(length);
    }

    fastPush(e: number) {
        this[this.internalLength++] = e;
    }

}

const defParams = { columns: 10000, rows: 10000, mines: 10000000 };

export type ColorizationPromise = Promise<{ colors: Uint32Array, colorsIndexes: Record<number, Uint32Array> }>;

interface IGameQueueEntity {
    params: IGameParams,
    field: { buffer: SharedArrayBuffer, data: Uint8Array };
    colors: ColorizationPromise;
}

const paramsEqual = (a: IGameParams, b: IGameParams) => a.columns === b.columns && a.rows === b.rows && a.mines === b.mines;

class GameQueue {

    currentParams: IGameParams = defParams;
    queue: IGameQueueEntity[] = [];
    overlook: number = 1;

    start() {
        this.getGame().then(res => this.queue.push(res));
    }

    async getGame(): Promise<IGameQueueEntity> {
        const params = this.currentParams;
        const { buffer, field } = await newGenerateField(this.currentParams);
        return {
            params: this.currentParams,
            field: { buffer, data: field },
            colors: newColorizeField(buffer, this.currentParams).then((result) => {
                if (this.queue.length < this.overlook && paramsEqual(this.currentParams, params)) {
                    this.getGame().then(res => {
                        this.queue.push(res);
                    })
                }
                return result;
            })
        };
    }

    async newGame(params: IGameParams): Promise<IGameQueueEntity> {
        if (!paramsEqual(params, this.currentParams)) {
            this.queue = [];
            this.currentParams = params;
            return await this.getGame();
        } else {
            if (this.queue.length) {
                const c = this.queue.pop()!;
                this.getGame().then(res => {
                    this.queue.push(res);
                })
                return c;
            } else {
                return await this.getGame();
            }
        }
    }

}

const queue = new GameQueue();
queue.start();

//@ts-ignore
window.queue = queue;

// const defaultField = newGenerateField(defParams);

// sliceWorkerProxy.processSlice(defaultField, { columns: 10000, rows: 10000, mines: 10000 }).then(() => {
//     console.log('slice processed');
// });
// let colorizedField = colorize({ columns: 10000, rows: 10000, mines: 10000 }, defaultField);

function App() {
    const [ gameId, setGameId ] = useState('1');
    const [ flagsCount, setFlagsCount ] = useState(0);
    const [ gameState, setGameState ] = useState<'none' | 'lose' | 'win'>('none');
    const [ field, setField ] = useState<Uint8Array | null>(null);
    const [ colorizationPromise, setColorizationPromise ] = useState<ColorizationPromise | null>(null);
    const [ params, setParams ] = useState(defParams);

    const newGameCallback = useCallback(async (columns: number, rows: number, mines: number) => {
        const newParams = { columns, rows, mines };
        setParams(newParams);
        const newGame = await queue.newGame(params);
        setField(newGame.field.data);
        setColorizationPromise(newGame.colors);

        setGameState('none');
        // const colorizationResult = await newColorizeField(buffer, params);
    }, []);

    useEffect(() => {
        const handler = (e: any) => {
            if (e.key === ' ') {
                e.preventDefault();
                newGameCallback(params.columns, params.rows, params.mines);
            }
        }

        document.body.addEventListener('keydown', handler);
        return () => document.body.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className={classNames('app', gameState)} onClick={console.log}>
            <Header
                params={params}
                gameId={gameId}
                gameState={gameState}
                onNewGame={newGameCallback}
                minesLeft={params.mines - flagsCount}
            />
            {(field && colorizationPromise) ? (
                <Field
                    params={params}
                    onGameStateUpdate={setGameState}
                    onAddFlag={() => {
                        setFlagsCount(flagsCount + 1);
                    }}
                    onRemoveFlag={() => {
                        setFlagsCount(flagsCount - 1);
                    }}
                    field={field}
                    colorizationPromise={colorizationPromise}
                    onFieldUpdate={setField}
                />
            ) : (
                <div className="placeholder">
                    Press on a smiling face to start new game.
                </div>
            )}
        </div>
    )
}

export default App;