// todo: make these also able to handle non-focus

export function workingRepTotal() {
    return workingRepCurrent() + workingRepEarned();
}

export function workingRepCurrent() {
    const match = document.body.textContent?.match(/Current (Company|Faction) Reputation: ([0-9\\.kmbt]*)/);
    if (!match || match.length < 2) return 0;
    return parseNumberWithSuffix(match[2]);
}

export function workingRepEarned() {
    return workingEarnedRate()[0];
}

export function workingRepRate() {
    return workingEarnedRate()[1];
}

function workingEarnedRate() {
    const regex =
        /You have earned: .*? ([0-9\\.kmbt]*) \(([0-9\\.kmbt]*) \/ sec\) reputation for this (company|faction)/;
    const match = document.body.textContent?.match(regex);
    if (!match || match.length < 4) return [0, 0];
    return [parseNumberWithSuffix(match[1]), parseNumberWithSuffix(match[2])];
}

function parseNumberWithSuffix(x: string): number {
    if (x.length === 0) return 0;

    const numberPart = parseFloat(x.slice(0, x.length - 1));
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
            return parseFloat(x);
    }
    return numberPart * multiplier;
}
