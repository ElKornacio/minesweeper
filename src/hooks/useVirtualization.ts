import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IDimensions from "../types/IDimensions";
import IGameParams from "../types/IGameParams";
import useElementResize from "./useElementResize";

function getInitialPos(viewport: IDimensions, container: IDimensions) {
    let initialX = 0;
    let initialY = 0;

    if (viewport.width < container.width) {
        initialX = (container.width - viewport.width) / 2;
    }

    if (viewport.height < container.height) {
        initialY = (container.height - viewport.height) / 2;
    }

    return { initialX, initialY };
}

export interface IVirtualizationOptions {
    params: IGameParams;
    cellSize: number;
    overHead: number;
}

function calculateVisibility(axis: 'x' | 'y', realOffset: number, containerSize: IDimensions, opts: IVirtualizationOptions) {
    let start = 0;
    let offset = realOffset;

    const width =   [ opts.params.columns   * opts.cellSize,  containerSize.width  ];
    const height =  [ opts.params.rows      * opts.cellSize,  containerSize.height ];

    const [ elementLength, containerLength ] = axis === 'x' ? width : height;
    if (elementLength > containerLength) {
        const overhead = Math.floor((-realOffset) / (opts.cellSize));
        start = overhead < opts.overHead ? 0 : (overhead - opts.overHead);
        offset = overhead < opts.overHead ? realOffset : (realOffset + start * opts.cellSize);
    }

    return { start, offset };
}

export default function useVirtualization(opts: IVirtualizationOptions) {
    const { params, cellSize, overHead } = opts;
    const containerRef = useRef<HTMLDivElement>(null);
    const containerSize = useElementResize(containerRef);
    
    const elementSize = useMemo(() => ({
        width: params.columns * opts.cellSize,
        height: params.rows * opts.cellSize
    }), [params, opts.cellSize]);

    const { initialX, initialY } = useMemo(
        () => getInitialPos(elementSize, containerSize),
        [elementSize, containerSize]
    );
    
    const [ X, setX ] = useState(initialX);
    const [ Y, setY ] = useState(initialY);

    const xViewportSize = Math.floor(containerSize.width / cellSize) + overHead * 2;
    const yViewportSize = Math.floor(containerSize.height / cellSize) + overHead * 2;

    const { start: startX, offset: offsetX } = calculateVisibility('x', X, containerSize, opts);
    const { start: startY, offset: offsetY } = calculateVisibility('y', Y, containerSize, opts);

    // on resize
    useEffect(() => {
        setX(initialX);
        setY(initialY);
    }, [initialX, initialY]);

    // on scroll
    const handleWheel = useCallback((e) => {
        let newX = X - e.deltaX;
        let newY = Y - e.deltaY;

        if (elementSize.width < containerSize.width) {
            newX = (containerSize.width - elementSize.width) / 2;
        } else
        if (elementSize.width > containerSize.width && (newX < -1 * (elementSize.width - containerSize.width))) {
            newX = -1 * (elementSize.width - containerSize.width);
        } else
        if (newX > 0) {
            newX = 0;
        }

        if (elementSize.height < containerSize.height) {
            newY = (containerSize.height - elementSize.height) / 2;
        } else
        if (elementSize.height > containerSize.height && (newY < -1 * (elementSize.height - containerSize.height))) {
            newY = -1 * (elementSize.height - containerSize.height);
        } else
        if (newY > 0) {
            newY = 0;
        }

        setX(newX);
        setY(newY);
    }, [elementSize, containerSize, X, Y]);

    return {
        ref: containerRef,
        slice: {
            offsetX: offsetX,
            offsetY: offsetY,
            xStart: startX,
            xEnd: Math.min(params.columns, startX + xViewportSize),
            yStart: startY,
            yEnd: Math.min(params.rows, startY + yViewportSize),
        },
        handleWheel,
    };
}