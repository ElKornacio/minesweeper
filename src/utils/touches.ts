import IGameParams from "../types/IGameParams";

export const touchCell = (params: IGameParams, x2: number, y2: number, callback: (x: number, y: number) => void) => {
    if (x2 >= 0 && y2 >= 0 && x2 < params.columns && y2 < params.rows) {
        callback(x2, y2);
    }
};

const touchAround = (params: IGameParams, x: number, y: number, callback: (x: number, y: number) => void, withItself: boolean = false) => {
    touchCell(params, x - 1, y - 1, callback);
    touchCell(params, x, y - 1, callback);
    touchCell(params, x + 1, y - 1, callback);

    touchCell(params, x - 1, y, callback);
    touchCell(params, x + 1, y, callback);

    touchCell(params, x - 1, y + 1, callback);
    touchCell(params, x, y + 1, callback);
    touchCell(params, x + 1, y + 1, callback);

    if (withItself) {
        touchCell(params, x, y, callback);
    }
}

export const calcAround = (params: IGameParams, x: number, y: number, callback: (x: number, y: number) => number, withItself: boolean = false) => {
    let c = 0;
    touchAround(params, x, y, (x1, y1) => c += callback(x1, y1), withItself);
    return c;
}

export default touchAround;