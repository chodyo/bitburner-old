import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { calcMaxProfitFromTrades, pricesWithOnlyUpwardTrends } from "/lib/Stonks";

enum command {
    find = "find",
    autosolve = "autosolve",

    expr = "expr",
    exprParen = "exprParen",
    ip = "ip",
    jump = "jump",
    largestPrimeFactor = "largestPrimeFactor",
    mergeOverlappingIntervals = "mergeOverlappingIntervals",
    spiralize = "spiralize",
    stockTraderI = "stockTraderI",
    stockTraderII = "stockTraderII",
    stockTraderIII = "stockTraderIII",
    stockTraderIV = "stockTraderIV",
    subArrayWithMaxSum = "subArrayWithMaxSum",
    triangle = "triangle",
    uniqueGridPathsI = "uniqueGridPathsI",
    uniqueGridPathsII = "uniqueGridPathsII",
    waysToSum = "waysToSum",
}

enum ContractType {
    expr = "Find All Valid Math Expressions",
    exprParen = "Sanitize Parentheses in Expression",
    ip = "Generate IP Addresses", //                              ✔
    jump = "Array Jumping Game",
    largestPrimeFactor = "Find Largest Prime Factor", //          ✔
    mergeOverlappingIntervals = "Merge Overlapping Intervals", // ✔
    spiralize = "Spiralize Matrix",
    stockTraderI = "Algorithmic Stock Trader I", //               ✔
    stockTraderII = "Algorithmic Stock Trader II", //             ✔
    stockTraderIII = "Algorithmic Stock Trader III", //           ✔
    stockTraderIV = "Algorithmic Stock Trader IV", //             ✔
    subArrayWithMaxSum = "Subarray with Maximum Sum",
    triangle = "Minimum Path Sum in a Triangle", //               ✔
    uniqueGridPathsI = "Unique Paths in a Grid I",
    uniqueGridPathsII = "Unique Paths in a Grid II",
    waysToSum = "Total Ways to Sum",
}

class Contract {
    private ns: NS;

    filename: string;
    hostname: string;

    get type(): ContractType {
        return this.ns.codingcontract.getContractType(this.filename, this.hostname) as ContractType;
        // return Object.keys(ContractType)[Object.values(ContractType).indexOf(desc)];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get data(): any {
        return this.ns.codingcontract.getData(this.filename, this.hostname);
    }

    get description(): string {
        return this.ns.codingcontract.getDescription(this.filename, this.hostname);
    }

    get numTriesRemaining(): number {
        return this.ns.codingcontract.getNumTriesRemaining(this.filename, this.hostname);
    }

    constructor(ns: NS, filename: string, hostname: string) {
        this.ns = ns;
        this.filename = filename;
        this.hostname = hostname;
    }

    toString() {
        return JSON.stringify({
            filename: this.filename,
            hostname: this.hostname,
            type: this.type,
            data: this.data,
            numTriesRemaining: this.numTriesRemaining,
        });
    }

    attempt(answer: number | string[]) {
        return this.ns.codingcontract.attempt(answer, this.filename, this.hostname, { returnReward: true });
    }
}

