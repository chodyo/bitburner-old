import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { calcMaxProfitFromTrades, pricesWithOnlyUpwardTrends } from "/lib/Stonks";

enum command {
    autosolve = "autosolve",
    find = "find",
    list = "list",

    expr = "expr",
    ip = "ip",
    jump = "jump",
    largestPrimeFactor = "largestPrimeFactor",
    mergeOverlappingIntervals = "mergeOverlappingIntervals",
    sanitizeParens = "sanitizeParens",
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
    ip = "Generate IP Addresses", //                              ✔
    jump = "Array Jumping Game",
    largestPrimeFactor = "Find Largest Prime Factor", //          ✔
    mergeOverlappingIntervals = "Merge Overlapping Intervals", // ✔
    sanitizeParens = "Sanitize Parentheses in Expression",
    spiralize = "Spiralize Matrix", //                            ✔
    stockTraderI = "Algorithmic Stock Trader I", //               ✔
    stockTraderII = "Algorithmic Stock Trader II", //             ✔
    stockTraderIII = "Algorithmic Stock Trader III", //           ✔
    stockTraderIV = "Algorithmic Stock Trader IV", //             ✔
    subArrayWithMaxSum = "Subarray with Maximum Sum",
    triangle = "Minimum Path Sum in a Triangle", //               ✔
    uniqueGridPathsI = "Unique Paths in a Grid I",
    uniqueGridPathsII = "Unique Paths in a Grid II",
    waysToSum = "Total Ways to Sum", //                           ✔
}

class Contract {
    private ns: NS;

    filename: string;
    hostname: string;

