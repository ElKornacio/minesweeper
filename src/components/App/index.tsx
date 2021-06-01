import React from 'react';
import DigitsCounter from '../DigitsCounter';
import FaceButton from '../FaceButton';

import './style.scss';

function App() {
    return (
        <div className="app">
            <div className="header">
                <div className="time"><DigitsCounter value={99} /></div>
                <div className="restart">
                    <FaceButton state="unpressed" />
                </div>
                <div className="mines-left"><DigitsCounter value={13} /></div>
            </div>
            <div className="field">
                test
            </div>
        </div>
    )
}

export default App;