type Filters = {
    type?: ContractType;
    faction?: string;
};

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true, enableNSTrace: true });

    const flags = ns.flags([
        ["filter", "{}"],
        ["ip", ""],
        ["n", -1],
        ["triangle", "[[]]"],
        ["stocks", "[]"],
        ["intervals", "[[]]"],
    ]);

    switch (flags["_"][0]) {
        case command.find: {
            findAndFilterContracts(ns, flags["filter"] as string).forEach((contract) => {
                logger.info(contract.filename, contract.hostname, contract.type);
            });
            break;
        }

        case command.autosolve: {
            findAndFilterContracts(ns, flags["filter"] as string).forEach((contract) => {
                const data = contract.data;
                let answer: number | string[];
                switch (contract.type) {
                    case "Generate IP Addresses":
                        answer = Array.from(recurseToConvertStringToIPs(data).keys());
                        break;

                    case "Minimum Path Sum in a Triangle":
                        answer = recurseToFindMinimumPathSumInATriangle(data);
                        break;

                    case "Find Largest Prime Factor":
                        answer = largestPrimeFactor(data);
                        break;

                    case "Algorithmic Stock Trader I":
                        answer = stockTraderI(data);
                        break;

                    case "Algorithmic Stock Trader II":
                        answer = stockTraderII(data);
                        break;

                    case "Algorithmic Stock Trader III":
                        answer = stockTraderIII(data);
                        break;

                    case "Algorithmic Stock Trader IV":
                        answer = stockTraderIV(data);
                        break;

                    case "Merge Overlapping Intervals":
                        answer = [JSON.stringify(mergeOverlappingIntervals(data))];
                        break;

                    default:
                        return;
                }
                logger.info("attempting to solve", contract.toString(), answer);
                const result = contract.attempt(answer);
                if (result) logger.info("result", result);
                else logger.alert(`failed to solve ${contract}`);
            });
            break;
        }

        case command.ip: {
            const ip = flags["ip"] as string;
            const validIPAddresses = recurseToConvertStringToIPs(ip);
            logger.info("=>", ...Array.from(validIPAddresses.keys()));
            break;
        }

        case command.triangle: {
            const triangle = JSON.parse(flags["triangle"] as string);
            const minimumPath = recurseToFindMinimumPathSumInATriangle(triangle);
            logger.info("=>", minimumPath);
            break;
        }

        case command.largestPrimeFactor: {
            const n = flags["n"] as number;
            logger.info("=>", largestPrimeFactor(n));
            break;
        }

        case command.stockTraderI: {
            const stocks = JSON.parse(flags["stocks"]);
            logger.info("=>", stockTraderI(stocks));
            break;
        }

        case command.stockTraderII: {
            const stocks = JSON.parse(flags["stocks"]);
            logger.info("=>", stockTraderII(stocks));
            break;
        }

        case command.stockTraderIII: {
            const stocks = JSON.parse(flags["stocks"]);
            logger.info("=>", stockTraderIII(stocks));
            break;
        }

        case command.stockTraderIV: {
            const stocks = JSON.parse(flags["stocks"]);
            logger.warn("stocks", stocks);
            logger.info("=>", stockTraderIV(stocks));
            break;
        }

        case command.mergeOverlappingIntervals: {
            const stocks = JSON.parse(flags["intervals"]);
            logger.info("=>", mergeOverlappingIntervals(stocks));
            break;
        }

        default:
            logger.warn("not sure what you meant. valid commands are");
            (Object.values(command).filter((cmd) => typeof cmd === "string") as string[]).forEach((cmd) => {
                logger.warn(cmd);
            });
            logger.warn("flags", flags);
            return;
    }
}

function findAndFilterContracts(ns: NS, filter: string) {
    const filters: Filters = JSON.parse(filter);
    const contracts = recursivelyFindContracts(ns, "home");

    // e.g. "stockTraderIV"
    const typeFilterAsKey = filters.type ? ContractType[filters.type]?.toLowerCase() : undefined;
    // e.g. "Algorithmic Stock Trader IV"
    const typeFilterAsValue = filters.type ? filters.type.toLowerCase() : undefined;

    // e.g. "ecorp"
    const factionFilter = filters.faction ? filters.faction : undefined;
    const factionRegexp = new RegExp(`^contract-[0-9]+-?${factionFilter}\\.cct$`, "i");

    return contracts
        .filter((contract) => {
            if (!typeFilterAsKey && !typeFilterAsValue) return true;
            return [typeFilterAsKey, typeFilterAsValue].includes(contract.type.toLowerCase());
        })
        .filter((contract) => {
            if (!factionFilter) return true;
            return contract.filename.match(factionRegexp);
        });
}

function recursivelyFindContracts(ns: NS, hostname: string, checkedHosts = new Map<string, boolean>()) {
    if (checkedHosts.get(hostname)) {
        return [];
    }
    checkedHosts.set(hostname, true);

    const contracts = ns.ls(hostname, ".cct").map((filename) => new Contract(ns, filename, hostname));

    ns.scan(hostname).forEach((connectedHost) => {
        contracts.push(...recursivelyFindContracts(ns, connectedHost, checkedHosts));
    });

    return contracts;
}

/**
 * e.g. 25525511135 -> [255.255.11.135, 255.255.111.35]
 * @param digits The string that should be converted to an IP
 * @param octets The number of octets that digits contains; decrement this number when calling recursively
 */
