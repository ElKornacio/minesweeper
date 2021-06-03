import classNames from 'classnames';

import useMinesweeper from '../../hooks/useMinesweeper';

import Field from '../Field';
import Header from '../Header';

import './style.scss';

function App() {
    const { actions, state } = useMinesweeper();

    return (
        <div className={classNames('app', state.gameState)}>
            <Header
                params={state.params}
                gameId={state.gameId}
                loading={state.loading}
                gameState={state.gameState}
                onNewGame={actions.newGame}
                minesLeft={state.params.mines - state.flagsCount}
            />
            {(state.field && state.colorizationPromise) ? (
                <Field
                    params={state.params}
                    emptySubstitute={state.emptySubstitute}
                    onGameStateUpdate={actions.setGameState}
                    onAddFlag={actions.addFlag}
                    onRemoveFlag={actions.removeFlag}
                    field={state.field}
                    colorizationPromise={state.colorizationPromise}
                    onFieldUpdate={actions.setField}
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