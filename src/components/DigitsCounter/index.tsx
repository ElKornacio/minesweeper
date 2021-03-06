import classNames from 'classnames';
import React from 'react';

import './style.scss';

function DigitsCounter(props: Exclude<React.HTMLAttributes<HTMLDivElement>, 'src'> & { value: number }) {
    const { value, className, ...rest } = props;

    const digits = value.toString().padStart(3, '0').split('');

    return (
        <div
            className="digits-counter"
            {...rest}
        >
            {digits.map((d, idx) => (
                <div className={classNames('digit', 'd' + d)} key={idx} />
            ))}
        </div>
    )
}

export default React.memo(DigitsCounter);