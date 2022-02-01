import { NS } from "Bitburner";
import { hasSourceFile } from "/lib/SourceFiles";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const hostname = ns.args[0].toString();
    const logger = new Logger(ns, { stdout: true });
    connect(ns, hostname, logger);
}

export function connect(ns: NS, searchHost: string, logger = new Logger(ns)) {
    const currentServer = ns.getCurrentServer();
    const chain = recursivelyFindHost(ns, currentServer, searchHost);
    if (chain.length === 0) {
        logger.warn(searchHost, "not found");
        return false;
    }

    if (hasSourceFile(ns, 4, 1)) {
        const connected = chain.slice(1).every((hostname) => ns.connect(hostname));
        if (!connected) {
            logger.warn("failed to connect to", searchHost);
            return false;
        }
    }

    logger.info("host found, connect by", chain.join(" ➡ "));
    return true;
}

function recursivelyFindHost(ns: NS, hostname: string, searchHost: string, checkedHosts = new Map<string, boolean>()) {
    if (checkedHosts.get(hostname)) {
        return [];
    }
    checkedHosts.set(hostname, true);

    for (const connectedHost of ns.scan(hostname)) {
        if (connectedHost.toLowerCase().startsWith(searchHost.toLowerCase())) {
            return [hostname, connectedHost];
        }

        const results: string[] = recursivelyFindHost(ns, connectedHost, searchHost, checkedHosts);
        if (results.length > 0) {
            return [hostname, ...results];
        }
    }
    return [];
}
