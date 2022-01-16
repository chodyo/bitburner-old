import { NS } from "Bitburner";

/**
 * @description ns.nFormat formatting string for memory
 */
export const GB = "0.00b";

/**
 * @description Checks if the given host can run even one thread of a script.
 */
export function serverHasEnoughMemForScript(ns: NS, filename: string, hostname: string) {
    const threadCount = getServerMaxThreadCountForScript(ns, filename, hostname);
    return threadCount > 0;
}

/**
 * @description Calculates the max number of threads that a script can use on a given host,
 *              excluding any currently running threads for other scripts.
 */
export function getServerMaxThreadCountForScript(ns: NS, filename: string, hostname: string) {
    const requiredMem = ns.getScriptRam(filename, "home");
    let currentMemUtilization = 0;

    if (ns.scriptRunning(filename, hostname)) {
        const ps = ns.ps(hostname);
        for (const i in ps) {
            const p = ps[i];
            if (p.filename === filename) {
                currentMemUtilization = p.threads * requiredMem;
                break;
            }
        }
    }

    const availableMem = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname) + currentMemUtilization;
    const threadCount = Math.floor(availableMem / requiredMem);
    return threadCount;
}
