import React from 'react';

import './style.scss';

//@ts-ignore
import d0 from '../../assets/d0.svg';
//@ts-ignore
import d1 from '../../assets/d1.svg';
//@ts-ignore
import d2 from '../../assets/d2.svg';
//@ts-ignore
import d3 from '../../assets/d3.svg';
//@ts-ignore
import d4 from '../../assets/d4.svg';
//@ts-ignore
import d5 from '../../assets/d5.svg';
//@ts-ignore
import d6 from '../../assets/d6.svg';
//@ts-ignore
import d7 from '../../assets/d7.svg';
//@ts-ignore
import d8 from '../../assets/d8.svg';
//@ts-ignore
import d9 from '../../assets/d9.svg';

const digitsMap: Record<number, string> = {
    0: d0,
    1: d1,
    2: d2,
    3: d3,
    4: d4,
    5: d5,
    6: d6,
    7: d7,
    8: d8,
    9: d9,
}

export default function DigitsCounter(props: Exclude<React.HTMLAttributes<HTMLDivElement>, 'src'> & { value: number }) {
    const { value, className, ...rest } = props;

    if (value < 0) {
        return null;
    }

    const digits = value.toString().padStart(3, '0').split('').map(d => digitsMap[Number(d)]);

    return (
        <div
            className="digits-counter"
            {...rest}
        >
            {digits.map((d, idx) => (
                <img src={d} className="digit" key={idx} />
            ))}
        </div>
    )
}