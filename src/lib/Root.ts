import { NS } from "Bitburner";

export function main(ns: NS) {
    var hostname = ns.args[0];
    gainRootAccess(ns, hostname.toString());
}

/**
 * @description Opens as many ports as it can and then tries to nuke.
 */
export function gainRootAccess(ns: NS, hostname: string) {
    if (ns.hasRootAccess(hostname)) {
        return true;
    }

    openPorts(ns, hostname);

    ns.tprint(`attempting to nuke ${hostname}`);
    try {
        ns.nuke(hostname);
    } catch (e) {
        ns.tprint(`failed to gain root access for host=${hostname}; error=${e}`);
        return false;
    }
    return true;
}

function openPorts(ns: NS, hostname: string) {
    [
        { fn: ns.brutessh, requirement: "BruteSSH.exe" },
        { fn: ns.ftpcrack, requirement: "FTPCrack.exe" },
        { fn: ns.relaysmtp, requirement: "relaySMTP.exe" },
        { fn: ns.httpworm, requirement: "HTTPWorm.exe" },
        { fn: ns.sqlinject, requirement: "SQLInject.exe" },
    ].forEach((portOpener) => {
        if (ns.fileExists(portOpener.requirement)) {
            portOpener.fn(hostname);
        }
    });
}
