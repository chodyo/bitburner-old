import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

const infinitelyUpgradableAug = "NeuroFlux Governor";

// factions is going to be weird and crazy because it'll have different phases
// start: no factions
// next: get invite
// next: join, no rep
// get rep*, eventually have enough rep to buy everything
// buy most expensive until i have everything
// buy as many neuroflux gov as i can
// install augments
// repeat

export async function main(ns: NS) {
    const logger = new Logger(ns);

    let currentFactionState: "joinFaction" | "buyAugs" | "buyNeuroFluxGovernor" | "installAugs" = "joinFaction";
    while (true) {
        switch (currentFactionState) {
            case "joinFaction":
                break;
            case "buyAugs": {
                const noneLeft = buyAugs(ns);
                if (noneLeft) {
                    logger.toast("done buying augs");
                    currentFactionState = "buyNeuroFluxGovernor";
                }
                break;
            }
            case "buyNeuroFluxGovernor": {
                const outOfMoney = buyNeuroFluxGovernor(ns);
                if (outOfMoney) {
                    logger.toast("done buying neuroflux governor upgrades");
                    currentFactionState = "installAugs";
                }
                break;
            }
            case "installAugs": {
                logger.toast("installing augs");
                installAugs(ns);
                break;
            }
        }
        await ns.sleep(60000);
    }
    logger.toast("exiting augments buyer", "info");
}

/**
 * By the time we get to this func, we already have enough rep for everything
 */
function buyAugs(ns: NS) {
    const logger = new Logger(ns);

    const includePurchased = true;
    const playerAugs = ns.getOwnedAugmentations(includePurchased);

    // figure out what needs buying
    const augs = ns
        .getPlayer()
        .factions.flatMap((faction) => {
            return ns.getAugmentationsFromFaction(faction).map((aug) => ({
                faction: faction,
                name: aug,
                price: ns.getAugmentationPrice(aug),
                prereqs: ns.getAugmentationPrereq(aug),
            }));
        })
        .filter((aug) => !playerAugs.includes(aug.name))
        .filter((aug) => aug.name !== infinitelyUpgradableAug)
        .sort((a, b) => {
            if (a.prereqs.includes(b.name)) return 1;
            if (b.prereqs.includes(a.name)) return -1;
            return b.price - a.price;
        });

    // already bought everything
    if (augs.length === 0) {
        return true;
    }

    // save money
    if (augs[0].price > ns.getServerMoneyAvailable("home")) {
        // todo: maybe come up with a better way of doing this
        const scriptsThatCostMeMoney = ["/bin/optimize.js", "/lib/Home.js", "/lib/Pserv.js", "/lib/Hacknet.js"];
        const home = "home";
        scriptsThatCostMeMoney
            .filter((filename) => ns.scriptRunning(filename, home))
            .forEach((filename) => {
                logger.toast(`shutting down ${filename} to conserve money`);
                ns.scriptKill(filename, home);
            });
    }

    // buy
    while (augs.length > 0 && augs[0].price <= ns.getServerMoneyAvailable("home")) {
        const aug = augs.shift();
        if (aug === undefined) {
            throw new Error("tried to buy an augmentation but wasn't able to pop off the front of the list");
        }
        if (!ns.purchaseAugmentation(aug.faction, aug.name)) {
            throw new Error(
                `tried to buy an aug but failed ${aug.faction} ${aug.name} ${aug.price} ${ns.getServerMoneyAvailable(
                    "home"
                )}`
            );
        }
        logger.info(`bought ${aug.faction} ${aug.name}`);
    }

    logger.info("leftover augs", augs);
    logger.info("owned augs", playerAugs);

    return augs.length === 0;
}

function buyNeuroFluxGovernor(ns: NS) {
    const logger = new Logger(ns);

    if (ns.getPlayer().factions.length === 0) {
        throw new Error("can't buy neuroflux without a faction");
    }
    const faction = ns.getPlayer().factions[0];

    while (ns.getServerMoneyAvailable("home") >= ns.getAugmentationPrice(infinitelyUpgradableAug)) {
        if (!ns.purchaseAugmentation(faction, infinitelyUpgradableAug)) {
            throw new Error(`tried to buy an aug but failed ${faction} ${infinitelyUpgradableAug}`);
        }
        logger.info(`bought ${faction} ${infinitelyUpgradableAug}`);
    }
    return true;
}

function installAugs(ns: NS) {
    ns.installAugmentations("/bin/optimize.js");
}
