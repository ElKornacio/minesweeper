import { useEffect } from "react";

export default function useKeyboard(handler: (e: KeyboardEvent) => void) {
    useEffect(() => {
        document.body.addEventListener('keydown', handler);
        return () => document.body.removeEventListener('keydown', handler);
    }, [handler]);
}