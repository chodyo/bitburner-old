import { NS } from "Bitburner";
import { getEveryAccessibleServerMonies } from "/lib/Money";
import { gainRootAccess } from "/lib/Root";

/**
 * @description The path to the script that will be deployed and run on each server.
 */
export const hackFilePath = "/bin/hack.js";

/** @description Check if I have high enough level to hack the host **/
export function isHackable(ns: NS, hostname: string) {
    const requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
    const myHackingLevel = ns.getHackingLevel();
    return requiredHackingLevel <= myHackingLevel;
}

/**
 * @description Calculate the highest ROI host to hack
 */
export function getTarget(ns: NS) {
    let target = "";
    let maxMoney = 0;

    const serverMonies = new Map();
    getEveryAccessibleServerMonies(ns, serverMonies);
    serverMonies.forEach((potentialValue, potentialTarget) => {
        const richer = potentialValue > maxMoney;
        const hackable = isHackable(ns, potentialTarget);
        const rooted = gainRootAccess(ns, potentialTarget);
        if (richer && hackable && rooted) {
            target = potentialTarget;
            maxMoney = potentialValue;
        }
    });

    return {
        hostname: target,
        maxMoney: maxMoney,
    };
}

/**
 * @description Get threshold params for hack script
 */
export function getParams(ns: NS, hostname: string) {
    const maxMoney = ns.getServerMaxMoney(hostname);
    const minSecurityLevel = ns.getServerMinSecurityLevel(hostname);
    return {
        moneyThreshold: maxMoney * 0.75,
        securityThreshold: minSecurityLevel + 5,
    };
}
