// ! 25.00GB | document (dom)

export function workingRepEarned() {
    const focused = workingEarnedRate()[0];
    if (focused) return focused;

    const background = document.body.textContent?.match(/Working for .*\+([0-9\\.kmbt]*)/);
    if (!background || background.length < 2) return 0;
    return parseNumberWithSuffix(background[1]);
}

export function workingRepRate() {
    return workingEarnedRate()[1];
}

function workingEarnedRate() {
    const regex =
        /You have earned: .*? ([0-9\\.kmbt]*) \(([0-9\\.kmbt]*) \/ sec\) reputation for this (company|faction)/;
    const focused = document.body.textContent?.match(regex);
    if (!focused || focused.length < 4) return [0, 0];
    return [parseNumberWithSuffix(focused[1]), parseNumberWithSuffix(focused[2])];
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
