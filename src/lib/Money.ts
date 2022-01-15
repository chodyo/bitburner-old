import { NS } from "Bitburner";

export async function main(ns: NS) {
    var serverMonies = new Map();
    getEveryAccessibleServerMonies(ns, serverMonies);
    ns.tprint(JSON.stringify(Array.from(serverMonies.entries())));
}

export function desiredSavings(ns: NS) {
    var myHackLevel = ns.getPlayer().hacking;
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

    var remoteHosts = ns.scan(hostname);
    for (var i in remoteHosts) {
        var remoteHost = remoteHosts[i];
        recursiveBankCheck(ns, remoteHost, serverMonies);
    }
}

export function getHighestRate(ns: NS) {
    // TODO
    // ns.getPlayer()
}
