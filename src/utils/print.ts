import ColorsArray from "../types/ColorsArray";
import FieldArray from "../types/FieldArray";
import IGameParams from "../types/IGameParams";

export function printMatrix(params: IGameParams, matrix: ArrayLike<number>) {
    for (let y = 0; y < params.rows; y++) {
        let s = '';
        for (let x = 0; x < params.columns; x++) {
            s += matrix[x * params.columns + y] + ' ';
        }
        console.log(s);
    }
}

export function printField(params: IGameParams, field: FieldArray) {
    return printMatrix(params, field);
}

export function printColors(params: IGameParams, colors: ColorsArray) {
    return printMatrix(params, colors);
}