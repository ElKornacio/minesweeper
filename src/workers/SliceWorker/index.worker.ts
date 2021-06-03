import { IGameParams } from "../../components/Field";
import { ISliceProcessingResult } from "./SliceWorkerProxy";

declare const self: Worker;
export default {} as typeof Worker & { new(): Worker };

class PrebuiltArray extends Uint32Array {

    internalLength: number = 0;

    constructor(length: number) {
        super(length);
    }

    fastPush(e: number) {
        this[this.internalLength++] = e;
    }

    compact() {
        return this.slice(0, this.internalLength);
    }

}

function printField(params: IGameParams, field: Uint32Array) {
    return;
    for (let y = 0; y < params.rows; y++) {
        let s = '';
        for (let x = 0; x < params.columns; x++) {
            s += field[x * params.columns + y] + ' ';
        }
        console.log(s);
    }
}

function colorizeField(fieldBuffer: SharedArrayBuffer, params: IGameParams, colorsBuffer: SharedArrayBuffer) {
    const field = new Uint8Array(fieldBuffer);
    const colors = new Uint32Array(colorsBuffer);
    colors.fill(0);

    const colorsSize: Record<number, number> = {};
    const colorsEquals: Record<number, number> = {};

    let color = 1;

    const conv = (x: number, y: number) => x * params.columns + y;

    // debugger;
    const start = Date.now();
    let g = 0;
    for (let i = 0; i < field.length; i++) {
        if (field[i] !== 0) {
            continue;
        }
        g++;
        const x = Math.floor(i / params.columns);
        const y = i % params.columns;

        const cXm1 = x >= 1;
        const cXp1 = x < params.columns - 1;
        const cYm1 = y >= 1;
        const cYp1 = y < params.rows - 1;

        let c = 0;
        let d;
        if (cYm1 && cXm1 && (d = colors[conv(x - 1, y - 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }
        if (cYm1 && (d = colors[conv(x - 0, y - 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }
        if (cYm1 && cXp1 && (d = colors[conv(x + 1, y - 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }

        if (cXm1 && (d = colors[conv(x - 1, y - 0)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }
        if (cXp1 && (d = colors[conv(x + 1, y - 0)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }

        if (cXm1 && cYp1 && (d = colors[conv(x - 1, y + 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }
        if (cYp1 && (d = colors[conv(x - 0, y + 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }
        if (cXp1 && cYp1 && (d = colors[conv(x + 1, y + 1)])) {
            if (c !== 0 && c !== d) {
                colorsEquals[c > d ? c : d] = c > d ? d : c;
            }
            c = d;
        }

        if (c) {
            colors[i] = c;
            colorsSize[c] += 1;
        } else {
            colors[i] = ++color;
            colorsSize[color] = 1;
        }

        //printField(params, colors);
    }

    // // console.log('g: ', g);
    // // console.log('color: ', color);
    // // console.log('colorization time: ' + (Date.now() - start));

    const colorsIndexes: Record<number, PrebuiltArray> = {};
    const keys = [...new Array(color - 1)].map((e, i) => i + 2);
    // const uniqueColors = keys.slice();

    // console.log('colorsEquals: ', colorsEquals);

    let found = true;
    while (found) {
        found = false;
        for (let key of keys) {
            if (colorsEquals[colorsEquals[Number(key)]]) {
                colorsEquals[Number(key)] = colorsEquals[colorsEquals[Number(key)]];
                found = true;
            }
        }
    }

    // // // console.log('colorsEquals: ', colorsEquals);
    const uniqueColors = new Set(keys.map(key => colorsEquals[Number(key)] ? colorsEquals[Number(key)] : Number(key)));
    // // // console.log('uniqueColors: ', uniqueColors);

    printField(params, colors);
    // console.log('colorsSize: ', colorsSize);
    // console.log('colorsEquals: ', colorsEquals);
    // console.log('keys: ', keys);

    const newColorsSize: Record<number, number> = {};
    for (let key of keys) {
        const k = colorsEquals[Number(key)] ? colorsEquals[Number(key)] : Number(key);
        if (!newColorsSize[k]) {
            newColorsSize[k] = colorsSize[Number(key)];
        } else {
            newColorsSize[k] += colorsSize[Number(key)];
        }
    }

    // console.log('newColorsSize: ', newColorsSize);

    for (let i = 0; i < colors.length; i++) {
        if (!colors[i]) {
            continue;
        }
        if (colorsEquals[colors[i]]) {
            colors[i] = colorsEquals[colors[i]];
        }
    }

    printField(params, colors);

    for (let i = 0; i < colors.length; i++) {
        if (!colors[i]) {
            continue;
        }
        const v = colors[i];
        if (!colorsIndexes[v]) {
            colorsIndexes[v] = new PrebuiltArray(newColorsSize[v]);
            colorsIndexes[v].fastPush(i);
        } else {
            colorsIndexes[v].fastPush(i);
        }
    }

//     console.log('colorsIndexes: ', colorsIndexes);

    for (let i = 0; i < field.length; i++) {
        if (field[i] === 0 && colors[i] === 0) {
            debugger;
            // // console.log('strange things: ', i);
        }
    }

    // // // console.log('color normalization time: ' + (Date.now() - start));
    // console.log('uniqueColors: ', uniqueColors);

    const finalColorsIndexes = [...uniqueColors.values()].reduce((p, c) => {
        p[c] = colorsIndexes[c].compact();
        return p;
    }, {} as Record<string, Uint32Array>);

    // console.log('finalColorsIndexes: ', finalColorsIndexes);

    return { colorsIndexes: finalColorsIndexes };
}

(() => {
    self.onmessage = (ev) => {
        const { type, id, data } = ev.data;
        if (type === 'slice') {
            const { fieldBuffer, params, colorsBuffer } = data as { fieldBuffer: SharedArrayBuffer, params: IGameParams, colorsBuffer: SharedArrayBuffer };
            // // // console.log('colorization got');
            const start = Date.now();
            self.postMessage({ id, type: 'slice', data: colorizeField(fieldBuffer, params, colorsBuffer) });
            // // console.log('colorization end: ' + (Date.now() - start) + 'ms');
        }
    };
    self.postMessage({
        type: 'inited',
        data: 'Im initialized'
    });
})();