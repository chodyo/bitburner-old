import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

const checkedHosts = new Map<string, boolean>();

export async function main(ns: NS) {
    checkedHosts.clear();
    recursivelyFindContracts(ns, "home");
}

function recursivelyFindContracts(ns: NS, hostname: string) {
    const logger = new Logger(ns, { stdout: true });

    if (checkedHosts.get(hostname)) {
        return;
    }
    checkedHosts.set(hostname, true);

    ns.ls(hostname, ".cct").forEach((filename) => {
        logger.info("found contract", filename, hostname);
    });

    ns.scan(hostname).forEach((connectedHost) => {
        recursivelyFindContracts(ns, connectedHost);
    });
}
