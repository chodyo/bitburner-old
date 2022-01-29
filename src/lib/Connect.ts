import { NS } from "Bitburner";
import { hasSourceFile } from "/lib/SourceFiles";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const hostname = ns.args[0].toString();
    connect(ns, hostname);
}

function connect(ns: NS, searchHost: string) {
    const logger = new Logger(ns, { stdout: true });

    const checkedHosts = new Map<string, boolean>();
    const chain = recursivelyFindHost(ns, "home", searchHost, checkedHosts);
    if (chain.length === 0) {
        logger.warn(searchHost, "not found");
        return;
    }

    if (hasSourceFile(ns, 4, 1)) {
        const connected = chain.slice(1).every((hostname) => ns.connect(hostname));
        if (!connected) {
            logger.warn("failed to connect to", searchHost);
        }
        return;
    }

    logger.info("host found, connect by", chain.join(" ➡ "));
}

function recursivelyFindHost(ns: NS, hostname: string, searchHost: string, checkedHosts: Map<string, boolean>) {
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
