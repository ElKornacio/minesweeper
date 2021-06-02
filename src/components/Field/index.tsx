import React, { useCallback } from 'react';
import { useEffect, useRef, useState } from 'react';
import useElementResize, { IDimensions } from '../../utils/useElementResize';
import { cellSize, CELL_EXPLODED, CELL_FLAG_WRONG } from './consts';
import FieldContent from './FieldContent';
import generateField from './generateField';
import './style.scss';

export interface IGameParams {
    rows: number;
    columns: number;
    mines: number;
}

function getInitialPos(fieldSize: IDimensions, fieldWrapperSize: IDimensions) {
    let initialX = 0;
    let initialY = 0;

    if (fieldSize.width < fieldWrapperSize.width) {
        initialX = (fieldWrapperSize.width - fieldSize.width) / 2;
    }

    if (fieldSize.height < fieldWrapperSize.height) {
        initialY = (fieldWrapperSize.height - fieldSize.height) / 2;
    }

    return { initialX, initialY };
}

//@ts-ignore
window.generateField = (x, y, z) => generateField({ columns: x, rows: y, mines: z });

export default function Field({ params, onGameStateUpdate, field, onFieldUpdate, onAddFlag, onRemoveFlag }: { params: IGameParams, field: Uint8Array, onFieldUpdate: (newField: Uint8Array) => void, onGameStateUpdate: (newState: 'none' | 'win' | 'lose') => void, onAddFlag: () => void, onRemoveFlag: () => void }) {
    const fieldWrapper = useRef<HTMLDivElement>(null);
    const fieldWrapperSize = useElementResize(fieldWrapper);
    const conv = (x: number, y: number) => x * params.columns + y;

    const fieldSize = { width: cellSize * params.columns, height: cellSize * params.rows };

    const { initialX, initialY } = getInitialPos(fieldSize, fieldWrapperSize);
    
    const [ X, setX ] = useState(initialX);
    const [ Y, setY ] = useState(initialY);

    useEffect(() => {
        setX(initialX);
        setY(initialY);
    }, [params]);

    const overHead = 3;

    const xViewportSize = Math.floor(fieldWrapperSize.width / cellSize) + overHead * 2;
    const yViewportSize = Math.floor(fieldWrapperSize.height / cellSize) + overHead * 2;

    let startX;
    let tX;
    if (fieldSize.width > fieldWrapperSize.width) {
        const overheadX = Math.floor((-X) / (cellSize));
        startX = overheadX < overHead ? 0 : (overheadX - overHead);
        tX = overheadX < overHead ? X : (X + startX * cellSize);
    } else {
        startX = 0;
        tX = X;
    }

    let startY;
    let tY;
    if (fieldSize.width > fieldWrapperSize.width) {
        const overheadY = Math.floor((-Y) / (cellSize));
        startY = overheadY < overHead ? 0 : (overheadY - overHead);
        tY = overheadY < overHead ? Y : (Y + startY * cellSize);
    } else {
        startY = 0;
        tY = Y;
    }

    const slice = {
        tX: tX,
        tY: tY,
        xStart: startX,
        xEnd: Math.min(params.columns, startX + xViewportSize),
        yStart: startY,
        yEnd: Math.min(params.rows, startY + yViewportSize),
    };

    const gameLose = (x: number, y: number) => {
        if (!field) {
            return;
        }

        const newField = new Uint8Array(field);
        newField[conv(x, y)] = CELL_EXPLODED;
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

    const v = (x1: number, y1: number, newField: Uint8Array) => {
        if (x1 < 0 || y1 < 0 || x1 >= params.columns || y1 >= params.rows) {
            return - 1;
        }
        return newField[conv(x1, y1)]
    };

    const fillOpen = (x1: number, y1: number, newField: Uint8Array) => {
        const th = 300 * 1000 * 1000;
        const stack = new Uint32Array(th);
        const stack2 = new Uint32Array(th);
        stack[0] = conv(x1, y1);
        let length = 1;

        const t = (x2: number, y2: number) => {
            const vv = v(x2, y2, newField);
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
            }
            if (vv !== 0) {
                continue;
            }

            t(x - 1,    y - 1);
            t(x,        y - 1);
            t(x + 1,    y - 1);

            t(x - 1,    y);
            t(x + 1,    y);

            t(x - 1,    y + 1);
            t(x,        y + 1);
            t(x + 1,    y + 1);
        }
    }

    const handleCellClick = useCallback((leftButton: boolean, x: number, y: number) => {
        if (!field) {
            return;
        }
        const newField = new Uint8Array(field);
        let v = newField[conv(x, y)];
        if (leftButton) {
            if (v >= 10) {
                return;
            } else {
                if (v === 0) {
                    fillOpen(x, y, newField);
                } else
                if (v === 9) {
                    return gameLose(x, y);
                } else {
                    newField[conv(x, y)] += 10;
                }
            }
        } else {
            if (v < 10) {
                newField[conv(x, y)] += 20;
                onAddFlag();
            } else
            if (v >= 20 && v < 30) {
                newField[conv(x, y)] -= 20;
                onRemoveFlag();
            }
        }

        onFieldUpdate(newField);
    }, [field, params]);

    useEffect(() => {
        if (fieldSize.width < fieldWrapperSize.width) {
            setX((fieldWrapperSize.width - fieldSize.width) / 2);
        }

        if (fieldSize.height < fieldWrapperSize.height) {
            setY((fieldWrapperSize.height - fieldSize.height) / 2);
        }
    }, [fieldWrapperSize])

    return (
        <div
            ref={fieldWrapper}
            className="field-wrapper"
            onWheel={(e) => {
                let newX = X - e.deltaX;
                let newY = Y - e.deltaY;

                if (fieldSize.width < fieldWrapperSize.width) {
                    newX = (fieldWrapperSize.width - fieldSize.width) / 2;
                } else
                if (fieldSize.width > fieldWrapperSize.width && (newX < -1 * (fieldSize.width - fieldWrapperSize.width))) {
                    newX = -1 * (fieldSize.width - fieldWrapperSize.width);
                } else
                if (newX > 0) {
                    newX = 0;
                }

                if (fieldSize.height < fieldWrapperSize.height) {
                    newY = (fieldWrapperSize.height - fieldSize.height) / 2;
                } else
                if (fieldSize.height > fieldWrapperSize.height && (newY < -1 * (fieldSize.height - fieldWrapperSize.height))) {
                    newY = -1 * (fieldSize.height - fieldWrapperSize.height);
                } else
                if (newY > 0) {
                    newY = 0;
                }

                setX(newX);
                setY(newY);
            }}
        >
            {field ? <FieldContent onCellClick={handleCellClick} slice={slice} field={field} params={params} /> : null}
        </div>
    );
}