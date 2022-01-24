import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

/**
 * @description ns.nFormat formatting string for money
 */
export const $ = "$0.00a";

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    const serverMonies = new Map();
    getEveryAccessibleServerMonies(ns, serverMonies);
    logger.info("all server monies", serverMonies);
    logger.info("savings", ns.nFormat(desiredSavings(ns), $));
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
export function desiredSavings(ns: NS) {
    return exponentialBasedOnHackLevel(ns);
}

export function getEveryAccessibleServerMonies(ns: NS, serverMonies: Map<string, number>) {
    recursiveBankCheck(ns, "home", serverMonies);
    serverMonies.delete("home"); // :)
}

function recursiveBankCheck(ns: NS, hostname: string, serverMonies: Map<string, number>) {
    if (serverMonies.has(hostname)) {
        return;
    }

    serverMonies.set(hostname, ns.getServerMaxMoney(hostname) || 0);

    const remoteHosts = ns.scan(hostname);
    for (const i in remoteHosts) {
        const remoteHost = remoteHosts[i];
        recursiveBankCheck(ns, remoteHost, serverMonies);
    }
}

function exponentialBasedOnHackLevel(ns: NS) {
    const myHackLevel = ns.getPlayer().hacking;
    return Math.pow(myHackLevel, 1.5) * 10000;
}
