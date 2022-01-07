import { NS } from "Bitburner";
import { getServerMaxThreadCountForScript } from "/lib/Mem";

export async function deploy(ns: NS, filename: string, hostname: string, args: any[]) {
    await copyScriptToRemoteHost(ns, filename, hostname);
    startScriptOnRemoteHost(ns, filename, hostname, args);
}

async function copyScriptToRemoteHost(ns: NS, filename: string, hostname: string) {
    await ns.scp(filename, "home", hostname);
}

function startScriptOnRemoteHost(ns: NS, filename: string, hostname: string, args: any[]) {
    var threadCount = getServerMaxThreadCountForScript(ns, filename, hostname);
    ns.tprint(`starting ${filename} on ${hostname} threads=${threadCount} args=${JSON.stringify(args)}`);
    ns.exec(filename, hostname, threadCount, ...args);
}

export function undeploy(ns: NS, filename: string, hostname: string) {
    ns.tprint(`undeploying ${filename} from ${hostname}`);
    shutdownScriptOnRemoteHost(ns, filename, hostname);
    removeScriptOnRemoteHost(ns, filename, hostname);
}

function shutdownScriptOnRemoteHost(ns: NS, filename: string, hostname: string) {
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
