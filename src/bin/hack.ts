import { NS } from "Bitburner";

export async function main(ns: NS) {
    var target = ns.args[0].toString();
    var moneyThreshold = ns.args[1];
    var securityThreshold = ns.args[2];

    while (1) {
        if (chance(ns.getServerSecurityLevel(target) >= securityThreshold)) {
            await ns.weaken(target);
        } else if (chance(ns.getServerMoneyAvailable(target) <= moneyThreshold)) {
            await ns.grow(target);
        }
        await ns.hack(target);
    }
}

// introduce some variability to prevent every thread from doing the same thing
function chance(b: boolean) {
    var variabilityThreshold = 0.75;
    var roll = Math.random();
    if (roll > variabilityThreshold) {
        return !b;
    }
    return b;
}
