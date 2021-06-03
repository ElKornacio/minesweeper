import classNames from "classnames";
import { useEffect, useState } from "react";
import IGameParams from "../../types/IGameParams";

import './style.scss';

export interface IParamsModalProps {
    visible: boolean;
    
    params: IGameParams;
    onNewParams: (params: IGameParams) => void;
}

const checkNumber = (x: string) => !isNaN(Number(x)) && Number(x) > 0;

export default function ParamsModal({ visible, params, onNewParams }: IParamsModalProps) {
    const [columns, setColumns] = useState(String(params.columns));
    const [rows, setRows] = useState(String(params.rows));
    const [mines, setMines] = useState(String(params.mines));

    useEffect(() => {
        setColumns(String(params.columns));
        setRows(String(params.rows));
        setMines(String(params.mines));
    }, [params])

    return (
        <div className={classNames('params-modal-backdrop', { visible })}>
            <div className="params-modal">
                <h3>New game:</h3>
                <div className="field-row">
                    <label>Columns:</label>
                    <input type="number" value={columns} onChange={e => setColumns(e.target.value)} />
                </div>
                <div className="field-row">
                    <label>Rows:</label>
                    <input type="number" value={rows} onChange={e => setRows(e.target.value)} />
                </div>
                <div className="field-row">
                    <label>Mines:</label>
                    <input type="number" value={mines} onChange={e => setMines(e.target.value)} />
                </div>
                <div className="field-row">
                    <button onClick={e => {
                        e.preventDefault();
                        if (!checkNumber(columns) || !checkNumber(rows) || !checkNumber(mines)) {
                            return alert('All numbers must be valid and > 1');
                        }
                        const c = Number(columns);
                        const r = Number(rows);
                        const m = Number(mines);
                        if (c < 2 || r < 2 || c > 10000 || r > 10000) {
                            return alert('Both columns and rows must be between 2 and 10000');
                        }
                        if (m >= c * r - 1) {
                            return alert('Amount of mines must be less than field size and one empty cell must exist (m < c * r - 1)');
                        }
                        onNewParams({
                            columns: c,
                            rows: r,
                            mines: m,
                        })
                    }}>OK!</button>
                </div>
            </div>
        </div>
    )
}