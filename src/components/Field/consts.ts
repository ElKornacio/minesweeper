export const cellSize = 30;

export const CELL_EMPTY = 255;
export const CELL_CLOSED = 254;
export const CELL_MINE = 253;
export const CELL_EXPLODED = 252;
export const CELL_FLAG = 251;
export const CELL_FLAG_WRONG = 250;

export const CELL_CLASS: Record<number, string> = {
    1: 'm1',
    2: 'm2',
    3: 'm3',
    4: 'm4',
    5: 'm5',
    6: 'm6',
    7: 'm7',
    8: 'm8',

    [CELL_EMPTY]: 'empty',
    [CELL_CLOSED]: 'closed',
    [CELL_MINE]: 'mine',
    [CELL_EXPLODED]: 'exploded',
    [CELL_FLAG]: 'flag',
    [CELL_FLAG_WRONG]: 'flag-wrong',
}