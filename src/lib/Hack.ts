import { NS } from "Bitburner";
import { getEveryAccessibleServerMonies } from "/lib/Money";
import { gainRootAccess } from "/lib/Root";

/** @description Check if I have high enough level to hack the host **/
export function isHackable(ns: NS, hostname: string) {
    var requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
    var myHackingLevel = ns.getHackingLevel();
    return requiredHackingLevel <= myHackingLevel;
}

/**
 * @description Calculate the highest ROI host to hack
 */
export function getTarget(ns: NS) {
    var target = "";
    var maxMoney = 0;

    var serverMonies = new Map();
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
    var maxMoney = ns.getServerMaxMoney(hostname);
    var minSecurityLevel = ns.getServerMinSecurityLevel(hostname);
    return {
        moneyThreshold: maxMoney * 0.75,
        securityThreshold: minSecurityLevel + 5,
    };
}
