export default function getRandomIndexes(length: number, amount: number): number[] {
    if (amount > length) {
        throw new Error('Cant generate more unique indexes than array length');
    }
    const randomIndexes: number[] = [];
    for (let i = 0; i < amount; i++) {
        let ri;
        while (randomIndexes.includes(ri = Math.floor(Math.random() * length))) {
        }
        randomIndexes.push(ri);
    }
    return randomIndexes;
}