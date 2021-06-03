import React, { useEffect, useState } from "react";
import IGameParams from "../../types/IGameParams";
import DigitsCounter from "../DigitsCounter";
import FaceButton from "../FaceButton";

export interface IHeaderProps {
    loading: boolean;
    params: IGameParams;
    gameId: string;
    gameState: 'none' | 'win' | 'lose';
    onNewGame: (newParams: IGameParams) => void;
    minesLeft: number;
}

export default function Header(props: IHeaderProps) {
    const [time, setTime] = useState(0);

    // timer tick
    useEffect(() => {
        let timer: any = null;
        if (props.gameState === 'none') {
            timer = setTimeout(() => setTime(time + 1), 1000);
        }
        return () => (timer ? clearTimeout(timer) : void 0);
    }, [time, props.gameState]);

    // reset timer on new game
    useEffect(() => {
        if (props.gameState === 'none') {
            setTime(0);
        }
    }, [props.gameId, props.gameState])

    return (
        <div className="header">
            <div className="time">
                <DigitsCounter value={time} />
            </div>
            <div className="restart">
                <FaceButton
                    loading={props.loading}
                    state={props.gameState === 'none' ? "unpressed" : props.gameState}
                    onClick={() => {
                        const [columnsS, rowsS, minesS] = prompt(
                            'Введите параметры через запятую: Columns,Rows,Mines',
                            `${props.params.columns},${props.params.rows},${props.params.mines}`
                        )!.split(',');
                        props.onNewGame({
                            columns: Number(columnsS),
                            rows: Number(rowsS),
                            mines: Number(minesS)
                        });
                    }}
                />
            </div>
            <div className="mines-left">
                <DigitsCounter value={props.minesLeft} />
            </div>
        </div>
    )
}