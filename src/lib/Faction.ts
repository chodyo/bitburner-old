import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { connect } from "/lib/Connect";
import { gainRootAccess } from "/lib/Root";
import { induceNetburnerInvite } from "/lib/Hacknet";

const infinitelyUpgradableAug = "NeuroFlux Governor";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.toast("use /bin/faction.js instead", "info");

    logger.info("name", HackingGroups.BitRunners);
    const augs = unownedUninstalledAugmentsFromFactions(ns, HackingGroups.BitRunners.name);
    logger.info("augs", augs);

    logger.info("factions", Factions.values());

    // logger.info("working rep vals", workingRepEarned(), workingRepRate());
    logger.info("working rep vals", ns.getPlayer().workRepGained, ns.getPlayer().workRepGainRate);
}

type Faction = {
    // the in-game name of the faction including spaces and punctuation
    name: string;

    // the name of the server that must be backdoored to induce an invite
    backdoorHostname?: string;

    // the city the player must be in to induce an invite
    city?: string;

    // the amount of corporation rep required to induce a faction invite
    corp?: number;

    // the name of the corporation if it's different from the faction
    corpName?: string;

    // the function to call if the faction needs a custom action performed
    special?: (ns: NS) => boolean;
};

abstract class Factions {
    constructor(protected readonly key: string, protected readonly value: Faction) {}

    static from(name: string): Factions {
        const matches = Factions.values().filter((f) => f.name === name);
        if (matches.length === 1) return matches[0];
        throw new Error(`not sure which faction you were looking for: ${name}`);
    }

    get name(): string {
        return this.value.name;
    }

    toString(): string {
        return this.value.name;
    }

    static values(): Factions[] {
        return [
            ...EarlyGameFactions.values(),
            ...CityFactions.values(),
            ...HackingGroups.values(),
            ...Megacorporations.values(),
            ...CriminalOrgs.values(),
            ...EndgameFactions.values(),
        ];
    }

    async induceInvite(ns: NS): Promise<boolean> {
        let ready = true;

        if (this.value.backdoorHostname && !(await this.backdoor(ns))) ready = false;

        const alreadyHere = ns.getPlayer().city === this.value.city;
        const haveEnoughCash = ns.getServerMoneyAvailable("home") >= 200e3;
        if (this.value.city && !alreadyHere && haveEnoughCash) ready = ns.travelToCity(this.value.city);

        if (this.value.corp && !workForCorp(ns, this.value.corpName || this.value.name, this.value.corp)) ready = false;

        if (this.value.special) ready = this.value.special(ns);

        return ready;
    }

