import { useState, useCallback } from "react";

import { newColorizeField } from "../utils/colorizeField";
import { newGenerateField } from "../utils/generateField";

import ColorizationPromise from "../types/ColorizationPromise";
import IGameParams from "../types/IGameParams";

import useKeyboard from "./useKeyboard";

async function getGame(params: IGameParams) {
    const id = Math.floor(Math.random() * 100000000) + 's';
    const { buffer, field, emptySubstitute } = await newGenerateField(params);
    return {
        params: params,
        field: { buffer, data: field },
        emptySubstitute,
        colors: newColorizeField(buffer, params)
    };
}

export default function useMinesweeper() {
    const [gameId, setGameId] = useState('1');
    const [params, setParams] = useState({ columns: 10, rows: 10, mines: 10 });

    const [flagsCount, setFlagsCount] = useState(0);
    const [gameState, setGameState] = useState<'none' | 'lose' | 'win'>('none');

    const [field, setField] = useState<Uint8Array | null>(null);
    const [emptySubstitute, setEmptySubstitute] = useState<number | null>(null);
    const [colorizationPromise, setColorizationPromise] = useState<ColorizationPromise | null>(null);

    const [loading, setLoading] = useState(false);

    const newGame = useCallback(async function (newParams: IGameParams) {
        setLoading(true);
        const newGame = await getGame(newParams);
        setLoading(false);

        setParams(newParams);
        setFlagsCount(0);
        setField(newGame.field.data);

        setColorizationPromise(newGame.colors);
        setEmptySubstitute(newGame.emptySubstitute);
        setGameState('none');
        setGameId(Math.floor(Math.random() * 10000000) + 's');
    }, []);

    const addFlag = useCallback(() => {
        setFlagsCount(flagsCount + 1);
    }, [flagsCount]);

    const removeFlag = useCallback(() => {
        setFlagsCount(flagsCount - 1);
    }, [flagsCount]);

    useKeyboard(useCallback((e) => {
        if (e.key === ' ') {
            e.preventDefault();
            newGame({ ...params });
        }
    }, [params]));

    return {
        actions: {
            newGame,
            addFlag,
            removeFlag,
            setField,
            setGameState,
        },
        state: {
            gameId,
            params,
            flagsCount,
            gameState,
            field,
            colorizationPromise,
            emptySubstitute,
            loading
        },
    };
}