export function concat8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalSize = arrays.map(v => v.length).reduce((p, c) => p + c, 0);
    const n = new Uint8Array(totalSize);
    let offset = 0;
    for (let arr of arrays) {
        n.set(arr, offset);
        offset += arr.length;
    }
    return n;
}

export function concat32Arrays(arrays: Uint32Array[], overhead: number): Uint32Array {
    const totalSize = arrays.map(v => v.length).reduce((p, c) => p + c, 0);
    const n = new Uint32Array(totalSize + overhead);
    let offset = 0;
    for (let arr of arrays) {
        n.set(arr, offset);
        offset += arr.length;
    }
    return n;
}