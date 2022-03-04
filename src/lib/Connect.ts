import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { Autocomplete } from "/lib/Autocomplete";

export async function main(ns: NS) {
    const hostname = ns.args[0].toString();
    const logger = new Logger(ns, { stdout: true });
    connect(ns, hostname, logger);
    ns.flags;
}

export function autocomplete(data: Autocomplete) {
    return [...data.servers];
}

export function connect(ns: NS, searchHost: string, logger = new Logger(ns)) {
    const currentServer = ns.getCurrentServer();
    const chain = recursivelyFindHost(ns, currentServer, searchHost);
    if (chain.length === 0) {
        logger.warn(searchHost, "not found");
        return false;
    }

    const connected = chain.slice(1).every((hostname) => ns.connect(hostname));
    if (!connected) {
        logger.warn("failed to connect to", searchHost);
        return false;
    }

    logger.info("host found, connect by", chain.join(" ➡ "));
    return true;
}

function recursivelyFindHost(ns: NS, hostname: string, searchHost: string, checkedHosts = new Map<string, boolean>()) {
    // 2.00GB | stanek.get (fn)
    // if (checkedHosts.get(hostname)) {
    if (checkedHosts["get"](hostname)) {
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
