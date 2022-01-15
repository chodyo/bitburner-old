import { NS } from "Bitburner";
import { getServerMaxThreadCountForScript } from "/lib/Mem";

/**
 * @description Copy file to remote host and start it with given args
 */
export async function deploy(ns: NS, filename: string, hostname: string, args: any[]) {
    ns.tprint(`deploying ${filename} to ${hostname}`);
    await copyScriptToRemoteHost(ns, filename, hostname);
    startScriptOnRemoteHost(ns, filename, hostname, args);
}

async function copyScriptToRemoteHost(ns: NS, filename: string, hostname: string) {
    await ns.scp(filename, "home", hostname);
}

export function startScriptOnRemoteHost(ns: NS, filename: string, hostname: string, args: any[]) {
    var threadCount = getServerMaxThreadCountForScript(ns, filename, hostname);
    ns.tprint(`starting ${filename} on ${hostname} threads=${threadCount} args=${JSON.stringify(args)}`);
    ns.exec(filename, hostname, threadCount, ...args);
}

/**
 * Stop script on remote host and delete the file
 */
export function undeploy(ns: NS, filename: string, hostname: string) {
    ns.tprint(`undeploying ${filename} from ${hostname}`);
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
 * @description Check if script is already running on a machine
 */
export function alreadyDeployed(ns: NS, filename: string, hostname: string, args: any[]) {
    var scriptInfo = ns.getRunningScript(filename, hostname, ...args);
    return !!scriptInfo;
}
