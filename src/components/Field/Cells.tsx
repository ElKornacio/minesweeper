import React from "react";
import { cellSize } from "../../types/consts";
import FieldArray from "../../types/FieldArray";
import { IFieldSmallSlice } from "../../types/IFieldSlice";
import IGameParams from "../../types/IGameParams";
import Cell from "./Cell";

export interface ICellsProps {
    params: IGameParams;
    field: FieldArray;
    smallSlice: IFieldSmallSlice;
    onCellClick: (leftButton: boolean, x: number, y: number) => void;
}

export default function Cells({ params, field, smallSlice, onCellClick }: ICellsProps) {
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