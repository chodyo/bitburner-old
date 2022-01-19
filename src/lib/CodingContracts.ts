import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

enum command {
    find,
    autosolve,
    ip,
    triangle,
    largestPrimeFactor,
    stockTraderI,
}
function stringToCommand(o: string | number | boolean): command {
    return command[o.toString() as keyof typeof command];
}

const contractTypes = [
    "Algorithmic Stock Trader I", //        ✔
    "Algorithmic Stock Trader II",
    "Algorithmic Stock Trader III",
    "Algorithmic Stock Trader IV",
    "Array Jumping Game",
    "Find All Valid Math Expressions",
    "Find Largest Prime Factor", //         ✔
    "Generate IP Addresses", //             ✔
    "Merge Overlapping Intervals",
    "Minimum Path Sum in a Triangle", //    ✔
    "Sanitize Parentheses in Expression",
    "Spiralize Matrix",
    "Subarray with Maximum Sum",
    "Total Ways to Sum",
    "Unique Paths in a Grid I",
    "Unique Paths in a Grid II",
] as const;
type ContractType = typeof contractTypes[number];
function isContractType(maybeContractType: unknown): boolean {
    return !!contractTypes.find((validContractType) => validContractType === maybeContractType);
}

class Contract {
    private ns: NS;

    filename: string;
    hostname: string;

    get type(): ContractType {
        const contractTypeStr: unknown = this.ns.codingcontract.getContractType(this.filename, this.hostname);
        if (isContractType(contractTypeStr)) {
            return <ContractType>contractTypeStr;
        }
        throw new Error(`invalid contract type=${contractTypeStr}`);
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

    switch (stringToCommand(ns.args[0])) {
        case command.find: {
            findAndFilterContracts(ns).forEach((contract) => {
                logger.info(contract.filename, contract.hostname, contract.type);
            });
            break;
        }

        case command.autosolve: {
            findAndFilterContracts(ns).forEach((contract) => {
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

                    default:
                        return;
                }
                logger.info("attempting to solve", contract.type, answer, contract.filename, contract.hostname);
                const result = contract.attempt(answer);
                if (result) logger.info("result", result);
                else logger.error("failed to solve, only have this many tries left", contract.numTriesRemaining);
            });
            break;
        }

        case command.ip: {
            const arg = ns.args[1].toString();
            const validIPAddresses = recurseToConvertStringToIPs(arg);
            logger.info("=>", ...Array.from(validIPAddresses.keys()));
            break;
        }

        case command.triangle: {
            const arg = JSON.parse(ns.args[1].toString());
            const minimumPath = recurseToFindMinimumPathSumInATriangle(arg);
            logger.info("=>", minimumPath);
            break;
        }

        case command.largestPrimeFactor: {
            const n = typeof ns.args[1] === "number" ? ns.args[1] : parseInt(ns.args[1].toString());
            logger.info("=>", largestPrimeFactor(n));
            break;
        }

        case command.stockTraderI: {
            const arg = JSON.parse(ns.args[1].toString());
            logger.info("=>", stockTraderI(arg));
            break;
        }

        default:
            logger.warn("not sure what you meant. valid commands are");
            (Object.values(command).filter((cmd) => typeof cmd === "string") as string[]).forEach((cmd) => {
                logger.warn(cmd);
            });
            return;
    }
}

function findAndFilterContracts(ns: NS) {
    const filters: Filters = ns.args.length > 1 ? JSON.parse(ns.args[1]?.toString()) : {};
    const checkedHosts = new Map<string, boolean>();
    const contracts: Map<string, Contract> = recursivelyFindContracts(ns, "home", checkedHosts);

    if (filters?.type && filters.type !== undefined) {
        contracts.forEach((v, k, m) => {
            if (v.type !== filters.type) {
                m.delete(k);
            }
        });
    }

    // empty string indicates contract not associated with any faction
    const factionFilter = filters?.faction?.toLowerCase();
    if (factionFilter || factionFilter === "") {
        const regexp = /^contract-[0-9]+-?(.*)\.cct$/;
        contracts.forEach((v, k, m) => {
            const factionExecArray = regexp.exec(v.filename);
            if (factionExecArray?.at(1)?.toLowerCase() === factionFilter) {
                return;
            }
            m.delete(k);
        });
    }

    return contracts;
}

function recursivelyFindContracts(ns: NS, hostname: string, checkedHosts: Map<string, boolean>) {
    const contracts = new Map<string, Contract>();

    if (checkedHosts.get(hostname)) {
        return contracts;
    }
    checkedHosts.set(hostname, true);

    ns.ls(hostname, ".cct").forEach((filename) => {
        // const contractTypeStr: unknown = ns.codingcontract.getContractType(filename, hostname);
        // if (!isContractType(contractTypeStr)) {
        //     logger.warn("found unexpected contract type", contractTypeStr);
        // }
        contracts.set(`${filename}_${hostname}`, new Contract(ns, filename, hostname));
    });

    ns.scan(hostname).forEach((connectedHost) => {
        recursivelyFindContracts(ns, connectedHost, checkedHosts).forEach((contract, key) => {
            contracts.set(key, contract);
        });
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
        const octetValueOutOfRange = octet >= maxOctetVal;
        const finalOctetShouldntHaveRemainder = octets === 1 && remainder !== "";
        const nonfinalOctetMustHaveRemainder = octets > 1 && remainder === "";
        if (octetValueOutOfRange || finalOctetShouldntHaveRemainder || nonfinalOctetMustHaveRemainder) {
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

function recurseToFindMinimumPathSumInATriangle(triangle: number[][], depth = 0, i = 0) {
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

// todo: possible optimization = remove downward trending prices
function stockTraderI(prices: number[]) {
    if (prices.length < 2) {
        return 0;
    }

    let l = 0,
        low = prices[l],
        h = 0,
        high = low;

    prices.forEach((price, i) => {
        if (price < low) {
            low = price;
            l = i;
        }
        if (price > high) {
            high = price;
            h = i;
        }
    });

    if (l < h) {
        return high - low;
    }

    const pricesWithoutLow = [...prices.slice(0, l), ...prices.slice(l + 1)];
    const pricesWithoutHigh = [...prices.slice(0, h), ...prices.slice(h + 1)];
    return Math.max(stockTraderI(pricesWithoutLow), stockTraderI(pricesWithoutHigh));
}
