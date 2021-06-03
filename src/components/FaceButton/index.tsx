import classNames from 'classnames';
import React from 'react';

import './style.scss';

type FaceState = 'pressed' | 'unpressed' | 'win' | 'lose';

export default function FaceButton(props: Exclude<React.HTMLAttributes<HTMLImageElement>, 'src'> & { loading: boolean, state: FaceState }) {
    const { state, loading, ...rest } = props;
    return (
        <div
            className={classNames('face-button', { loading }, 'state-' + state)}
            {...rest}
        />
    )
}