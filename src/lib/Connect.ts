import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

const checkedHosts = new Map<string, boolean>();

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });

    const hostname = ns.args[0].toString();
    checkedHosts.clear();
    const connectChain = recursivelyFindHost(ns, "home", hostname);

    if (connectChain.length === 0) {
        logger.warn("host not found");
        return;
    }

    logger.info("host found, connect by", connectChain.join("->"));

    // connectChain.forEach((hostname) => {
    //     connect: This singularity function requires Source-File 4 to run.
    //     A power up you obtain later in the game.
    //     It will be very obvious when and how you can obtain it.
    //     ns.connect(hostname);
    // });
}

function recursivelyFindHost(ns: NS, hostname: string, searchHost: string) {
    if (checkedHosts.get(hostname)) {
        return [];
    }
    checkedHosts.set(hostname, true);

    for (const connectedHost of ns.scan(hostname)) {
        if (connectedHost === searchHost) {
            return [hostname, connectedHost];
        }

        const results: string[] = recursivelyFindHost(ns, connectedHost, searchHost);
        if (results.length > 0) {
            return [hostname, ...results];
        }
    }
    return [];
}
