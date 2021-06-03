import React from "react";
import { cellSize } from "../../types/consts";
import IFieldSlice from "../../types/IFieldSlice";
import IGameParams from "../../types/IGameParams";
import Cells from "./Cells";

export interface IFieldContentProps {
    params: IGameParams;
    field: Uint8Array;
    slice: IFieldSlice;
    onCellClick: (leftButton: boolean, x: number, y: number) => void
}

export default function FieldContent({ params, field, slice, onCellClick }: IFieldContentProps) {
    return (
        <div
            className="field"
            style={{
                width: (slice.xEnd - slice.xStart) * cellSize + 2,
                height: (slice.yEnd - slice.yStart) * cellSize + 2,
                transform: `translate(${slice.offsetX}px, ${slice.offsetY}px)`
            }}
        >
            <Cells params={params} field={field} smallSlice={slice} onCellClick={onCellClick} />
        </div>
    );
}
