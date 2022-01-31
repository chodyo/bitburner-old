import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

const infinitelyUpgradableAug = "NeuroFlux Governor";

enum Factions {
    CyberSec = "CyberSec",
    TianDiHui = "Tian Di Hui",
    Netburners = "Netburners",

    Sector12 = "Sector-12",
    Chongqing = "Chongqing",
    NewTokyo = "New Tokyo",
    Ishima = "Ishima",
    Aevum = "Aevum",
    Volhaven = "Volhaven",

    NiteSec = "NiteSec",
    TheBlackHand = "The Black Hand",
    BitRunners = "BitRunners",

    TheCovenant = "The Covenant",
    Daedalus = "Daedalus",
    Illuminati = "Illuminati",
}

export async function main(ns: NS) {
    const logger = new Logger(ns);

    let currentFactionState: "joinFaction" | "getRep" | "buyAugs" | "buyNeuroFluxGovernor" | "installAugs" =
        "joinFaction";

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (currentFactionState === "joinFaction") {
            const joined = await joinFactionWithAugsToBuy(ns);
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

async function joinFactionWithAugsToBuy(ns: NS) {
    const augsAvailableFromJoinedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions);
    if (augsAvailableFromJoinedFactions.length > 0) {
        return true;
    }

    const augsAvailableFromInvitedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.checkFactionInvitations());
    if (augsAvailableFromInvitedFactions.length > 0) {
        return ns.joinFaction(augsAvailableFromInvitedFactions[0].faction);
    }

    await induceFactionInvite(ns);
}

function getEnoughRep(ns: NS) {
    const logger = new Logger(ns);

    const augs = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions)
        .filter((aug) => ns.getFactionRep(aug.faction) < aug.repreq)
        .sort((a, b) => b.repreq - a.repreq);

    if (augs.length === 0) {
        return true;
    }

    const augGoal = augs[0];

    const currentWorkFaction = ns.getPlayer().isWorking ? ns.getPlayer().currentWorkFactionName : undefined;
    if (currentWorkFaction && currentWorkFaction !== augGoal.faction) {
        ns.stopAction();
        logger.toast(`stopped working at ${currentWorkFaction} to work at ${augGoal.faction} instead`);
    }

    // Occasionally randomly stop working
    // to allow the accumulated rep to be added to the totals and refocus
    if (Math.random() > 0.9) ns.stopAction();

    if (!ns.getPlayer().isWorking && !ns.workForFaction(augGoal.faction, "hacking")) {
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

async function induceFactionInvite(ns: NS) {
    const logger = new Logger(ns);

    let firstFactionWithUnownedAugs: string | undefined = undefined;
    for (const faction of Object.values(Factions)) {
        if (unownedUninstalledAugmentsFromFactions(ns, [faction]).length > 0) {
            firstFactionWithUnownedAugs = faction;
            break;
        }
    }

    switch (firstFactionWithUnownedAugs) {
        // Install a backdoor on the CSEC server
        case Factions.CyberSec: {
            const connected = ["foodnstuff", "CSEC"].every((hostname) => ns.connect(hostname));
            if (!connected) {
                throw new Error("failed to backdoor CSEC");
            }
            await ns.installBackdoor();
            const returnedHome = ["foodnstuff", "home"].every((hostname) => ns.connect(hostname));
            if (!returnedHome) {
                throw new Error("backdoored CSEC but failed to return home");
            }
            logger.toast("backdoored CSEC");
            break;
        }

        // $1m; Hacking Level 50; Be in Chongqing, New Tokyo, or Ishima
        // Be in Chongqing; $20m
        case Factions.TianDiHui:
        case Factions.Chongqing:
            if (ns.getPlayer().city !== "Chongqing" && ns.travelToCity("Chongqing")) {
                logger.toast(`traveled to Chongqing to try to join ${firstFactionWithUnownedAugs}`);
            }
            break;

        // Be in New Tokyo; $20m
        case Factions.NewTokyo:
            if (ns.getPlayer().city !== "New Tokyo" && ns.travelToCity("New Tokyo")) {
                logger.toast("traveled to New Tokyo to try to join New Tokyo");
            }
            break;

        // Be in Ishima; $30m
        case Factions.Ishima:
            if (ns.getPlayer().city !== "Ishima" && ns.travelToCity("Ishima")) {
                logger.toast("traveled to Ishima to try to join Ishima");
            }
            break;

        // Be in Aevum; $40m
        case Factions.Aevum:
            if (ns.getPlayer().city !== "Aevum" && ns.travelToCity("Aevum")) {
                logger.toast("traveled to Aevum to try to join Aevum");
            }
            break;

        // Be in Aevum; $50m
        case Factions.Volhaven:
            if (ns.getPlayer().city !== "Volhaven" && ns.travelToCity("Volhaven")) {
                logger.toast("traveled to Volhaven to try to join Volhaven");
            }
            break;

        default: {
            logger.warn(`trying to induce invite to ${firstFactionWithUnownedAugs} but not implemented`);
        }
    }
}