    get type(): ContractType {
        return this.ns.codingcontract.getContractType(this.filename, this.hostname) as ContractType;
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
    const flags = ns.flags([
        ["filter", "{}"],
        ["grid", "[0,0]"],
        ["jumps", "[]"],
        ["intervals", "[[]]"],
        ["ip", ""],
        ["matrix", "[[]]"],
        ["n", -1],
        ["stocks", "[]"],
        ["triangle", "[[]]"],
        ["word", "0"],

        ["quiet", false],
    ]);

    const verbose = !flags["quiet"] as boolean;
    const logger = new Logger(ns, { stdout: verbose, enableNSTrace: false });

    switch (flags["_"][0]) {
        case command.find:
        case command.list:
            findAndFilterContracts(ns, flags["filter"] as string).forEach((contract) => {
                logger.info(contract.filename, contract.hostname, contract.type);
            });
            break;

        case command.autosolve: {
            findAndFilterContracts(ns, flags["filter"] as string).forEach((contract) => {
                let answer: number | string[];
                switch (contract.type) {
                    case ContractType.expr: {
                        const word = contract.data[0] as string;
                        const target = contract.data[1] as number;
                        answer = expr(word, target);
                        break;
                    }

                    case ContractType.ip:
                        answer = Array.from(ip(contract.data).keys());
                        break;

                    case ContractType.jump:
                        answer = Number(jump(contract.data));
                        break;

                    case ContractType.largestPrimeFactor:
                        answer = largestPrimeFactor(contract.data);
                        break;

                    case ContractType.mergeOverlappingIntervals:
                        answer = [JSON.stringify(mergeOverlappingIntervals(contract.data))];
                        break;

                    case ContractType.spiralize:
                        answer = [JSON.stringify(spiralize(contract.data))];
                        break;

                    case ContractType.stockTraderI:
                        answer = stockTraderI(contract.data);
                        break;

                    case ContractType.stockTraderII:
                        answer = stockTraderII(contract.data);
                        break;

                    case ContractType.stockTraderIII:
                        answer = stockTraderIII(contract.data);
                        break;

                    case ContractType.stockTraderIV:
                        answer = stockTraderIV(contract.data);
                        break;

                    case ContractType.triangle:
                        answer = triangle(contract.data);
                        break;

                    case ContractType.uniqueGridPathsI:
                        answer = uniqueGridPathsI(contract.data);
                        break;

                    case ContractType.uniqueGridPathsII:
                        answer = uniqueGridPathsII(contract.data);
                        break;

                    case ContractType.waysToSum:
                        answer = waysToSum(contract.data);
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

        case command.expr: {
            const word = flags["word"] as string;
            const target = flags["n"] as number;
            const exprs = expr(word, target);
            logger.info("=>", exprs);
            break;
        }

        case command.ip: {
            const ipStr = flags["ip"] as string;
            const validIPAddresses = ip(ipStr);
            logger.info("=>", ...Array.from(validIPAddresses.keys()));
            break;
        }

        case command.jump: {
            const jumps = JSON.parse(flags["jumps"]) as number[];
            const canReachEnd = jump(jumps);
            logger.info("=>", canReachEnd);
            break;
        }

        case command.largestPrimeFactor: {
            const n = flags["n"] as number;
            logger.info("=>", largestPrimeFactor(n));
            break;
        }

        case command.mergeOverlappingIntervals: {
            const intervals = JSON.parse(flags["intervals"]) as number[][];
            logger.info("=>", mergeOverlappingIntervals(intervals));
            break;
        }

        case command.spiralize: {
            const matrix = JSON.parse(flags["matrix"]) as number[][];
            logger.info("=>", spiralize(matrix));
            break;
        }

        case command.stockTraderI: {
            const stocks = JSON.parse(flags["stocks"]) as number[];
            logger.info("=>", stockTraderI(stocks));
            break;
        }

        case command.stockTraderII: {
            const stocks = JSON.parse(flags["stocks"]) as number[];
            logger.info("=>", stockTraderII(stocks));
            break;
        }

        case command.stockTraderIII: {
            const stocks = JSON.parse(flags["stocks"]) as number[];
            logger.info("=>", stockTraderIII(stocks));
            break;
        }

        case command.stockTraderIV: {
            const stocks = JSON.parse(flags["stocks"]) as number[];
            logger.info("=>", stockTraderIV(stocks));
            break;
        }

        case command.triangle: {
            const triangleArr = JSON.parse(flags["triangle"]) as number[][];
            const minimumPath = triangle(triangleArr);
            logger.info("=>", minimumPath);
            break;
        }

        case command.uniqueGridPathsI: {
            const gridDimensions = JSON.parse(flags["grid"]) as number[];
            const uniquePaths = uniqueGridPathsI(gridDimensions);
            logger.info("=>", uniquePaths);
            break;
        }

        case command.uniqueGridPathsII: {
            const grid = JSON.parse(flags["grid"]) as number[][];
            const uniquePaths = uniqueGridPathsII(grid);
            logger.info("=>", uniquePaths);
            break;
        }

        case command.waysToSum: {
            const target = flags["n"] as number;
            logger.info("=>", waysToSum(target));
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

function expr(word: string, target: number): string[] {
    const operands = word.split("");
    const operators = ["", "+", "-", "*"];

    const leadingZeroRegex = new RegExp(/[-+*]0\d/);

    let accumulatedExprs = [""];
    operands.forEach((operand, i) => {
        accumulatedExprs = accumulatedExprs.flatMap((accumulatedExpr) => {
            return operators.map((operator) => accumulatedExpr + operator + operand);
        });

        if (i === 0) {
            accumulatedExprs = accumulatedExprs.filter((e) => !e.startsWith("*"));
        }
    });

    return accumulatedExprs.filter((e) => !e.match(leadingZeroRegex)).filter((e) => eval(e) === target);
}

function ip(digits: string, octets = 4) {
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
        const parsedRemainder = ip(remainder, octets - 1);
        parsedRemainder.forEach((_bool, remainderCombination) => {
            combinations.set(`${octet}.${remainderCombination}`, true);
        });
    }
    return combinations;
}

function jump(maxJumpLengths: number[]): boolean {
    const reachable = new Array(maxJumpLengths.length).fill(false);
    reachable[0] = true;

    maxJumpLengths.forEach((distance, i) => {
        if (!reachable[i]) return;

        distance = Math.min(distance, reachable.length - 1);
        while (distance > 0) {
            reachable[i + distance--] = true;
        }
    });

    return reachable[reachable.length - 1];
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

function mergeOverlappingIntervals(intervals: number[][]) {
    if (intervals.length < 2 || intervals.some((interval) => interval.length !== 2)) {
        return intervals;
    }

    intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    if (intervals.length === 2) {
        const firstHigh = intervals[0][1];
        const secondLow = intervals[1][0];
        if (firstHigh >= secondLow) {
            const lowestLow = Math.min(intervals[0][0], intervals[1][0]);
            const highestHigh = Math.max(intervals[0][1], intervals[1][1]);
            return [[lowestLow, highestHigh]];
        }
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

/**
 * Sanitize Parentheses in Expression
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given the following string:

((()((a(()(()))(((a

remove the minimum number of invalid parentheses in order to validate the string. If there are multiple minimal ways to validate the string, provide all of the possible results. The answer should be provided as an array of strings. If it is impossible to validate the string the result should be an array with only an empty string.

IMPORTANT: The string may contain letters, not just parentheses. Examples:
"()())()" -> [()()(), (())()]
"(a)())()" -> [(a)()(), (a())()]
")( -> [""]
 */
function sanitizeParens(): string[] {
    return [];
}

function spiralize(matrix: number[][]): number[] {
    if (matrix.length === 0) {
        return [];
    }

    matrix = matrix.filter((row) => row.length > 0);

    const top = matrix.shift() || [];
    const rightEdge = matrix.map((row) => row.pop()).filter(Number.isInteger) as number[];
    const bottom = matrix.pop()?.reverse() || [];
    const leftEdge = matrix
        .map((row) => row.shift())
        .filter(Number.isInteger)
        .reverse() as number[];

    const interior = spiralize(matrix);

    return [...top, ...rightEdge, ...bottom, ...leftEdge, ...interior];
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

/**
 * You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


Given the following integer array, find the contiguous subarray (containing at least one number) which has the largest sum and return that sum. 'Sum' refers to the sum of all the numbers in the subarray.
1,4,5,-2,6,-9,5,-5,7,-9,10,-9,-8
 */
function subArrayWithMaxSum(): number[] {
    return [];
}

function triangle(triangleArr: number[][], depth = 0, i = 0): number {
    if (triangleArr.length === 0 || triangleArr.some((insideArray) => insideArray.length === 0)) {
        return 0;
    }

    if (triangleArr.length - 1 === depth) {
        return triangleArr[depth][i];
    }

    const leftSum = triangle(triangleArr, depth + 1, i);
    const rightSum = triangle(triangleArr, depth + 1, i + 1);
    return triangleArr[depth][i] + Math.min(leftSum, rightSum);
}

function uniqueGridPathsI(gridDimensions: number[]): number {
    const rows = gridDimensions[0],
        cols = gridDimensions[1];

    if (rows < 1 || cols < 1) return 0;

    const grid: number[][] = new Array(rows).fill(undefined).map(() => new Array(cols).fill(0));

    // return uniqueGridPaths_recursive(grid);
    return uniqueGridPaths_iterative(grid);
}

function uniqueGridPathsII(grid: number[][]): number {
    grid = grid.map((row) => row.map((val) => (val === 1 ? -1 : val)));
    return uniqueGridPaths_iterative(grid);
}

function uniqueGridPaths_iterative(grid: number[][]): number {
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
            // start position
            if (x === 0 && y === 0) {
                grid[x][y] = 1;
                continue;
            }

            let above = x === 0 ? 0 : grid[x - 1][y];
            above = above === -1 ? 0 : above;

            let left = y === 0 ? 0 : grid[x][y - 1];
            left = left === -1 ? 0 : left;

            grid[x][y] = grid[x][y] === -1 ? -1 : above + left;
        }
    }

    const rows = grid.length;
    const cols = grid[rows - 1].length;
    return grid[rows - 1][cols - 1];
}

function uniqueGridPaths_recursive(grid: number[][]): number {
    if (grid.length === 1 || grid.some((row) => row.length === 1)) return 1;

    const down = uniqueGridPaths_recursive(grid.slice(1));
    const right = uniqueGridPaths_recursive(grid.map((row) => row.slice(1)));

    return down + right;
}

function waysToSum(target: number): number {
    if (target < 1) return 0;

    // [1, 2, ..., target-1]
    // these are like the coin denominations i can use to reach a specified cash target
    const operands = Array(target - 1)
        .fill(undefined)
        .map((_, i) => i + 1);
    // if we wanted coins, we could use this instead
    // const operands = [1, 5, 10, 25];

    // fill [0, 1, 2, ..., target-1, target] with 0's
    const results: number[] = Array(target + 1).fill(0);
    // target=1 has 1 way to sum. store result in [target] spot of array
    results[0] = 1;

    operands.forEach((operand) => {
        results.forEach((_, j) => {
            // i don't care about 0, i just kept it in to line up index with target
            if (j === 0) return 0;

            results[j] += j < operand ? 0 : results[j - operand];
        });
    });

    // return results;
    return results[target];
}
