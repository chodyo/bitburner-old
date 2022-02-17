import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { connect } from "/lib/Connect";
import { gainRootAccess } from "/lib/Root";
import { workingRepTotal } from "/lib/Document";

const infinitelyUpgradableAug = "NeuroFlux Governor";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.toast("use /bin/faction.js instead", "info");

    logger.info("name", HackingGroups.BitRunners);
    const augs = unownedUninstalledAugmentsFromFactions(ns, HackingGroups.BitRunners);
    logger.info("augs", augs);

    logger.info("factions", Factions.values());
}

type Faction = {
    name: string;
    backdoorHostname?: string;
};

abstract class Factions {
    constructor(protected readonly key: string, protected readonly value: Faction) {}

    toString(): string {
        return this.value.name;
    }

    static values(): Faction[] {
        return [
            ...EarlyGameFactions.values(),
            ...CityFactions.values(),
            ...HackingGroups.values(),
            ...Megacorporations.values(),
        ];
    }

    async induceInvite(ns: NS): Promise<boolean> {
        if (this.value.backdoorHostname) return this.backdoor(ns);

        return false;
    }

    private async backdoor(ns: NS): Promise<boolean> {
        const hostname = this.value.backdoorHostname;
        if (!hostname) return false;

        const highEnoughHacking = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(hostname);
        const rooted = gainRootAccess(ns, hostname);
        if (!highEnoughHacking || !rooted) return false;

        const currentServer = ns.getCurrentServer();
        const connected = connect(ns, hostname);
        if (!connected) {
            throw new Error(`failed to connect to backdoor ${hostname}`);
        }

        await ns.installBackdoor();

        const returnedHome = connect(ns, currentServer);
        if (!returnedHome) {
            throw new Error(`backdoored ${hostname} but failed to return home`);
        }

        return true;
    }
}

class EarlyGameFactions extends Factions {
    static readonly CyberSec = new EarlyGameFactions("CyberSec", { name: "CyberSec", backdoorHostname: "CSEC" });
    static readonly TianDiHui = new EarlyGameFactions("TianDiHui", { name: "Tian Di Hui" });
    static readonly Netburners = new EarlyGameFactions("Netburners", { name: "Netburners" });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Faction[] {
        return Object.values(EarlyGameFactions).map((faction) => faction.value);
    }
}

class CityFactions extends Factions {
    static readonly Sector12 = new CityFactions("Sector12", { name: "Sector-12" });
    static readonly Chongqing = new CityFactions("Chongqing", { name: "Chongqing" });
    static readonly NewTokyo = new CityFactions("NewTokyo", { name: "New Tokyo" });
    static readonly Ishima = new CityFactions("Ishima", { name: "Ishima" });
    static readonly Aevum = new CityFactions("Aevum", { name: "Aevum" });
    static readonly Volhaven = new CityFactions("Volhaven", { name: "Volhaven" });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Faction[] {
        return Object.values(CityFactions).map((faction) => faction.value);
    }
}

class HackingGroups extends Factions {
    static readonly NiteSec = new HackingGroups("NiteSec", { name: "NiteSec", backdoorHostname: "avmnite-02h" });
    static readonly TheBlackHand = new HackingGroups("TheBlackHand", {
        name: "The Black Hand",
        backdoorHostname: "I.I.I.I",
    });
    static readonly BitRunners = new HackingGroups("BitRunners", {
        name: "BitRunners",
        backdoorHostname: "run4theh111z",
    });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Faction[] {
        return Object.values(HackingGroups).map((faction) => faction.value);
    }
}

class Megacorporations extends Factions {
    static readonly ECorp = new Megacorporations("ECorp", { name: "ECorp" });
    static readonly MegaCorp = new Megacorporations("MegaCorp", { name: "MegaCorp" });
    static readonly KuaiGong = new Megacorporations("KuaiGong", { name: "KuaiGong International" });
    static readonly FourSigma = new Megacorporations("FourSigma", { name: "Four Sigma" });
    static readonly NWO = new Megacorporations("NWO", { name: "NWO" });
    static readonly Blade = new Megacorporations("Blade", { name: "Blade Industries" });
    static readonly OmniTek = new Megacorporations("OmniTek", { name: "OmniTek Incorporated" });
    static readonly Bachman = new Megacorporations("Bachman", { name: "Bachman & Associates" });
    static readonly Clarke = new Megacorporations("Clarke", { name: "Clarke Incorporated" });
    static readonly Fulcrum = new Megacorporations("Fulcrum", { name: "Fulcrum Secret Technologies" });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Faction[] {
        return Object.values(Megacorporations).map((faction) => faction.value);
    }
}

// enum EarlyGameFactions {
//     CyberSec = "CyberSec",
//     TianDiHui = "Tian Di Hui",
//     Netburners = "Netburners",
// }

// enum Factions {
//     Sector12 = "Sector-12",
//     Chongqing = "Chongqing",
//     NewTokyo = "New Tokyo",
//     Ishima = "Ishima",
//     Aevum = "Aevum",
//     Volhaven = "Volhaven",

//     NiteSec = "NiteSec",
//     TheBlackHand = "The Black Hand",
//     BitRunners = "BitRunners",

//     TheCovenant = "The Covenant",
//     Daedalus = "Daedalus",
//     Illuminati = "Illuminati",
// }

// enum Megacorporations {
//     ECorp = "ECorp",
//     MegaCorp = "MegaCorp",
//     KuaiGong = "KuaiGong International",
//     FourSigma = "Four Sigma",
//     NWO = "NWO",
//     Blade = "Blade Industries",
//     OmniTek = "OmniTek Incorporated",
//     Bachman = "Bachman & Associates",
//     Clarke = "Clarke Incorporated",
//     Fulcrum = "Fulcrum Secret Technologies",
// }

