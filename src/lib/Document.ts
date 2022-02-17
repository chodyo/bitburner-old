export function workingRepTotal() {
    return workingRepCurrent() + workingRepEarned();
}

export function workingRepCurrent() {
    const currentIdx = 0;
    return workingRep(currentIdx);
}

export function workingRepEarned() {
    const earnedIdx = 1;
    return workingRep(earnedIdx);
}

export function workingRepRate() {
    const rateIdx = 2;
    return workingRep(rateIdx);
}

function workingRep(i: number): number {
    const elements = document.getElementsByClassName("jss17465");
    if (elements.length === 0 || !elements[i]) return 0;

    const text = elements[i].innerHTML;
    return parseNumberWithSuffix(text);
}

function parseNumberWithSuffix(x: string): number {
    if (x.length === 0) return 0;

    const n = parseInt(x);
    if (!isNaN(n)) return n;

    const numberPart = parseInt(x.slice(0, x.length - 1));
    const suffix = x.charAt(x.length - 1);
    let multiplier = 1;
    switch (suffix) {
        case "k":
            multiplier = 1e3;
            break;
        case "m":
            multiplier = 1e6;
            break;
        case "b":
            multiplier = 1e9;
            break;
        case "t":
            multiplier = 1e12;
            break;
        default:
            return parseInt(x);
    }
    return numberPart * multiplier;
}
