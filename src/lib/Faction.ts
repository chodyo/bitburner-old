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

    let currentFactionState = "buyAugs";
    while (true) {
        switch (currentFactionState) {
            case "buyAugs": {
                const noneLeft = buyAugs(ns);
                if (noneLeft) {
                    currentFactionState = "buyNeuroFluxGovernor";
                }
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

    const augs = ns
        .getPlayer()
        .factions.flatMap((faction) => {
            return ns.getAugmentationsFromFaction(faction).map((aug) => ({
                faction: faction,
                name: aug,
                price: ns.getAugmentationPrice(aug),
            }));
        })
        .filter((aug) => !playerAugs.includes(aug.name))
        .filter((aug) => aug.name !== infinitelyUpgradableAug)
        .sort((a, b) => b.price - a.price);

    if (augs.length === 0) {
        return true;
    }

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

    while (augs.length > 0 && augs[0].price <= ns.getServerMoneyAvailable("home")) {
        const aug = augs.shift();
        if (aug === undefined) {
            throw new Error("tried to buy an augmentation but wasn't able to pop off the front of the list");
        }
        if (!ns.purchaseAugmentation(aug.faction, aug.name)) {
            throw new Error(
                `tried to buy an augmentation but failed ${aug.faction} ${aug.name} ${
                    aug.price
                } ${ns.getServerMoneyAvailable("home")}`
            );
        }
    }

    logger.info("leftover augs", augs);
    logger.info("owned augs", playerAugs);

    return augs.length === 0;
}