export async function joinFactionWithAugsToBuy(ns: NS) {
    const augsAvailableFromJoinedFactions = unownedUninstalledAugmentsFromFactions(ns, ...ns.getPlayer().factions);
    if (augsAvailableFromJoinedFactions.length > 0) {
        return true;
    }

    const augsAvailableFromInvitedFactions = unownedUninstalledAugmentsFromFactions(
        ns,
        ...ns.checkFactionInvitations()
    );
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

    const augs = unownedUninstalledAugmentsFromFactions(ns, ...ns.getPlayer().factions)
        .filter((aug) => ns.getFactionRep(aug.faction) < aug.repreq)
        .sort((a, b) => b.repreq - a.repreq);

    if (augs.length === 0) {
        return true;
    }

    return hackForFaction(ns, augs[0].faction);
}

function hackForFaction(ns: NS, factionName: string) {
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

    //! todo:
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

export function saveMoney(_: NS) {
    return true;
}

/**
 * By the time we get to this func, we already have enough rep for everything
 */
export function buyAugs(ns: NS) {
    const logger = new Logger(ns);

    const includePurchased = true;
    const playerAugs = ns.getOwnedAugmentations(includePurchased);

    // figure out what needs buying
    const augs = unownedUninstalledAugmentsFromFactions(ns, ...ns.getPlayer().factions).sort((a, b) => {
        if (a.prereqs.includes(b.name)) return 1;
        if (b.prereqs.includes(a.name)) return -1;
        return b.price - a.price;
    });

    // already bought everything
    if (augs.length === 0) {
        return true;
    }

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

function unownedUninstalledAugmentsFromFactions(ns: NS, ...factions: string[]) {
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
        if (unownedUninstalledAugmentsFromFactions(ns, faction).length > 0) {
            firstFactionWithUnownedAugs = faction;
            break;
        }
    }

    logger.info(`inducing faction invite with ${firstFactionWithUnownedAugs}`);

    if (!firstFactionWithUnownedAugs) return;

    const f: Factions = Factions[firstFactionWithUnownedAugs];
    await f.induceInvite(ns);

    // switch (firstFactionWithUnownedAugs) {
    //     // Install a backdoor on the CSEC server
    //     case Factions.CyberSec: {
    //         const hostname = "CSEC";
    //         if (ns.getHackingLevel() >= 59 && (await backdoor(ns, hostname))) {
    //             logger.toast(`backdoored ${hostname}`);
    //         }
    //         break;
    //     }

    //     // $1m; Hacking Level 50; Be in Chongqing, New Tokyo, or Ishima
    //     // Be in Chongqing; $20m
    //     case Factions.TianDiHui:
    //     case Factions.Chongqing:
    //         if (ns.getPlayer().city !== "Chongqing" && ns.travelToCity("Chongqing")) {
    //             logger.toast(`traveled to Chongqing to try to join ${firstFactionWithUnownedAugs}`);
    //         }
    //         break;

    //     // Be in New Tokyo; $20m
    //     case Factions.NewTokyo:
    //         if (ns.getPlayer().city !== "New Tokyo" && ns.travelToCity("New Tokyo")) {
    //             logger.toast("traveled to New Tokyo to try to join New Tokyo");
    //         }
    //         break;

    //     // Be in Ishima; $30m
    //     case Factions.Ishima:
    //         if (ns.getPlayer().city !== "Ishima" && ns.travelToCity("Ishima")) {
    //             logger.toast("traveled to Ishima to try to join Ishima");
    //         }
    //         break;

    //     // Be in Aevum; $40m
    //     case Factions.Aevum:
    //         if (ns.getPlayer().city !== "Aevum" && ns.travelToCity("Aevum")) {
    //             logger.toast("traveled to Aevum to try to join Aevum");
    //         }
    //         break;

    //     // Be in Aevum; $50m
    //     case Factions.Volhaven:
    //         if (ns.getPlayer().city !== "Volhaven" && ns.travelToCity("Volhaven")) {
    //             logger.toast("traveled to Volhaven to try to join Volhaven");
    //         }
    //         break;

    //     // Install a backdoor on the avmnite-02h server
    //     case Factions.NiteSec: {
    //         const hostname = "avmnite-02h";
    //         if (await backdoor(ns, hostname)) {
    //             logger.toast(`backdoored ${hostname}`);
    //         }
    //         break;
    //     }

    //     // Install a backdoor on the I.I.I.I server
    //     case Factions.TheBlackHand: {
    //         const hostname = "I.I.I.I";
    //         if (await backdoor(ns, hostname)) {
    //             logger.toast(`backdoored ${hostname}`);
    //         }
    //         break;
    //     }

    //     // Install a backdoor on the run4theh111z server
    //     case Factions.BitRunners: {
    //         const hostname = "run4theh111z";
    //         if (await backdoor(ns, hostname)) {
    //             logger.toast(`backdoored ${hostname}`);
    //         }
    //         break;
    //     }

    //     case Megacorporations.Bachman:
    //     case Megacorporations.Blade:
    //     case Megacorporations.Clarke:
    //     case Megacorporations.ECorp:
    //     case Megacorporations.FourSigma:
    //     case Megacorporations.Fulcrum:
    //     case Megacorporations.KuaiGong:
    //     case Megacorporations.MegaCorp:
    //     case Megacorporations.NWO:
    //     case Megacorporations.OmniTek:
    //         workForCorp(ns, firstFactionWithUnownedAugs);
    //         break;

    //     default: {
    //         logger.warn(`trying to induce invite to ${firstFactionWithUnownedAugs} but not implemented`);
    //         break;
    //     }
    // }
}

function workForCorp(ns: NS, corpName: string) {
    const rep = workingRepTotal();
    ns.workForCompany(corpName);
}
