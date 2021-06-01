import React from 'react';

import './style.scss';

//@ts-ignore
import unpressedFace from '../../assets/face_unpressed.svg';
//@ts-ignore
import pressedFace from '../../assets/face_pressed.svg';

type FaceState = 'pressed' | 'unpressed';

const facesMap: Record<FaceState, string> = {
    pressed: pressedFace,
    unpressed: unpressedFace,
}

export default function FaceButton(props: Exclude<React.HTMLAttributes<HTMLImageElement>, 'src'> & { state: FaceState }) {
    const { state, ...rest } = props;
    return (
        <img
            src={facesMap[state]}
            className="face-button"
            {...rest}
        />
    )
}