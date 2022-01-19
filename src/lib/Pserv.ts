import { NS } from "Bitburner";
import { deploy } from "lib/Deploy";
import { getTarget, getParams, hackFilePath } from "lib/Hack";
import { Logger } from "/lib/Logger";
import { $, desiredSavings } from "/lib/Money";
import { GB } from "/lib/Mem";

export async function main(ns: NS) {
    await buyPservUpgrade(ns);
}

export async function buyPservUpgrade(ns: NS) {
    const logger = new Logger(ns);

    const limit = ns.getPurchasedServerLimit();
    const myPservs = ns
        .getPurchasedServers()
        .map((pserv) => {
            return {
                hostname: pserv,
                ram: ns.getServerMaxRam(pserv),
            };
        })
        .sort((a, b) => a.ram - b.ram);

    const dollarsPerGig = 55000; // i think? just based on the store pages
    const myCash = ns.getServerMoneyAvailable("home");
    let ram = Math.floor(myCash / dollarsPerGig);
    let bitPos = 0;
    while (ram !== 0) {
        bitPos++;
        ram >>= 1;
    }
    ram = Math.pow(2, bitPos - 1);
    ram = Math.min(ram, ns.getPurchasedServerMaxRam());

    const worthIt = ram >= 8;
    const isAnUpgrade = myPservs[0]?.ram < ram || true;
    const iHaveEnoughSavings = myCash - ns.getPurchasedServerCost(ram) >= desiredSavings(ns);
    if (!worthIt || !isAnUpgrade || !iHaveEnoughSavings) {
        return;
    }

    logger.trace(
        "could buy a pserv",
        ns.nFormat(myCash, $),
        ns.nFormat(ns.getPurchasedServerCost(ram), $),
        ns.nFormat(ram * 1e9, GB)
    );

    if (myPservs.length === limit) {
        const pservToSell = myPservs[0];
        ns.killall(pservToSell.hostname);
        while (ns.getServerUsedRam(pservToSell.hostname)) {
            await ns.asleep(100);
        }
        ns.deleteServer(pservToSell.hostname);
        logger.info(
            "deleted pserv to make room for some chonkier ones",
            pservToSell.hostname,
            ns.nFormat(pservToSell.ram * 1e9, GB)
        );
    }

    const hostname = ns.purchaseServer("pserv", ram);
    if (!hostname) {
        logger.error("tried and failed to buy a pserv");
        return;
    }
    logger.info("bought", hostname, ns.nFormat(ram * 1e9, GB));

    const target = getTarget(ns);
    const params = getParams(ns, target.hostname);
    await deploy(
        ns,
        hackFilePath,
        hostname,
        target.hostname,
        params.moneyThreshold.toString(),
        params.securityThreshold.toString()
    );
}
