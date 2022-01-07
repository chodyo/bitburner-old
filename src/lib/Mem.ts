import { NS } from "Bitburner";

/**
 * @description Checks if the given host can run even one thread of a script.
 */
export function serverHasEnoughMemForScript(ns: NS, filename: string, hostname: string) {
    var threadCount = getServerMaxThreadCountForScript(ns, filename, hostname);
    return threadCount > 0;
}

/**
 * @description Calculates the max number of threads that a script can use on a given host,
 *              excluding any currently running threads for other scripts.
 */
export function getServerMaxThreadCountForScript(ns: NS, filename: string, hostname: string) {
    var requiredMem = ns.getScriptRam(filename, "home");
    var currentMemUtilization = 0;

    if (ns.scriptRunning(filename, hostname)) {
        var ps = ns.ps(hostname);
        for (var i in ps) {
            var p = ps[i];
            if (p.filename === filename) {
                currentMemUtilization = p.threads * requiredMem;
                break;
            }
        }
    }

    var availableMem = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname) + currentMemUtilization;
    var threadCount = Math.floor(availableMem / requiredMem);
    return threadCount;
}
