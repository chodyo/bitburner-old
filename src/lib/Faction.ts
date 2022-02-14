import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { connect } from "/lib/Connect";
import { gainRootAccess } from "lib/Root";

const infinitelyUpgradableAug = "NeuroFlux Governor";

export const factionPort = 2;

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
    logger.toast("use /bin/faction.js instead", "info");
}

export async function joinFactionWithAugsToBuy(ns: NS) {
    const augsAvailableFromJoinedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions);
    if (augsAvailableFromJoinedFactions.length > 0) {
        return true;
    }

    const augsAvailableFromInvitedFactions = unownedUninstalledAugmentsFromFactions(ns, ns.checkFactionInvitations());
    if (augsAvailableFromInvitedFactions.length > 0) {
        [...new Set(augsAvailableFromInvitedFactions.map((aug) => aug.faction))].forEach((faction) =>
            ns.joinFaction(faction)
        );
        return true;
    }

    await induceFactionInvite(ns);
}

export function getEnoughRep(ns: NS) {
    const logger = new Logger(ns);

    const augs = unownedUninstalledAugmentsFromFactions(ns, ns.getPlayer().factions)
        .filter((aug) => ns.getFactionRep(aug.faction) < aug.repreq)
        .sort((a, b) => b.repreq - a.repreq);

    if (augs.length === 0) {
        return true;
    }

    const corpAugGoal = decideWhoToHackFor(ns, augs);
    if (corpAugGoal === undefined) logger.alert("ran out of corp aug goal", "warning");
    else logger.info("corpAugGoal", corpAugGoal);
    const augGoal = corpAugGoal || augs[0];

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

// todo: make this better
function decideWhoToHackFor(
    ns: NS,
    augs: { faction: string; name: string; repreq: number; prereqs: string[]; price: number }[]
) {
    const logger = new Logger(ns);

    const corporations = [
        "ecorp",
        "megacorp",
        "kuaigong international",
        "four sigma",
        "nwo",
        "blade industries",
        "omnitek incorporated",
        "bachman & associates",
        "clarke incorporated",
        "fulcrum secret technologies",
    ];

    const goodFirstBuys = [
        "Neurotrainer III", // 130m
        "Power Recirculation Core", // 180m
        "ADR-V2 Pheromone Gene", // 550m
        "FocusWire", // 900m
        "Neuronal Densification", // 1.375b
        "nextSENS Gene Modification", // 1.925b
        "HyperSight Corneal Implant", // 2.75b
        "SmartJaw", // 2.75b
        "OmniTek InfoLoad", // 2.875b
        "Xanipher", // 4.25b
        "PC Direct-Neural Interface NeuroNet Injector", // 7.5b
    ].map((s) => s.toLowerCase());

    // const num = (s: string) =>
    //     Number(s.replace("k", "000").replace("m", "000000").replace("b", "000000000").replace("t", "000000000000"));

    logger.info("augs", augs);
    const corpsOnly = augs.filter((aug) => corporations.includes(aug.faction.toLowerCase()));
    logger.info("corp augs", corpsOnly);
    const firstAugsOnly = corpsOnly.filter((aug) => goodFirstBuys.includes(aug.name.toLowerCase()));
    logger.info("first augs", firstAugsOnly);
    firstAugsOnly.forEach((aug) =>
        logger.info(
            "favor",
            ns.getFactionFavor(aug.faction),
            ns.getFactionFavorGain(aug.faction),
            150 > ns.getFactionFavor(aug.faction) + ns.getFactionFavorGain(aug.faction),
            aug
        )
    );
    const noDonos = firstAugsOnly.filter(
        // unlock donations at 150 favor
        (aug) => 150 > ns.getFactionFavor(aug.faction) + ns.getFactionFavorGain(aug.faction)
    );
    logger.info("nodonos", noDonos);
    const sorted = noDonos.sort((a, b) => a.repreq - b.repreq);

    if (sorted.length > 0) {
        return sorted[0];
    }

    return undefined;
}

/**
 * By the time we get to this func, we already have enough rep for everything
 */
export function buyAugs(ns: NS) {
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
    // if (augs[0].price > ns.getServerMoneyAvailable("home")) {
    //     // todo: maybe come up with a better way of doing this
    //     const scriptsThatCostMeMoney = ["/bin/optimize.js", "/lib/Home.js", "/lib/Pserv.js", "/lib/Hacknet.js"];
    //     const home = "home";
    //     scriptsThatCostMeMoney
    //         .filter((filename) => ns.scriptRunning(filename, home))
    //         .forEach((filename) => {
    //             logger.toast(`shutting down ${filename} to conserve money`);
    //             ns.scriptKill(filename, home);
    //         });
    // }

    // buy
    while (augs.length > 0 && augs[0] && ns.getAugmentationPrice(augs[0].name) <= ns.getServerMoneyAvailable("home")) {
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

export function buyNeuroFluxGovernor(ns: NS) {
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

export function installAugs(ns: NS) {
    // seems to be a bug where the game crashes if you're working
    // https://github.com/danielyxie/bitburner/issues/2902
    ns.stopAction();
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
        .filter((aug) => !!aug) // just to be safe - for some reason game is crashing on `x.name` where x==undefined
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
    logger.info(`inducing faction invite with ${firstFactionWithUnownedAugs}`);

    switch (firstFactionWithUnownedAugs) {
        // Install a backdoor on the CSEC server
        case Factions.CyberSec: {
            const hostname = "CSEC";
            if (ns.getHackingLevel() >= 59 && (await backdoor(ns, hostname))) {
                logger.toast(`backdoored ${hostname}`);
            }
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

        // Install a backdoor on the avmnite-02h server
        case Factions.NiteSec: {
            const hostname = "avmnite-02h";
            if (await backdoor(ns, hostname)) {
                logger.toast(`backdoored ${hostname}`);
            }
            break;
        }

        // Install a backdoor on the I.I.I.I server
        case Factions.TheBlackHand: {
            const hostname = "I.I.I.I";
            if (await backdoor(ns, hostname)) {
                logger.toast(`backdoored ${hostname}`);
            }
            break;
        }

        // Install a backdoor on the run4theh111z server
        case Factions.BitRunners: {
            const hostname = "run4theh111z";
            if (await backdoor(ns, hostname)) {
                logger.toast(`backdoored ${hostname}`);
            }
            break;
        }

        default: {
            logger.warn(`trying to induce invite to ${firstFactionWithUnownedAugs} but not implemented`);
        }
    }
}

async function backdoor(ns: NS, hostname: string) {
    if (!gainRootAccess(ns, hostname)) {
        return false;
    }

    const connected = connect(ns, hostname);
    if (!connected) {
        throw new Error(`failed to connect to backdoor ${hostname}`);
    }

    await ns.installBackdoor();

    const returnedHome = connect(ns, "home");
    if (!returnedHome) {
        throw new Error(`backdoored ${hostname} but failed to return home`);
    }

    return true;
}
