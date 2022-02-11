import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { getServerMaxThreadCountForScript, serverHasEnoughMemForScript } from "/lib/Mem";
import { gainRootAccess } from "/lib/Root";
import { isHackable } from "/lib/Hack";

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
    if (threadCount <= 0) {
        logger.info("skipping script startup due to low threadcount", threadCount);
        return;
    }
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

export async function singleDeploy(ns: NS, filename: string, hostname: string, ...fileArgs: any[]) {
    const logger = new Logger(ns);
    logger.trace("working on", filename, hostname);

    if (hostname !== "home" && isDeployableHost(ns, filename, hostname)) {
        undeploy(ns, filename, hostname);
        await deploy(ns, filename, hostname, ...fileArgs);
    }
}

export async function recursiveDeploy(
    ns: NS,
    visited: Set<string>,
    filename: string,
    hostname: string,
    ...fileArgs: any[]
) {
    if (visited.has(hostname)) {
        return;
    }
    visited.add(hostname);

    await singleDeploy(ns, filename, hostname, ...fileArgs);

    const remoteHosts = ns.scan(hostname);
    for (const i in remoteHosts) {
        const remoteHost = remoteHosts[i];
        await recursiveDeploy(ns, visited, filename, remoteHost, ...fileArgs);
    }
}

function isDeployableHost(ns: NS, filename: string, hostname: string) {
    return (
        isHackable(ns, hostname) && serverHasEnoughMemForScript(ns, filename, hostname) && gainRootAccess(ns, hostname)
    );
}
