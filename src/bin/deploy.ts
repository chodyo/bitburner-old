import { NS } from "Bitburner";
import { deploy, undeploy } from "/lib/Deploy";
import { isHackable } from "/lib/Hack";
import { Logger } from "/lib/Logger";
import { serverHasEnoughMemForScript } from "/lib/Mem";
import { gainRootAccess } from "/lib/Root";

var visited = {};

export async function main(ns: NS) {
    const logger = new Logger(ns);
    // Clear out saved var from last time
    visited = {};

    var filename = ns.args[0].toString();
    var fileArgs = ns.args.slice(1);

    logger.info("beginning deployment", filename, ...fileArgs);
    await recursiveDeploy(ns, filename, "home", ...fileArgs);
}

async function recursiveDeploy(ns: NS, filename: string, hostname: string, ...fileArgs: any[]) {
    if (visited[hostname] === true) {
        return;
    }
    visited[hostname] = true;

    const logger = new Logger(ns);
    logger.trace("working on", filename, hostname);

    if (hostname !== "home" && isDeployableHost(ns, filename, hostname)) {
        undeploy(ns, filename, hostname);
        await deploy(ns, filename, hostname, ...fileArgs);
    }

    var remoteHosts = ns.scan(hostname);
    for (var i in remoteHosts) {
        var remoteHost = remoteHosts[i];
        await recursiveDeploy(ns, filename, remoteHost, ...fileArgs);
    }
}

function isDeployableHost(ns: NS, filename: string, hostname: string) {
    return (
        isHackable(ns, hostname) && serverHasEnoughMemForScript(ns, filename, hostname) && gainRootAccess(ns, hostname)
    );
}
