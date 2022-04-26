import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const done = gang(ns);
    if (!done) {
        logger.info("did gang stuff");
        return;
    }

    logger.alert("done running gang", "info");
}

/**
 * Returns true when done with gang.
 */
function gang(ns: NS): boolean {
    const logger = new Logger(ns);

    if (!getStatsTo40(ns)) {
        logger.trace("still training stats");
        return false;
    }

    if (!getKarmaSoHigh(ns)) {
        logger.trace("still farming karma");
        return false;
    }

    return false;
}

function getStatsTo40(ns: NS): boolean {
    const logger = new Logger(ns);
    const p = ns.getPlayer();
    const to40 = 40;

    const statsToTrain = [
        { name: "str", lvl: p.strength },
        { name: "def", lvl: p.defense },
        { name: "dex", lvl: p.dexterity },
        { name: "agi", lvl: p.agility },
    ].filter((stats) => stats.lvl < to40);

    if (statsToTrain.length === 0) {
        if (p.isWorking && p.className.startsWith("training")) ns.singularity.stopAction();
        return true;
    }

    trainStat(ns, statsToTrain[0].name);

    return false;
}

function trainStat(ns: NS, stat: string): boolean {
    const p = ns.getPlayer();

    if (p.className.startsWith(`training your ${stat}`)) {
        return true;
    }
    if (p.className.startsWith("training your")) {
        ns.singularity.stopAction();
    }

    if (ns.getPlayer().isWorking) {
        return false;
    }

    return ns.singularity.gymWorkout("powerhouse gym", stat, true);
}

function getKarmaSoHigh(ns: NS) {
    const ss = "Slum Snakes";
    if (ns.gang.inGang()) return true;
    if (ns.singularity.checkFactionInvitations().includes(ss)) ns.singularity.joinFaction(ss);
    if (ns.gang.createGang(ss)) return true;

    ns.singularity.commitCrime("homicide");
    return false;
}
