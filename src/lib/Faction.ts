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

    let currentFactionState: "joinFaction" | "getRep" | "buyAugs" | "buyNeuroFluxGovernor" | "installAugs" =
        "joinFaction";
    logger.trace("currentFactionState", currentFactionState);
    while (true) {
        if (currentFactionState === "joinFaction") {
            const joined = joinFactionWithAugsToBuy(ns);
            if (joined) {
                logger.toast("done joining faction with augs i need");
                currentFactionState = "getRep";
            }
        }
        if (currentFactionState === "getRep") {
            const maxxed = getEnoughRep(ns);
            if (maxxed) {
                logger.toast("done accumulating rep to buy augs");
                currentFactionState = "buyAugs";
            }
        }
        if (currentFactionState === "buyAugs") {
            const noneLeft = buyAugs(ns);
            if (noneLeft) {
                logger.toast("done buying augs");
                currentFactionState = "buyNeuroFluxGovernor";
            }
        }
        if (currentFactionState === "buyNeuroFluxGovernor") {
            const outOfMoney = buyNeuroFluxGovernor(ns);
            if (outOfMoney) {
                logger.toast("done buying neuroflux governor upgrades");
                currentFactionState = "installAugs";
            }
        }
        if (currentFactionState === "installAugs") {
            logger.toast("installing augs");
            installAugs(ns);
        }
        await ns.sleep(60000);
    }
    logger.toast("exiting augments buyer", "info");
}

function joinFactionWithAugsToBuy(ns: NS) {
    const augsAvailableFromJoinedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions);
    if (augsAvailableFromJoinedFactions.length > 0) {
        return true;
    }

    const augsAvailableFromInvitedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.checkFactionInvitations());
    if (augsAvailableFromInvitedFactions.length > 0) {
        return ns.joinFaction(augsAvailableFromInvitedFactions[0].faction);
    }

    // todo: work on finding joinable faction
}

function getEnoughRep(ns: NS) {
    const logger = new Logger(ns);

    let oldWork: string | undefined = undefined;
    if (ns.getPlayer().isWorking) {
        oldWork = ns.getPlayer().currentWorkFactionName;
        ns.stopAction();
    }

    const augs = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions)
        .filter((aug) => ns.getFactionRep(aug.faction) < aug.repreq)
        .sort((a, b) => b.repreq - a.repreq);

    logger.info("augs", augs);

    if (augs.length === 0) {
        return true;
    }

    const augGoal = augs[0];
    if (oldWork && augGoal.faction !== oldWork) {
        logger.toast(`stopped working at ${oldWork} to work at ${augGoal.faction} instead`);
    }

    if (!ns.workForFaction(augGoal.faction, "hacking")) {
        throw new Error(`failed to start work to gain rep for aug=${JSON.stringify(augGoal)}`);
    }

    return false;
}

/**
 * By the time we get to this func, we already have enough rep for everything
 */
function buyAugs(ns: NS) {
    const logger = new Logger(ns);

    const includePurchased = true;
    const playerAugs = ns.getOwnedAugmentations(includePurchased);

    // figure out what needs buying
    const augs = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions).sort((a, b) => {
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

function unownedUninstalledAugmentsFromFactions(ns: NS, factions: string[]) {
    const purchasedAndInstalled = true;
    const playerAugs = ns.getOwnedAugmentations(purchasedAndInstalled);

    return factions
        .flatMap((faction) =>
            ns.getAugmentationsFromFaction(faction).map((aug) => ({
                faction: faction,
                name: aug,
                repreq: ns.getAugmentationRepReq(aug),
                prereqs: ns.getAugmentationPrereq(aug),
                price: ns.getAugmentationPrice(aug),
            }))
        )
        .filter((aug) => !playerAugs.includes(aug.name))
        .filter((aug) => aug.name !== infinitelyUpgradableAug);
}
