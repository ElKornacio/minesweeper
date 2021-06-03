import classNames from "classnames";
import React, { HTMLAttributes, useCallback } from "react";
import { CELL_CLASS } from "../../types/consts";

export interface ICellProps {
    state: number;
    x: number;
    y: number;
    onCellClick: (leftButton: boolean, x: number, y: number) => void;
}

const preventContextMenu = (e: React.MouseEvent) => e.preventDefault();

export default function Cell(props: HTMLAttributes<HTMLDivElement> & ICellProps) {
    const { state, className, x, y, onCellClick, ...rest } = props;
    const cls = CELL_CLASS[state];

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onCellClick(e.button === 0, x, y);
    }, [onCellClick, x, y]);

    return (
        <div
            data-state={state}
            className={classNames('cell', `cell-${cls}`, className)}
            onContextMenu={preventContextMenu}
            onMouseUp={handleMouseUp}
            {...rest}
        />
    );
}