import { NS } from "Bitburner";

/**
 * @description ns.nFormat formatting string for money
 */
export const $ = "($0.00a)";

export async function main(ns: NS) {
    const serverMonies = new Map();
    getEveryAccessibleServerMonies(ns, serverMonies);
    ns.tprint(JSON.stringify(Array.from(serverMonies.entries())));
}

export function desiredSavings(ns: NS) {
    const myHackLevel = ns.getPlayer().hacking;
    return Math.pow(myHackLevel, 1.5) * 10000; // 1 => 10k; 10 => 320k; 20 => 890k; 50 => 3.5m; 100 => 10m; 237 => 36m
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
