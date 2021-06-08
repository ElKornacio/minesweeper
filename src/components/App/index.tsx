import classNames from 'classnames';
import { useEffect } from 'react';

import useMinesweeper from '../../hooks/useMinesweeper';
import { DEFAULT_SCALE, DEFAULT_SIZE } from '../../shaders/GLHelper';
import generateTest, { prepareField } from '../../utils/tensorTest';
import GameInstance from '../../workers/GameWorker/GameInstance';

import Field from '../Field';
import Header from '../Header';

// import GameWorker from '../../workers/GameWorker/index.game.worker';
// import GameWorkerProxy from '../../workers/GameWorker/GameWorkerProxy';

import './style.scss';

// const gameWorkerProxy = new GameWorkerProxy(new GameWorker());

// gameWorkerProxy.initPromise.then(() => {
//     console.log('Game worker initialized');
// })
const instance = new GameInstance();

function App() {
    const { actions, state } = useMinesweeper();

    useEffect(() => {
        prepareField();
    }, []);

    return (
        <canvas
            id="canvas"
            style={{
                background: 'black',
                width: DEFAULT_SIZE * DEFAULT_SCALE,
                height: DEFAULT_SIZE * DEFAULT_SCALE,
            }}
            width={DEFAULT_SIZE * DEFAULT_SCALE}
            height={DEFAULT_SIZE * DEFAULT_SCALE}
            onClick={() => {
                generateTest();
            }}
        />
        // <div className={classNames('app', state.gameState, { loading: state.loading })}>
        //     <button onClick={async (e) => {
        //         // await instance.workersPoweredOn;
        //         generateTest();
        //         // const start = Date.now();
        //         // instance.newGame({
        //         //     columns: 10000,
        //         //     rows: 10000,
        //         //     mines: 50000000,
        //         // }).then(() => {
        //         //     console.log('new game done in: ' + (Date.now() - start) + 'ms');
        //         // });
        //     }}>test</button>
        //     <Header
        //         params={state.params}
        //         gameId={state.gameId}
        //         loading={state.loading}
        //         gameState={state.gameState}
        //         onNewGame={actions.newGame}
        //         minesLeft={state.params.mines - state.flagsCount}
        //     />
        //     {(state.field && state.colorizationPromise) ? (
        //         <Field
        //             params={state.params}
        //             emptySubstitute={state.emptySubstitute}
        //             onGameStateUpdate={actions.setGameState}
        //             onAddFlag={actions.addFlag}
        //             onRemoveFlag={actions.removeFlag}
        //             field={state.field}
        //             colorizationPromise={state.colorizationPromise}
        //             onFieldUpdate={actions.setField}
        //         />
        //     ) : (
        //         <div className="placeholder">
                    
        //         </div>
        //     )}
        // </div>
    )
}

export default App;