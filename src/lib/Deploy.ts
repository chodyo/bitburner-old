import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { getServerMaxThreadCountForScript } from "/lib/Mem";

/**
 * @description Copy file to remote host and start it with given args
 */
export async function deploy(ns: NS, filename: string, hostname: string, ...args: any[]) {
    const logger = new Logger(ns);
    logger.info("deploying script to host", filename, hostname, ...args);
    await copyScriptToRemoteHost(ns, filename, hostname);
    startScriptOnRemoteHost(ns, filename, hostname, ...args);
}

async function copyScriptToRemoteHost(ns: NS, filename: string, hostname: string) {
    await ns.scp(filename, "home", hostname);
}

export function startScriptOnRemoteHost(ns: NS, filename: string, hostname: string, ...args: any[]) {
    let threadCount = getServerMaxThreadCountForScript(ns, filename, hostname);
    if (hostname === "home") {
        threadCount *= 0.9;
    }
    const logger = new Logger(ns);
    logger.info("starting script", filename, hostname, threadCount, ...args);
    ns.exec(filename, hostname, threadCount, ...args);
}

/**
 * Stop script on remote host and delete the file
 */
export function undeploy(ns: NS, filename: string, hostname: string) {
    const logger = new Logger(ns);
    logger.info("undeploying script from host", filename, hostname);
    shutdownScriptOnRemoteHost(ns, filename, hostname);
    removeScriptOnRemoteHost(ns, filename, hostname);
}

export function shutdownScriptOnRemoteHost(ns: NS, filename: string, hostname: string) {
    if (ns.scriptRunning(filename, hostname)) {
        ns.scriptKill(filename, hostname);
    }
}

function removeScriptOnRemoteHost(ns: NS, filename: string, hostname: string) {
    // Safeguard: never destroy anything on my home PC :)
    if (hostname !== "home" && ns.fileExists(filename, hostname)) {
        ns.rm(filename, hostname);
    }
}

/**
 * @description Check if script is already running on a machine.
 * Cheaper ram cost than `ns.scriptRunning`.
 */
export function alreadyDeployed(ns: NS, filename: string, hostname: string, ...args: any[]) {
    const scriptInfo = ns.getRunningScript(filename, hostname, ...args);
    return !!scriptInfo;
}
