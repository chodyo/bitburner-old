import { NS } from "Bitburner";

export async function main(ns: NS) {
    var ram = 8;
    var i = ns.getPurchasedServers().length;
    while (i < ns.getPurchasedServerLimit()) {
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
            var hostname = ns.purchaseServer("pserv-" + i, ram);
            await ns.scp("run-from-home.ns", "home", hostname);
            ns.exec("run-from-home.ns", hostname, 3);
            ++i;
        }
    }
}
