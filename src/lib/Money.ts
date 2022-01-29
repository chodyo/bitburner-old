import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

/**
 * @description ns.nFormat formatting string for money
 */
export const $ = "$0.00a";

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });

    logger.trace("getting desired savings");
    logger.info("savings", ns.nFormat(desiredSavings(ns), $));
}

export function desiredSavings(ns: NS, minutesOfSavings = 10) {
    return incomeBasedSavings(ns) * minutesOfSavings * 60;
}

/**
 * Exponentially grow savings based on hacking level. e.g.
 *
 * Hacking Level => Savings
 *
 *             1 =>  $10k
 *            10 => $316k
 *            25 => $1.3m
 *            50 => $3.5m
 *           100 =>  $10m
 *           250 =>  $40m
 *           500 => $112m
 *          1000 => $316m
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function exponentialBasedOnHackLevel(ns: NS) {
    const myHackLevel = ns.getPlayer().hacking;
    return Math.pow(myHackLevel, 1.5) * 10000;
}

function incomeBasedSavings(ns: NS) {
    const hacknetRate = new Array(ns.hacknet.numNodes())
        .fill(undefined)
        .map((_, n) => ns.hacknet.getNodeStats(n)?.production || 0)
        .reduce((partialSum, nodeProduction) => partialSum + nodeProduction, 0);

    const hackRate = ns.getScriptIncome()[0];

    return hacknetRate + hackRate;
}

export function getEveryAccessibleServerMonies(ns: NS) {
    const serverMonies = recursiveBankCheck(ns, "home");
    serverMonies.delete("home"); // :)
    return serverMonies;
}

function recursiveBankCheck(ns: NS, hostname: string, serverMonies = new Map<string, number>()) {
    if (serverMonies.has(hostname)) {
        return serverMonies;
    }

    serverMonies.set(hostname, ns.getServerMaxMoney(hostname) || 0);

    const remoteHosts = ns.scan(hostname);
    for (const i in remoteHosts) {
        const remoteHost = remoteHosts[i];
        serverMonies = recursiveBankCheck(ns, remoteHost, serverMonies);
    }

    return serverMonies;
}
