import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { $, desiredSavings } from "/lib/Money";
import { GB } from "/lib/Mem";
import { sendControlMsg } from "/lib/Optimize";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    if (!pservUpgradable(ns)) {
        logger.toast("done buying pserv upgrades", "info");
        sendControlMsg(ns, { script: "/bin/pserv.js", done: "", next: "exit" });
        return;
    }

    let upgradeCount = 0;
    while (await buyPservUpgrade(ns)) {
        upgradeCount++;
        await ns.sleep(10);
    }
    if (upgradeCount > 0) {
        logger.toast(`finished buying ${upgradeCount} pserv upgrades :)`);
    }

    logger.info("exiting pserv buyer");
}

function pservUpgradable(ns: NS) {
    const pservs = ns.getPurchasedServers();
    if (pservs.length < ns.getPurchasedServerLimit()) return true;

    const pservMaxRam = ns.getPurchasedServerMaxRam();
    return pservs.some((hostname) => {
        return ns.getServerMaxRam(hostname) < pservMaxRam;
    });
}

async function buyPservUpgrade(ns: NS) {
    const logger = new Logger(ns);

    const ram = maxAffordableRam(ns);
    if (ram < 8) {
        return false;
    }

    if (ns.getPurchasedServers().length === ns.getPurchasedServerLimit()) {
        const worstPserv = worstOwnedPserv(ns);
        const worstRam = ns.getServerMaxRam(worstPserv);
        if (worstRam >= ram) return false;

        const sold = await sellWorstPserv(ns, worstPserv);
        if (sold) {
            logger.info(
                "deleted pserv to make room for some chonkier ones",
                worstPserv,
                ns.nFormat(worstRam * 1e9, GB)
            );
        }
    }

    logger.trace("could buy a pserv", ns.nFormat(ns.getPurchasedServerCost(ram), $), ns.nFormat(ram * 1e9, GB));

    const hostname = ns.purchaseServer("pserv", ram);
    if (!hostname) {
        logger.error("tried and failed to buy a pserv");
        return false;
    }
    logger.info("bought", hostname, ns.nFormat(ram * 1e9, GB));

    return true;
}

function maxAffordableRam(ns: NS) {
    const cash = ns.getServerMoneyAvailable("home") - desiredSavings(ns);
    let ram = ns.getPurchasedServerMaxRam();
    while (ram > 0 && ns.getPurchasedServerCost(ram) > cash) {
        ram >>= 1;
    }
    return ram;
}

function worstOwnedPserv(ns: NS) {
    const pservs = ns.getPurchasedServers();
    if (pservs.length === 0) {
        return "";
    }

    return pservs
        .map((pserv) => {
            return {
                hostname: pserv,
                ram: ns.getServerMaxRam(pserv),
            };
        })
        .sort((a, b) => a.ram - b.ram)[0].hostname;
}

async function sellWorstPserv(ns: NS, hostname: string) {
    if (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) return true;

    ns.killall(hostname);
    while (ns.getServerUsedRam(hostname)) {
        await ns.asleep(10);
    }

    return ns.deleteServer(hostname);
}