    async backdoor(ns: NS): Promise<boolean> {
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
    static readonly TianDiHui = new EarlyGameFactions("TianDiHui", { name: "Tian Di Hui", city: "Chongqing" });
    static readonly Netburners = new EarlyGameFactions("Netburners", {
        name: "Netburners",
        special: induceNetburnerInvite,
    });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Factions[] {
        return Object.values(EarlyGameFactions);
    }
}

class CityFactions extends Factions {
    static readonly Sector12 = new CityFactions("Sector12", { name: "Sector-12", city: "Sector-12" });
    static readonly Chongqing = new CityFactions("Chongqing", { name: "Chongqing", city: "Chongqing" });
    static readonly NewTokyo = new CityFactions("NewTokyo", { name: "New Tokyo", city: "New Tokyo" });
    static readonly Ishima = new CityFactions("Ishima", { name: "Ishima", city: "Ishima" });
    static readonly Aevum = new CityFactions("Aevum", { name: "Aevum", city: "Aevum" });
    static readonly Volhaven = new CityFactions("Volhaven", { name: "Volhaven", city: "Volhaven" });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Factions[] {
        return Object.values(CityFactions);
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

    static values(): Factions[] {
        return Object.values(HackingGroups);
    }
}

class Megacorporations extends Factions {
    static readonly ECorp = new Megacorporations("ECorp", { name: "ECorp", corp: 200e3, backdoorHostname: "ecorp" });
    static readonly MegaCorp = new Megacorporations("MegaCorp", {
        name: "MegaCorp",
        corp: 200e3,
        backdoorHostname: "megacorp",
    });
    static readonly KuaiGong = new Megacorporations("KuaiGong", {
        name: "KuaiGong International",
        corp: 200e3,
        backdoorHostname: "kuai-gong",
    });
    static readonly FourSigma = new Megacorporations("FourSigma", {
        name: "Four Sigma",
        corp: 200e3,
        backdoorHostname: "4sigma",
    });
    static readonly NWO = new Megacorporations("NWO", { name: "NWO", corp: 200e3, backdoorHostname: "nwo" });
    static readonly Blade = new Megacorporations("Blade", {
        name: "Blade Industries",
        corp: 200e3,
        backdoorHostname: "blade",
    });
    static readonly OmniTek = new Megacorporations("OmniTek", {
        name: "OmniTek Incorporated",
        corp: 200e3,
        backdoorHostname: "omnitek",
    });
    static readonly Bachman = new Megacorporations("Bachman", {
        name: "Bachman & Associates",
        corp: 200e3,
        backdoorHostname: "b-and-a",
    });
    static readonly Clarke = new Megacorporations("Clarke", {
        name: "Clarke Incorporated",
        corp: 200e3,
        backdoorHostname: "clarkinc",
    });
    static readonly Fulcrum = new Megacorporations("Fulcrum", {
        name: "Fulcrum Secret Technologies",
        corpName: "Fulcrum Technologies",
        corp: 250e3,
        backdoorHostname: "fulcrumassets",
    });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Factions[] {
        return Object.values(Megacorporations);
    }
}

class CriminalOrgs extends Factions {
    static farmKarma(ns: NS): boolean {
        if (ns.getPlayer().crimeType) {
            return false;
        }

        ns.commitCrime("Homicide");

        return false;
    }

    static readonly Snakes = new CriminalOrgs("Snakes", { name: "Slum Snakes", special: this.farmKarma });
    static readonly Tetrads = new CriminalOrgs("Tetrads", {
        name: "Tetrads",
        city: "Chongqing",
        special: this.farmKarma,
    });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Factions[] {
        return Object.values(CriminalOrgs);
    }
}

class EndgameFactions extends Factions {
    // 20 augs, $75b, hacking lvl 850, all combat stats 850
    static readonly Covenant = new EndgameFactions("Covenant", {
        name: "The Covenant",
        special: (ns) => {
            // hacking to 850 will be taken care of by hack/grow/weaken

            const player = ns.getPlayer();
            const firstLowStat = [
                { name: "Strength", value: player.strength },
                { name: "Defense", value: player.defense },
                { name: "Dexterity", value: player.dexterity },
                { name: "Agility", value: player.agility },
            ]
                .filter((stat) => stat.value < 850)
                .shift();

            if (firstLowStat) {
                const gym = "Powerhouse Gym";
                ns.gymWorkout(gym, firstLowStat.name);
                return false;
            }

            return true;
        },
    });

    // 30 augs, $100b, hacking 2500 or combat stats 1500
    static readonly Daedalus = new EndgameFactions("Daedalus", { name: "Daedalus" });

    // 30 augs, $150b, hacking 1500 or combat stats 1200
    static readonly Illuminati = new EndgameFactions("Illuminati", { name: "Illuminati" });

    // private to disallow creating other instances of this type
    private constructor(readonly key: string, readonly value: Faction) {
        super(key, value);
    }

