export default interface IPowerOnData {
    offset: number;
    sliceSize: number;
    fieldBuffer: SharedArrayBuffer;
    minesIndexesBuffer: SharedArrayBuffer;
    emptiesIndexesBuffer: SharedArrayBuffer;
    resultsBuffer: SharedArrayBuffer;
}