export interface IFieldSmallSlice {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
}

export default interface IFieldSlice extends IFieldSmallSlice {
    offsetX: number;
    offsetY: number;
}