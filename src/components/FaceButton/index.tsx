import classNames from 'classnames';
import React from 'react';

import './style.scss';

type FaceState = 'pressed' | 'unpressed' | 'win' | 'lose';

export default function FaceButton(props: Exclude<React.HTMLAttributes<HTMLImageElement>, 'src'> & { state: FaceState }) {
    const { state, ...rest } = props;
    return (
        <div
            className={classNames('face-button', 'state-' + state)}
            {...rest}
        />
    )
}