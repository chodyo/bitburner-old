import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

const contractTypes = [
    "Algorithmic Stock Trader I",
    "Algorithmic Stock Trader II",
    "Algorithmic Stock Trader III",
    "Algorithmic Stock Trader IV",
    "Array Jumping Game",
    "Find All Valid Math Expressions",
    "Find Largest Prime Factor",
    "Generate IP Addresses",
    "Merge Overlapping Intervals",
    "Minimum Path Sum in a Triangle",
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get description(): string {
        return this.ns.codingcontract.getDescription(this.filename, this.hostname);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    attempt(answer: string[]) {
        return this.ns.codingcontract.attempt(answer, this.filename, this.hostname, { returnReward: true });
    }
}

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true, enableNSTrace: true });

    const command = ns.args[0];
    switch (command) {
        case "find": {
            const typeFilter = ns.args[1]?.toString();
            findAndFilterContracts(ns, typeFilter).forEach((contract) => {
                logger.info(contract.filename, contract.hostname, contract.type);
            });
            break;
        }
        case "autosolve": {
            findAndFilterContracts(ns, "Generate IP Addresses").forEach((ipContract) => {
                const answer = Array.from(recurseToConvertStringToIPs(ipContract.data).keys());
                logger.trace("attempting to autosolve", ipContract.toString(), "answer", answer);
                logger.info("result", ipContract.attempt(answer));
            });

            break;
        }
        case "ip": {
            const arg = ns.args[1].toString();
            const validIPAddresses = recurseToConvertStringToIPs(arg);
            logger.info("=>", ...Array.from(validIPAddresses.keys()));
            break;
        }
        default:
            logger.warn("not sure what you mean");
            return;
    }
}

function findAndFilterContracts(ns: NS, typeFilter?: string) {
    const checkedHosts = new Map<string, boolean>();
    const contracts: Map<string, Contract> = recursivelyFindContracts(ns, "home", checkedHosts);

    if (typeFilter && isContractType(typeFilter)) {
        const tf = <ContractType>typeFilter;
        contracts.forEach((v, k, m) => {
            if (v.type !== tf) {
                m.delete(k);
            }
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
