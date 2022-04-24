import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

abstract class Actions {
    // private to disallow creating other instances of this type
    protected constructor(public readonly name: string, public readonly type: string) {}

    count(ns: NS): number {
        return ns.bladeburner.getActionCountRemaining(this.type, this.name);
    }

    start(ns: NS): boolean {
        const current = ns.bladeburner.getCurrentAction();
        if (current.name === this.name) {
            return true;
        }

        return ns.bladeburner.startAction(this.type, this.name);
    }

    low(ns: NS): number {
        return ns.bladeburner.getActionEstimatedSuccessChance(this.type, this.name)[0] * 100;
    }

    high(ns: NS): number {
        return ns.bladeburner.getActionEstimatedSuccessChance(this.type, this.name)[1] * 100;
    }

    level(ns: NS): number {
        return ns.bladeburner.getActionCurrentLevel(this.type, this.name);
    }
}

class General extends Actions {
    static readonly Idle = new General("", "Idle");

    static readonly Training = new General("Training");
    static readonly Analysis = new General("Field Analysis");
    static readonly Recruitment = new General("Recruitment");
    static readonly Diplomacy = new General("Diplomacy");
    static readonly Regen = new General("Hyperbolic Regeneration Chamber");
    static readonly Incite = new General("Incite Violence");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string = "General") {
        super(name, type);
    }
}

class Contracts extends Actions {
    static readonly Tracking = new Contracts("Tracking");
    static readonly Bounty = new Contracts("Bounty Hunter");
    static readonly Retirement = new Contracts("Retirement");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string = "Contract") {
        super(name, type);
    }

    static values(): Actions[] {
        return Object.values(Contracts);
    }
}

class Operations extends Actions {
    static readonly Investigation = new Operations("Investigation");
    static readonly Undercover = new Operations("Undercover Operation");
    static readonly Sting = new Operations("Sting Operation");
    static readonly Raid = new Operations("Raid");
    static readonly StealthRetirement = new Operations("Stealth Retirement Operation");
    static readonly Assassination = new Operations("Assassination");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string = "Operation") {
        super(name, type);
    }
}

class BlackOps extends Actions {
    static readonly Typhoon = new BlackOps("Operation Typhoon");
    static readonly Zero = new BlackOps("Operation Zero");
    static readonly X = new BlackOps("Operation X");
    static readonly Titan = new BlackOps("Operation Titan");
    static readonly Ares = new BlackOps("Operation Ares");
    static readonly Archangel = new BlackOps("Operation Archangel");
    static readonly Juggernaut = new BlackOps("Operation Juggernaut");
    static readonly Dragon = new BlackOps("Operation Red Dragon");
    static readonly K = new BlackOps("Operation K");
    static readonly Deckard = new BlackOps("Operation Deckard");
    static readonly Tyrell = new BlackOps("Operation Tyrell");
    static readonly Wallace = new BlackOps("Operation Wallace");
    static readonly Orion = new BlackOps("Operation Shoulder of Orion");
    static readonly Hyron = new BlackOps("Operation Hyron");
    static readonly Morpheus = new BlackOps("Operation Morpheus");
    static readonly Storm = new BlackOps("Operation Ion Storm");
    static readonly Annihilus = new BlackOps("Operation Annihilus");
    static readonly Ultron = new BlackOps("Operation Ultron");
    static readonly Centurion = new BlackOps("Operation Centurion");
    static readonly Vindictus = new BlackOps("Operation Vindictus");
    static readonly Daedalus = new BlackOps("Operation Daedalus");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string = "BlackOps") {
        super(name, type);
    }

    done(ns: NS): boolean {
        return ns.bladeburner.getActionCountRemaining(this.type, this.name) === 0;
    }

    maxTeam(ns: NS): boolean {
        const teamSize = ns.bladeburner.getTeamSize(this.type, this.name);
        return ns.bladeburner.setTeamSize(this.type, this.name, teamSize) > 0;
    }

    ranked(ns: NS): boolean {
        return ns.bladeburner.getBlackOpRank(this.name) <= ns.bladeburner.getRank();
    }

    static values(): Actions[] {
        return Object.values(BlackOps);
    }

    static next(ns: NS): BlackOps {
        return BlackOps.values().filter((blackOp) => !(blackOp as BlackOps).done(ns))[0] as BlackOps;
    }
}

class Skills {
    static readonly BladesIntuition = new Skills("Blade's Intuition");
    static readonly Cloak = new Skills("Cloak");
    static readonly ShortCircuit = new Skills("Short-Circuit");
    static readonly Observer = new Skills("Digital Observer");
    static readonly Tracer = new Skills("Tracer");
    static readonly Overclock = new Skills("Overclock");
    static readonly Reaper = new Skills("Reaper");
    static readonly Evasive = new Skills("Evasive System");
    static readonly Datamancer = new Skills("Datamancer");
    static readonly CybersEdge = new Skills("Cyber's Edge");
    static readonly Midas = new Skills("Hands of Midas");
    static readonly Hyperdrive = new Skills("Hyperdrive");

    // private to disallow creating other instances of this type
    protected constructor(protected readonly name: string) {}

    isMaxed(ns: NS): boolean {
        if (this.name === "Overclock") {
            return ns.bladeburner.getSkillLevel(this.name) === 90;
        }
        return false;
    }

    upgrade(ns: NS): boolean {
        return ns.bladeburner.upgradeSkill(this.name);
    }
}

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const doneBurningBlades = burnBlades(ns);
    if (!doneBurningBlades) {
        logger.info("done checking bladeburner automation");
        return;
    }

    logger.toast("done doing bladeburner automation", "info");
}

