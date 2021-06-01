import React, { useState } from 'react';
import DigitsCounter from '../DigitsCounter';
import FaceButton from '../FaceButton';
import Field from '../Field';

import './style.scss';

function App() {
    const [ time, setTime ] = useState(84);

    return (
        <div className="app">
            <div className="header">
                <div className="time"><DigitsCounter value={time} /></div>
                <div className="restart">
                    <FaceButton state="unpressed" />
                </div>
                <div className="mines-left"><DigitsCounter value={13} /></div>
            </div>
            <Field params={{ columns: 100, rows: 100, mines: 5 }} />
        </div>
    )
}

export default App;