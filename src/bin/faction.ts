import { NS } from "Bitburner";
import { joinFactionWithAugsToBuy, factionPort, getEnoughRep, buyAugs, buyNeuroFluxGovernor, installAugs } from "/lib/Faction";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting faction");

    const flags = ns.flags([["state", "joinFaction"]]);
    const state = flags["state"];
    logger.trace("faction state", state);

    switch (state) {
        case "joinFaction":
            if (await joinFactionWithAugsToBuy(ns)) progressState(ns, state);
            break;
        case "getRep":
            if (getEnoughRep(ns)) progressState(ns, state);
            break;
        case "buyAugs":
            if (buyAugs(ns)) progressState(ns, state);
            break;
        case "buyNeuroFluxGovernor":
            if (buyNeuroFluxGovernor(ns)) progressState(ns, state);
            break;
        case "installAugs":
            installAugs(ns);
            break;
        default:
            logger.toast(`faction.js started with invalid state: ${state}`, "error");
            break;
    }

    logger.trace("exiting faction");
}

function progressState(ns: NS, state: string) {
    const logger = new Logger(ns);
    const msg = JSON.stringify({"done":state});
    if (ns.getPortHandle(factionPort).tryWrite(msg)) {
        logger.info("successfully reported state completion", state);
        return;
    }
    logger.toast(`failed to update state completion state=${state} port=${factionPort}`, "error")
}
