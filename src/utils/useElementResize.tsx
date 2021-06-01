import { RefObject, useState, useEffect } from "react";

export interface IDimensions {
    width: number;
    height: number;
}

function getDimensions(ref: HTMLElement) {
    return {
        width: ref.clientWidth,
        height: ref.clientHeight,
    };
}

export default function useElementResize(ref: RefObject<HTMLElement>): IDimensions {
    const [elementSize, setElementSize] = useState<IDimensions>({ width: 800, height: 600 });

    useEffect(() => {
        const dims = getDimensions(ref.current!);
        setElementSize(dims);

        const handler = () => {
            const dims = getDimensions(ref.current!);
            setElementSize(dims);
        };

        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return elementSize;
}