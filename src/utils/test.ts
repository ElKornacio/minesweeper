export default function intersectDates(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    if (aStart > bEnd || bStart > aEnd) {
        return false;
    } else {
        return true;
    }
}