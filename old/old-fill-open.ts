const fillOpen = (x1: number, y1: number, newField: Uint8Array) => {
    const th = 300 * 1000 * 1000;
    const stack = new Uint32Array(th);
    const stack2 = new Uint32Array(th);
    stack[0] = conv(x1, y1);
    let length = 1;
    let count = 0;

    const t = (x2: number, y2: number) => {
        const vv = v(x2, y2, newField);
        if (vv === -1) {
            return;
        }
        if (length >= th) {
            stack2[(length++) - th] = conv(x2, y2);
        } else {
            stack[length++] = conv(x2, y2);
        }
    }

    while (length) {
        let iv: number;
        if (length >= th) {
            iv = stack2[(--length) - th];
        } else {
            iv = stack[--length];
        }
        const x = Math.floor(iv / params.columns);
        const y = iv % params.columns;

        const vv = v(x, y, newField);

        if (vv !== -1 && vv < 10 && vv !== 9) {
            newField[conv(x, y)] += 10;
            count++;
        }
        if (vv !== 0) {
            continue;
        }

        t(x - 1, y - 1);
        t(x, y - 1);
        t(x + 1, y - 1);

        t(x - 1, y);
        t(x + 1, y);

        t(x - 1, y + 1);
        t(x, y + 1);
        t(x + 1, y + 1);
    }

    filledCells += count;
}