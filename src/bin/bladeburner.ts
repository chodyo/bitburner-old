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
        if (current.name === this.name && current.type === this.type) {
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
}

class General extends Actions {
    static readonly Idle = new General("", "Idle");

    static readonly Training = new General("Training", "General");
    static readonly Analysis = new General("Field Analysis", "General");
    static readonly Recruitment = new General("Recruitment", "General");
    static readonly Diplomacy = new General("Diplomacy", "General");
    static readonly Regen = new General("Hyperbolic Regeneration Chamber", "General");
    static readonly Incite = new General("Incite Violence", "General");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string) {
        super(name, type);
    }
}

class Contracts extends Actions {
    static readonly Tracking = new Contracts("Tracking", "Contract");
    static readonly Bounty = new Contracts("Bounty Hunter", "Contract");
    static readonly Retirement = new Contracts("Retirement", "Contract");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string) {
        super(name, type);
    }

    static values(): Actions[] {
        return Object.values(Contracts);
    }
}

class Operations extends Actions {
    static readonly Investigation = new Operations("Investigation", "Operation");
    static readonly Undercover = new Operations("Undercover Operation", "Operation");
    static readonly Sting = new Operations("Sting Operation", "Operation");
    static readonly Raid = new Operations("Raid", "Operation");
    static readonly StealthRetirement = new Operations("Stealth Retirement Operation", "Operation");
    static readonly Assassination = new Operations("Assassination", "Operation");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string) {
        super(name, type);
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

    if (ns.getPlayer().isWorking) {
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
    Skills.Reaper.upgrade(ns);
    Skills.Evasive.upgrade(ns);

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

    const bladeBurnerAction = ns.bladeburner.getCurrentAction();
    logger.trace("current bladeburner action", bladeBurnerAction);
    // if (bladeBurnerAction && bladeBurnerAction.type !== "Idle") {
    //     logger.trace("already doing bladeburner work", bladeBurnerAction);
    //     return false;
    // }

    // 60% low end chosen at random
    if (Contracts.Tracking.low(ns) < 60) {
        if (Contracts.Tracking.high(ns) - Contracts.Tracking.low(ns) > 10) {
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
