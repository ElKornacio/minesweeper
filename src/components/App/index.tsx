import React, { useCallback, useEffect, useState } from 'react';
import DigitsCounter from '../DigitsCounter';
import FaceButton from '../FaceButton';
import Field, { IGameParams } from '../Field';
import generateField from '../Field/generateField';

import './style.scss';

const defaultField = generateField({ columns: 20, rows: 20, mines: 70 });

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

function App() {
    const [ gameId, setGameId ] = useState('1');
    const [ flagsCount, setFlagsCount ] = useState(0);
    const [ gameState, setGameState ] = useState<'none' | 'lose' | 'win'>('none');
    const [ field, setField ] = useState(defaultField);
    const [ columns, setColumns ] = useState('20');
    const [ rows, setRows ] = useState('20');
    const [ mines, setMines ] = useState('70');

    const newGameCallback = useCallback((columns: number, rows: number, mines: number) => {
        setColumns(String(columns));
        setRows(String(rows));
        setMines(String(mines));
        setField(generateField({ columns: columns, rows: rows, mines: mines }));
        setGameState('none');
    }, []);

    return (
        <div className="app" onClick={console.log}>
            <Header
                params={{ columns: Number(columns), rows: Number(rows), mines: Number(mines) }}
                gameId={gameId}
                gameState={gameState}
                onNewGame={newGameCallback}
                minesLeft={Number(mines) - flagsCount}
            />
            <Field
                params={{ columns: Number(columns), rows: Number(rows), mines: Number(mines) }}
                onGameStateUpdate={setGameState}
                onAddFlag={() => {
                    setFlagsCount(flagsCount + 1);
                }}
                onRemoveFlag={() => {
                    setFlagsCount(flagsCount - 1);
                }}
                field={field}
                onFieldUpdate={setField}
            />
        </div>
    )
}

export default App;