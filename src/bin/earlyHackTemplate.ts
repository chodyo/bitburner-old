import { NS } from "Bitburner";

export async function main(ns: NS) {
    var target = ns.args[0].toString();
    var moneyThreshold = eval(ns.args[1].toString());
    var securityThreshold = eval(ns.args[2].toString());

    ns.tprint(`starting target=${target} moneyThreshold=${moneyThreshold} securityThreshold=${securityThreshold}`);

    while (1) {
        if (ns.getServerSecurityLevel(target) >= securityThreshold) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) <= moneyThreshold) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}