function recurseToConvertStringToIPs(digits: string, octets = 4) {
    const combinations = new Map<string, boolean>();

    // shortcuts :)
    const tooLong = digits.length > 12;
    const validChars = /^\d+$/.test(digits);
    if (tooLong || !validChars) {
        return combinations;
    }

    // octets in an IP address range from 0..255
    const maxOctetVal = 2 ** 8;
    // each octet can be up to 3 digits
    const expectedLength = 3 * octets;
    const actualLength = digits.length;
    // each octet can have 0..2 leading 0s
    const leadingZeroes = Math.min(expectedLength - actualLength, 2);

    for (let i = 0; i <= leadingZeroes; i++) {
        const padDigits = digits.padStart(i + actualLength, "0");
        const octet = parseInt(padDigits.slice(0, 3));
        const remainder = padDigits.slice(3);

        // disqualifiers
        const octetStartedWith0 = digits.startsWith("0");
        const octetValueOutOfRange = octet >= maxOctetVal;
        const finalOctetShouldntHaveRemainder = octets === 1 && remainder !== "";
        const nonfinalOctetMustHaveRemainder = octets > 1 && remainder === "";
        if (
            octetStartedWith0 ||
            octetValueOutOfRange ||
            finalOctetShouldntHaveRemainder ||
            nonfinalOctetMustHaveRemainder
        ) {
            continue;
        }

        // base case
        if (octets === 1) {
            combinations.set(octet.toString(), true);
            continue;
        }

        // non-base
        const parsedRemainder = recurseToConvertStringToIPs(remainder, octets - 1);
        parsedRemainder.forEach((_bool, remainderCombination) => {
            combinations.set(`${octet}.${remainderCombination}`, true);
        });
    }
    return combinations;
}

function recurseToFindMinimumPathSumInATriangle(triangle: number[][], depth = 0, i = 0): number {
    if (triangle.length === 0 || triangle.some((insideArray) => insideArray.length === 0)) {
        return 0;
    }

    if (triangle.length - 1 === depth) {
        return triangle[depth][i];
    }

    const leftSum = recurseToFindMinimumPathSumInATriangle(triangle, depth + 1, i);
    const rightSum = recurseToFindMinimumPathSumInATriangle(triangle, depth + 1, i + 1);
    return triangle[depth][i] + Math.min(leftSum, rightSum);
}

function largestPrimeFactor(n: number) {
    const factors: number[] = [];
    let d = 2;
    while (n > 1) {
        while (n % d === 0) {
            factors.push(d);
            n /= d;
        }
        d++;
        if (d * d > n) {
            if (n > 1) {
                factors.push(n);
            }
            break;
        }
    }
    return factors.sort((a, b) => a - b).pop() || 0;
}

function stockTraderI(data: number[]) {
    const trends = pricesWithOnlyUpwardTrends(data);
    const tradesRemaining = 1;
    return calcMaxProfitFromTrades(trends, tradesRemaining);
}

function stockTraderII(data: number[]) {
    const trends = pricesWithOnlyUpwardTrends(data);
    const tradesRemaining = Infinity;
    return calcMaxProfitFromTrades(trends, tradesRemaining);
}

function stockTraderIII(data: number[]) {
    const trends = pricesWithOnlyUpwardTrends(data);
    const tradesRemaining = 2;
    return calcMaxProfitFromTrades(trends, tradesRemaining);
}

function stockTraderIV(data: unknown[]) {
    const tradesRemaining = data[0] as number;
    const prices = data[1] as number[];
    const trends = pricesWithOnlyUpwardTrends(prices);
    return calcMaxProfitFromTrades(trends, tradesRemaining);
}

function mergeOverlappingIntervals(intervals: number[][]) {
    if (intervals.length < 2 || intervals.some((interval) => interval.length !== 2)) {
        return intervals;
    }

    intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    if (intervals.length === 2) {
        const firstHigh = intervals[0][1];
        const secondLow = intervals[1][0];
        if (firstHigh >= secondLow) return [[intervals[0][0], intervals[1][1]]];
        return intervals;
    }

    const merged: number[][] = [];

    for (let i = 1; i < intervals.length; i++) {
        const first = merged.pop() || intervals[0];
        const second = intervals[i];
        merged.push(...mergeOverlappingIntervals([first, second]));
    }

    return merged;
}
