import classNames from "classnames";
import { HTMLAttributes, useCallback } from "react";
import { IGameParams } from ".";
import { CELL_CLASS, cellSize } from "./consts";

interface IFieldSmallSlice {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
}

interface IFieldSlice extends IFieldSmallSlice {
    tX: number;
    tY: number;
}

interface ICellProps {
    state: number;
    x: number;
    y: number;
    onCellClick: (x: number, y: number) => void;
}

function Cell(props: HTMLAttributes<HTMLDivElement> & ICellProps) {
    const { state, className, x, y, onCellClick, ...rest } = props;
    const cls = CELL_CLASS[state];
    return (
        <div
            className={classNames('cell', `cell-${cls}`, className)}
            onClick={e => {
                e.preventDefault();

                onCellClick(x, y);
            }}
            {...rest}
        />
    );
}

interface ICellsProps {
    params: IGameParams;
    field: Uint8Array;
    smallSlice: IFieldSmallSlice;
    onCellClick: (x: number, y: number) => void;
}

function Cells({ params, field, smallSlice, onCellClick }: ICellsProps) {
    const array: any[] = [];

    for (let x = smallSlice.xStart; x < smallSlice.xEnd; x++) {
        for (let y = smallSlice.yStart; y < smallSlice.yEnd; y++) {
            array.push(
                <Cell
                    key={`${(x - smallSlice.xStart)}:${(y - smallSlice.yStart)}`}
                    style={{
                        transform: `translate(${(x - smallSlice.xStart) * cellSize}px, ${(y - smallSlice.yStart) * cellSize}px)`
                    }}
                    x={x}
                    y={y}
                    state={field[x * params.columns + y]}
                    onCellClick={onCellClick}
                />
            );
        }
    }

    return (<>{array}</>)
}

export default function FieldContent({ params, field, slice, onCellClick }: { params: IGameParams, field: Uint8Array, slice: IFieldSlice, onCellClick: (x: number, y: number) => void }) {
    return (
        <div
            className="field"
            style={{
                transform: `translate(${slice.tX}px, ${slice.tY}px)`
            }}
        >
            <Cells params={params} field={field} smallSlice={slice} onCellClick={onCellClick} />
        </div>
    );
}