function burnBlades(ns: NS) {
    const logger = new Logger(ns);

    const joined = ns.bladeburner.joinBladeburnerDivision();
    if (!joined) {
        logger.trace("skipping bladeburners becauses i haven't joined");
        return false;
    }

    if (ns.getPlayer().isWorking && !ns.getOwnedAugmentations().includes("The Blade's Simulacrum")) {
        const place = ns.getPlayer().currentWorkFactionName || ns.getPlayer().companyName;
        const job = ns.getPlayer().currentWorkFactionDescription;
        logger.trace("skipping bladeburners becauses i'm working for", place, job);
        return false;
    }

    const runActionResult = runBladeburnerActions(ns);

    const skillResult = allocateSkillPoints(ns);

    return false;
}

function allocateSkillPoints(ns: NS) {
    // at some point i stop caring about success and just want to go fast
    // Mid game
    if (!Skills.Overclock.isMaxed(ns) && Contracts.Tracking.level(ns) > 50) {
        Skills.Overclock.upgrade(ns);
        if (Contracts.Tracking.low(ns) > 60) return;
    }

    // End game
    if (ns.bladeburner.getRank() >= 20000) {
        if (BlackOps.next(ns).low(ns) < 100) {
            Skills.BladesIntuition.upgrade(ns);
            Skills.Cloak.upgrade(ns);
            Skills.ShortCircuit.upgrade(ns);
            Skills.Observer.upgrade(ns);
        }
        Skills.CybersEdge.upgrade(ns);
    }

    Skills.Reaper.upgrade(ns);
    Skills.Evasive.upgrade(ns);

    // Early game
    if (Contracts.Tracking.low(ns) < 100) {
        Skills.BladesIntuition.upgrade(ns);
        Skills.Cloak.upgrade(ns);
        Skills.Tracer.upgrade(ns);
        return false;
    }

    if (Contracts.Bounty.low(ns) < 100 || Contracts.Retirement.low(ns) < 100) {
        Skills.BladesIntuition.upgrade(ns);
        Skills.ShortCircuit.upgrade(ns);
        Skills.Tracer.upgrade(ns);
        return false;
    }

    if (!Skills.Overclock.isMaxed(ns)) {
        Skills.Overclock.upgrade(ns);
        return false;
    }

    Skills.Midas.upgrade(ns);
    Skills.Hyperdrive.upgrade(ns);

    return false;
}

function runBladeburnerActions(ns: NS) {
    const logger = new Logger(ns);

    // until i find out otherwise, being in the lowest chaos city will give me a flat % increase
    const cityChaoses = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]
        .map((name) => ({ name: name, chaos: ns.bladeburner.getCityChaos(name) }))
        .sort((a, b) => a.chaos - b.chaos);
    ns.bladeburner.switchCity(cityChaoses[0].name);

    const bladeBurnerAction = ns.bladeburner.getCurrentAction();
    logger.trace("current bladeburner action", bladeBurnerAction);
    // if (bladeBurnerAction && bladeBurnerAction.type !== "Idle") {
    //     logger.trace("already doing bladeburner work", bladeBurnerAction);
    //     return false;
    // }

    // don't do any black op work until we're at least rank 20k
    const blackOpRankThreshold = 20000;
    if (ns.bladeburner.getRank() >= blackOpRankThreshold) {
        const nextBlackOp = BlackOps.next(ns);
        if (!nextBlackOp) {
            ns.alert(
                "cody you either need to add the next black op or code up what happens when we beat all the black ops"
            );
            return;
        }

        nextBlackOp.maxTeam(ns);

        // if the next black op is 100% success, might as well work on it
        if (nextBlackOp.low(ns) >= 100 && nextBlackOp.ranked(ns)) {
            const startedBlackOp = nextBlackOp.start(ns);
            logger.trace("started black op", startedBlackOp);
            return false;
        }

        // // if there's a black op but it's not 100% success, we should do work to make it 100%
        // if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 1000) {
        //     const startedDiplomacy = General.Diplomacy.start(ns);
        //     logger.trace("started diplomacy", startedDiplomacy);
        //     return false;
        // }

        // const startedRecruiting = General.Recruitment.start(ns);
        // logger.trace("started recruiting", startedRecruiting);
        // return false;
    }

    // 70% low end chosen at random
    const low = Contracts.Tracking.low(ns);
    if (low < 70) {
        const high = Contracts.Tracking.high(ns);
        if (high - low > 10) {
            const startedAnalysis = General.Analysis.start(ns);
            logger.trace("started analysis", startedAnalysis);
            return false;
        }
        const startedTraining = General.Training.start(ns);
        logger.trace("started training", startedTraining);
        return false;
    }

    const [currentStam, maxStam] = ns.bladeburner.getStamina();
    const stamPercent = (currentStam / maxStam) * 100;

    if (stamPercent < 55) {
        const startedRegen = General.Regen.start(ns);
        logger.trace("started regen", startedRegen);
        return false;
    }

    if (stamPercent > 95 || bladeBurnerAction.type === General.Idle.type) {
        const availableContracts = Contracts.values().filter((contract) => contract.count(ns) > 0);
        if (availableContracts.length === 0) {
            const startedInciting = General.Incite.start(ns);
            logger.trace("startedInciting", startedInciting);
            return false;
        }

        const firstAvailableContract = availableContracts[0];
        const startedContract = firstAvailableContract.start(ns);
        logger.trace("started contract", startedContract, firstAvailableContract.name);
        return false;
    }

    return false;
}
