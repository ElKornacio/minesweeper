import classNames from 'classnames';
import React, { HTMLAttributes, useCallback } from 'react';
import { CSSProperties, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import useElementResize, { IDimensions } from '../../utils/useElementResize';
import { cellSize, CELL_EMPTY, CELL_CLOSED, CELL_MINE, CELL_EXPLODED, CELL_FLAG, CELL_FLAG_WRONG } from './consts';
import FieldContent from './FieldContent';
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

export default function Field({ params }: { params: IGameParams }) {
    const fieldWrapper = useRef<HTMLDivElement>(null);
    const fieldWrapperSize = useElementResize(fieldWrapper);

    const fieldSize = { width: cellSize * params.columns, height: cellSize * params.rows };

    const { initialX, initialY } = getInitialPos(fieldSize, fieldWrapperSize);
    
    const [ X, setX ] = useState(initialX);
    const [ Y, setY ] = useState(initialY);
    const [ field, setField ] = useState<Uint8Array | null>(null);

    const overHead = 3;

    const xViewportSize = Math.floor(fieldWrapperSize.width / cellSize) + overHead * 2;
    const yViewportSize = Math.floor(fieldWrapperSize.height / cellSize) + overHead * 2;

    const overheadX = Math.floor((-X) / (cellSize));
    const overheadY = Math.floor((-Y) / (cellSize));
    const startX = overheadX < overHead ? 0 : (overheadX - overHead);
    const startY = overheadY < overHead ? 0 : (overheadY - overHead);
    const tX = overheadX < overHead ? X : (X + startX * cellSize);
    const tY = overheadY < overHead ? Y : (Y + startY * cellSize);

    const slice = {
        tX: tX,
        tY: tY,
        xStart: startX,
        xEnd: Math.min(params.columns, startX + xViewportSize),
        yStart: startY,
        yEnd: Math.min(params.rows, startY + yViewportSize),
    };

    useEffect(() => {
        if (!field) {
            const _field = new Uint8Array(params.columns * params.rows);
            for (let i = 0; i < params.columns * params.rows; i++) {
                _field[i] = [
                    CELL_EMPTY,
                    CELL_CLOSED,
                    CELL_MINE,
                    CELL_EXPLODED,
                    CELL_FLAG,
                    CELL_FLAG_WRONG,
                    1, 2, 3, 4, 5, 6, 7, 8
                ][Math.floor(Math.random() * 14)];
            }
            // _field.fill(CELL_CLOSED);
            setField(_field);
        }
    }, [params]);

    const handleCellClick = useCallback((x: number, y: number) => {
        if (!field) {
            return;
        }
        const newField = new Uint8Array(field);
        newField[x * params.columns + y] = 3;
        setField(newField);
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