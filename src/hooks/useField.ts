import { useCallback, useEffect, useState } from "react";
import { IFieldProps } from "../components/Field";
import { CELL_EXPLODED, CELL_FLAG_WRONG } from "../types/consts";
import FieldArray from "../types/FieldArray";
import IGameParams from "../types/IGameParams";
import touchAround, { calcAround } from "../utils/touches";

export default function useField(props: IFieldProps) {
    const {
        params, field, colorizationPromise, emptySubstitute,
        onFieldUpdate, onGameStateUpdate, onAddFlag, onRemoveFlag
    } = props;
    const [ isFirstClick, setIsFirstClick ] = useState(true);
    const [ filledCells, setFilledCells ] = useState(0);

    // on new game
    useEffect(() => {
        setIsFirstClick(true);
        setFilledCells(0);
    }, [params]);


    // helper functions
    const toIndex = useCallback((x: number, y: number) => x * params.columns + y, [params]);
    const getFieldValue = useCallback((x: number, y: number, _field: FieldArray) => {
        if (x < 0 || y < 0 || x >= params.columns || y >= params.rows) {
            return - 1;
        }
        return _field[toIndex(x, y)]
    }, [params]);


    // game functions. I don't use useCallback intentionally - they will be updated almost on every render.
    const gameLose = (x: number, y: number) => {
        if (!field) {
            return;
        }
        const newField = new Uint8Array(field);
        newField[toIndex(x, y)] = CELL_EXPLODED;
        for (let i = 0; i < newField.length; i++) {
            let v = newField[i];
            if (v < 10) {
                v += 10;
            } else
            if (v < 30 && v >= 20) {
                if (v !== 29) {
                    v = CELL_FLAG_WRONG;
                }
            }
            newField[i] = v;
        }

        onFieldUpdate(newField);
        onGameStateUpdate('lose');
    }

    const gameWin = (newField: FieldArray) => {
        for (let i = 0; i < newField.length; i++) {
            let v = newField[i];
            if (v < 10) {
                v += 10;
            } else
                if (v >= 20) {
                    v -= 10;
                }
            newField[i] = v;
        }
        onGameStateUpdate('win');
    }

    const fillColorful = (x1: number, y1: number, newField: FieldArray, colors: Uint32Array, colorsIndexes: Record<string, Uint32Array>) => {
        let filledCellsInc = 0;
        console.log('colorful ', x1, y1);
        if (newField[toIndex(x1, y1)] !== 0) {
            if (newField[toIndex(x1, y1)] < 10) {
                newField[toIndex(x1, y1)] += 10;
                filledCellsInc++;
            }

            return filledCellsInc;
        }

        const color = colors[toIndex(x1, y1)];
        console.log('field:');
        // printField(params, newField);
        console.log('colors:');
        // printField(params, colors);
        // console.log('colors: ', colors);
        if (color === 0) {
            throw new Error('Very bad thing happened');
        }
        if (color === 999999999) {
            if (newField[toIndex(x1, y1)] === 0) {
                newField[toIndex(x1, y1)] = 10;
                filledCellsInc++;
                touchAround(params, x1, y1, (x2, y2) => {
                    filledCellsInc += fillColorful(x2, y2, newField, colors, colorsIndexes);
                });
            }
            return filledCellsInc;
        }
        const indexesToFill = colorsIndexes[color];
        // console.log('color: ', color);
        // console.log('colorsIndexes: ', colorsIndexes);
        let start = Date.now();
        for (let i = 0; i < indexesToFill.length; i++) {
            const n = indexesToFill[i];
            if (n !== 999999999 && newField[n] < 10) {
                newField[n] += 10;
                filledCellsInc++;
            }
        }
        // console.log('a: ', (Date.now() - start) + 'ms');
        start = Date.now();

        const g = (x2: number, y2: number) => {
            const c = toIndex(x2, y2);
            if (colors[c] === 999999999 && newField[c] === 0) {
                filledCellsInc += fillColorful(x2, y2, newField, colors, colorsIndexes);
            } else
                if (newField[c] < 10) {
                    newField[c] += 10;
                    filledCellsInc++;
                }
        };

        for (let i = 0; i < indexesToFill.length; i++) {
            const n = indexesToFill[i];
            if (n !== 999999999) {
                touchAround(params, Math.floor(n / params.columns), n % params.columns, g);
            }
        }

        return filledCellsInc;
    }

    function substituteEmpty(x1: number, y1: number, newField: FieldArray, colors: Uint32Array, colorsIndexes: Record<string, Uint32Array>) {
        if (props.emptySubstitute === null) {
            return;
        }

        const eX = Math.floor(props.emptySubstitute / params.columns);
        const eY = props.emptySubstitute % params.rows;

        const prevIndex = toIndex(x1, y1);

        newField[prevIndex] = calcAround(params, x1, y1, (x, y) => newField[toIndex(x, y)] === 9 ? 1 : 0); // recalc
        newField[props.emptySubstitute] = 9; // recalc

        // new mine cell
        touchAround(params, eX, eY, (x, y) => {
            if ((x !== eX || y !== eY) && newField[toIndex(x, y)] < 8) {
                newField[toIndex(x, y)] += 1;
            }
            const c = colors[toIndex(x, y)];
            if (c !== 0) {
                colors[toIndex(x, y)] = 0;
                const ci = colorsIndexes[c];
                const idx = ci.indexOf(toIndex(x, y));
                ci[idx] = 999999999;
                // fix areas cut
            }
        }, true);

        // new emtpy cell
        touchAround(params, x1, y1, (x, y) => {
            if ((x !== x1 || y !== y1) && newField[toIndex(x, y)] !== 9 && newField[toIndex(x, y)] > 0) {
                newField[toIndex(x, y)] -= 1;
            }
            const c = colors[toIndex(x, y)];
            if (newField[toIndex(x, y)] === 0 && c === 0) {
                colors[toIndex(x, y)] = 999999999; // broken color
            }
        }, true);
    }

    const handleCellClick = useCallback(async (leftButton: boolean, x: number, y: number) => {
        if (!field) {
            return;
        }

        let inc = 0;

        console.log('click', x, y);
        setIsFirstClick(false);

        const newField = new Uint8Array(field);
        let v = newField[toIndex(x, y)];
        if (leftButton) {
            if (v > 10 && v < 19) {
                let _flagsCount = 0;
                const _emptyCells: { x: number, y: number }[] = [];
                const t = (x1: number, y1: number) => {
                    if (x1 < 0 || y1 < 0 || x1 >= params.columns || y1 >= params.rows) {
                        return;
                    }
                    const vv = newField[toIndex(x1, y1)];
                    if (vv >= 20 && vv < 30) {
                        _flagsCount++;
                    } else
                        if (vv < 10) {
                            _emptyCells.push({ x: x1, y: y1 });
                        }
                }

                t(x - 1, y - 1);
                t(x, y - 1);
                t(x + 1, y - 1);

                t(x - 1, y);
                t(x + 1, y);

                t(x - 1, y + 1);
                t(x, y + 1);
                t(x + 1, y + 1);

                if (_flagsCount === (v - 10)) {
                    const c = await colorizationPromise;
                    for (let { x: x3, y: y3 } of _emptyCells) {
                        inc += fillColorful(x3, y3, newField, c.colors, c.colorsIndexes);
                    }
                }
            } else
            if (v >= 10) {
                return;
            } else {
            if (v === 9) {
                if (isFirstClick && emptySubstitute !== null) {
                    const c = await colorizationPromise;
                    substituteEmpty(x, y, newField, c.colors, c.colorsIndexes);
                    inc += fillColorful(x, y, newField, c.colors, c.colorsIndexes);
                } else {
                    return gameLose(x, y);
                }
            } else {
                const c = await colorizationPromise;
                inc += fillColorful(x, y, newField, c.colors, c.colorsIndexes);
            }
            }
        } else {
            if (v < 10) {
                newField[toIndex(x, y)] += 20;
                onAddFlag();
            } else
            if (v >= 20 && v < 30) {
                newField[toIndex(x, y)] -= 20;
                onRemoveFlag();
            }
        }

        if (filledCells + inc === params.columns * params.rows - params.mines) {
            gameWin(newField);
        }

        onFieldUpdate(newField);
        setFilledCells(filledCells + inc);

    }, [filledCells, field, params, colorizationPromise, isFirstClick, emptySubstitute]);

    return { handleCellClick };
}