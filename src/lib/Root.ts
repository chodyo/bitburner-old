import { NS } from "Bitburner";

export function main(ns: NS) {
    const hostname = ns.args[0];
    gainRootAccess(ns, hostname.toString());
}

export function getAllRootedServers(ns: NS, hostname = "home", checkedServers = new Set<string>()): Set<string> {
    let rooted = new Set<string>();
    if (checkedServers.has(hostname)) return rooted;
    checkedServers.add(hostname);

    if (gainRootAccess(ns, hostname)) rooted.add(hostname);

    ns.scan(hostname).forEach((connectedHost) => {
        rooted = new Set([...rooted, ...getAllRootedServers(ns, connectedHost, checkedServers)]);
    });

    return rooted;
}

/**
 * @description Opens as many ports as it can and then tries to nuke.
 */
export function gainRootAccess(ns: NS, hostname: string) {
    if (ns.hasRootAccess(hostname)) {
        return true;
    }

    openPorts(ns, hostname);

    try {
        ns.nuke(hostname);
    } catch (e) {
        return false;
    }
    return true;
}

function openPorts(ns: NS, hostname: string) {
    [
        { open: ns.brutessh, requirement: "BruteSSH.exe" },
        { open: ns.ftpcrack, requirement: "FTPCrack.exe" },
        { open: ns.relaysmtp, requirement: "relaySMTP.exe" },
        { open: ns.httpworm, requirement: "HTTPWorm.exe" },
        { open: ns.sqlinject, requirement: "SQLInject.exe" },
    ].forEach((portOpener) => {
        if (ns.fileExists(portOpener.requirement)) {
            portOpener.open(hostname);
        }
    });
}
