export const cellSize = 30;

export const CELL_EMPTY = 255;
export const CELL_CLOSED = 254;
export const CELL_MINE = 253;
export const CELL_EXPLODED = 252;
export const CELL_FLAG = 251;
export const CELL_FLAG_WRONG = 250;

export const CELL_CLASS: Record<number, string> = {
    0: 'closed',
    1: 'closed',
    2: 'closed',
    3: 'closed',
    4: 'closed',
    5: 'closed',
    6: 'closed',
    7: 'closed',
    8: 'closed',
    9: 'half-mine',

    10: 'empty',
    11: 'm1',
    12: 'm2',
    13: 'm3',
    14: 'm4',
    15: 'm5',
    16: 'm6',
    17: 'm7',
    18: 'm8',
    19: 'mine',

    20: 'flag',
    21: 'flag',
    22: 'flag',
    23: 'flag',
    24: 'flag',
    25: 'flag',
    26: 'flag',
    27: 'flag',
    28: 'flag',
    29: 'flag',

    [CELL_EMPTY]: 'empty',
    [CELL_CLOSED]: 'closed',
    [CELL_MINE]: 'mine',
    [CELL_EXPLODED]: 'exploded',
    [CELL_FLAG]: 'flag',
    [CELL_FLAG_WRONG]: 'flag-wrong',
}