    static values(): Factions[] {
        return Object.values(EndgameFactions);
    }
}

export async function joinFactionWithAugsToBuy(ns: NS) {
    const logger = new Logger(ns);

    const augsAvailableFromJoinedFactions = unownedUninstalledAugmentsFromFactions(
        ns,
        ...ns.getPlayer().factions
    ).filter((aug) => aug.faction !== "Bladeburners"); // not sure how to deal with this yet
    if (augsAvailableFromJoinedFactions.length > 0) {
        logger.trace(
            `${augsAvailableFromJoinedFactions.length} augs available from faction that i already joined`,
            new Set(augsAvailableFromJoinedFactions.map((augs) => augs.faction))
        );
        return true;
    }

    // const augsAvailableFromInvitedFactions = unownedUninstalledAugmentsFromFactions(
    //     ns,
    //     ...ns.checkFactionInvitations()
    // );
    // if (augsAvailableFromInvitedFactions.length > 0) {
    //     [...new Set(augsAvailableFromInvitedFactions.map((aug) => aug.faction))].forEach((faction) => {
    //         logger.trace("joining", faction);
    //         ns.joinFaction(faction);
    //     });
    //     return true;
    // }

    await induceFactionInvite(ns);
}

export function getEnoughRep(ns: NS) {
    const logger = new Logger(ns);

    // highest rep requirement of all augs for all factions i've already joined
    const augs = unownedUninstalledAugmentsFromFactions(ns, ...ns.getPlayer().factions)
        .filter((aug) => ns.getFactionRep(aug.faction) < aug.repreq)
        .sort((a, b) => b.repreq - a.repreq)
        .filter((aug) => aug.faction !== "Bladeburners"); // not sure how to deal with this yet

    if (augs.length === 0) {
        return true;
    }

    const faction = augs[0].faction;
    const repreq = augs[0].repreq;
    logger.info("chosen faction", faction, repreq, "all faction augs", augs);

    const earned = ns.getPlayer().workRepGained;
    const total = earned + ns.getFactionRep(faction);
    const remainder = repreq - total;

    const donosUnlocked = ns.getFactionFavor(faction) >= ns.getFavorToDonate();

    if (remainder && donosUnlocked) {
        // https://github.com/danielyxie/bitburner/blob/f5386acc17de63b66530fc6aad8f911c451663f6/src/Faction/formulas/donation.ts#L5
        // https://github.com/danielyxie/bitburner/blob/f5386acc17de63b66530fc6aad8f911c451663f6/src/Constants.ts#L141
        const donoAmount = Math.ceil((remainder * 1e6) / ns.getPlayer().faction_rep_mult);
        const enoughCashToReachRepGoal = ns.getServerMoneyAvailable("home") >= donoAmount;
        ns.donateToFaction(faction, enoughCashToReachRepGoal ? donoAmount : ns.getServerMoneyAvailable("home") / 3);
    }

    const totalFavor = 1 + Math.log((total + 25000) / 25500) / Math.log(1.02);
    const canUnlockDonos = totalFavor >= ns.getFavorToDonate();
    if (!donosUnlocked && canUnlockDonos) {
        // buy any available augs
        ns.stopAction();
        return true;
    }

    return hackForFaction(ns, faction, repreq);
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
    const augs = unownedUninstalledAugmentsFromFactions(ns, ...ns.getPlayer().factions)
        // not sure how to deal with this yet
        .filter((aug) => aug.faction !== "Bladeburners")
        // e.g. if the program wants to reset to unlock donations,
        // it should still install whatever augs it can get its filthy digital hands on
        .filter((aug) => aug.repreq <= ns.getFactionRep(aug.faction))
        .sort((a, b) => {
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

export function buyBladeburnerAugs(ns: NS) {
    const logger = new Logger(ns);

    if (!ns.getPlayer().factions.includes("Bladeburners")) {
        return true;
    }

    // once the price mult gets too high, i don't think it's worth it to wait too long to buy BB augs
    // count chosen at random, should probably be adjusted
    const allAugs = ns.getOwnedAugmentations(true).length;
    const installedAugs = ns.getOwnedAugmentations(false).length;
    const queuedAugsCount = allAugs - installedAugs;
    if (queuedAugsCount > 12) {
        return true;
    }

    const augs = unownedUninstalledAugmentsFromFactions(ns, "Bladeburners")
        .filter((aug) => aug.repreq <= ns.getFactionRep(aug.faction))
        .sort((a, b) => {
            // even though this aug is super good, it's super expensive
            if (a.name === "The Blade's Simulacrum") return 1;
            if (b.name === "The Blade's Simulacrum") return -1;

            // if b is a prereq of a, a needs to shift +
            if (a.prereqs.includes(b.name)) return 1;
            // if a is a prereq of b, a needs to shift -
            if (b.prereqs.includes(a.name)) return -1;

            return b.price - a.price;
        });

    if (augs.length === 0) {
        return true;
    }

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
    return augs.length === 0 || augs[0].name === "The Blade's Simulacrum";
}

export function buyNeuroFluxGovernor(ns: NS) {
    const logger = new Logger(ns);

    if (ns.getPlayer().factions.length === 0) {
        throw new Error("can't buy neuroflux without a faction");
    }
    const faction = ns.getPlayer().factions[0];

    while (
        ns.getServerMoneyAvailable("home") >= ns.getAugmentationPrice(infinitelyUpgradableAug) &&
        ns.getFactionRep(faction) >= ns.getAugmentationRepReq(infinitelyUpgradableAug)
    ) {
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
    ns.softReset("/bin/optimize.js"); // if i have no augs
}

function unownedUninstalledAugmentsFromFactions(ns: NS, ...factions: string[]) {
    const purchasedAndInstalled = true;
    const playerAugs = ns.getOwnedAugmentations(purchasedAndInstalled);

    const leftoverAugs = factions
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

    // only include bladeburner augs if we're explicitly asking for them
    if (factions.length === 1 && factions.includes("Bladeburners")) {
        return leftoverAugs;
    }

    return leftoverAugs.filter((aug) => aug.faction != "Bladeburners");
}

async function induceFactionInvite(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("inducing faction invite");

    // out of all the highest rep augs by faction, find the lowest rep one
    const augs = unownedUninstalledAugmentsFromFactions(ns, ...Factions.values().map((f) => f.name))
        .sort((a, b) => b.repreq - a.repreq)
        .filter((aug, i, arr) => i === arr.findIndex((v) => v.faction === aug.faction))
        .sort((a, b) => a.repreq - b.repreq);

    if (augs.length === 0) {
        logger.trace("no augs available in any factions");
        return;
    }
    const f: Factions = Factions.from(augs[0].faction);
    logger.info(`inducing faction invite with ${f}`);
    await f.induceInvite(ns);

    if (ns.checkFactionInvitations().includes(f.name)) {
        return ns.joinFaction(f.name);
    }
}

function hackForFaction(ns: NS, factionName: string, repThreshold: number) {
    const current = ns.getFactionRep(factionName);

    const earned = ns.getPlayer().workRepGained;
    if (current + earned >= repThreshold) {
        ns.stopAction();
        return true;
    }

    const currentFactionName = ns.getPlayer().currentWorkFactionName;
    if (!currentFactionName || currentFactionName !== factionName) {
        ["hacking", "field work", "security"].some((workType) => ns.workForFaction(factionName, workType));
    }

    return ns.getFactionRep(factionName) >= repThreshold;
}

async function workForCorp(ns: NS, corpName: string, repThreshold: number) {
    const logger = new Logger(ns);

    const player = ns.getPlayer();
    // logger.trace("player", player);

    const current = ns.getCompanyRep(corpName);
    const earned = player.workRepGained;
    const backdoored = await isCorpBackdoored(ns, corpName);
    const wouldReceive = backdoored ? (earned * 3) / 4 : earned / 2;

    if (current + wouldReceive >= repThreshold) {
        ns.stopAction();
        return true;
    }

    if (player.companyName !== corpName) {
        const applied = ns.applyToCompany(corpName, "Software");
        logger.trace("applied to", corpName, applied);
    }

    if (!player.workType || player.workType !== "Working for Company") {
        const isWorking = ns.workForCompany(corpName);
        logger.trace("working for", corpName, isWorking);
        return false;
    }

    return false;
}

async function isCorpBackdoored(ns: NS, corpName: string): Promise<boolean> {
    const faction = Megacorporations.from(corpName) as Megacorporations;
    return await faction.backdoor(ns);
}
