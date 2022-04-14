import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

class BladeburnerActions {
    static readonly Training = new BladeburnerActions("Training", "General");
    static readonly Regen = new BladeburnerActions("Hyperbolic Regeneration Chamber", "General");
    static readonly Tracking = new BladeburnerActions("Tracking", "Contract");

    // private to disallow creating other instances of this type
    private constructor(readonly name: string, readonly type: string) {}
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

    const work = ns.getPlayer().currentWorkFactionName;
    if (work && work !== "Bladeburners") {
        logger.trace("skipping bladeburners becauses i'm working for", work);
        return false;
    }

    const runActionResult = runBladeburnerActions(ns);

    return runActionResult;
}

function runBladeburnerActions(ns: NS) {
    const logger = new Logger(ns);

    const bladeBurnerAction = ns.bladeburner.getCurrentAction();
    logger.trace("current bladeburner action", bladeBurnerAction);
    // if (bladeBurnerAction && bladeBurnerAction.type !== "Idle") {
    //     logger.trace("already doing bladeburner work", bladeBurnerAction);
    //     return false;
    // }

    const [successLow, successHigh] = ns.bladeburner.getActionEstimatedSuccessChance(
        BladeburnerActions.Tracking.type,
        BladeburnerActions.Tracking.name
    );
    // 60% low end chosen at random
    if (successLow < 0.6) {
        const startedTraining = startAction(ns, BladeburnerActions.Training);
        logger.trace("started training", startedTraining);
        return false;
    }

    const [currentStam, maxStam] = ns.bladeburner.getStamina();
    const stamPercent = (currentStam / maxStam) * 100;

    if (stamPercent < 55) {
        const startedRegen = startAction(ns, BladeburnerActions.Regen);
        logger.trace("started regen", startedRegen);
        return false;
    }

    if (stamPercent > 95) {
        const startedTracking = startAction(ns, BladeburnerActions.Tracking);
        logger.trace("started contract", startedTracking);
        return false;
    }

    return false;
}

function startAction(ns: NS, action: BladeburnerActions) {
    const bladeBurnerAction = ns.bladeburner.getCurrentAction();
    if (bladeBurnerAction.name === action.name && bladeBurnerAction.type === action.type) {
        return true;
    }

    return ns.bladeburner.startAction(action.type, action.name);
}
