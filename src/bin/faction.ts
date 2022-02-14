import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { joinFactionWithAugsToBuy, getEnoughRep, buyAugs, buyNeuroFluxGovernor, installAugs } from "/lib/Faction";
import { ScriptResult, sendControlMsg } from "/lib/Optimize";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting faction");

    const flags = ns.flags([["state", "joinFaction"]]);
    const state = flags["state"];
    logger.trace("faction state", state);

    switch (state) {
        case "joinFaction":
            if (await joinFactionWithAugsToBuy(ns)) sendControlMsg(ns, getControlMsg(state));
            break;
        case "getRep":
            if (getEnoughRep(ns)) sendControlMsg(ns, getControlMsg(state));
            break;
        case "buyAugs":
            if (buyAugs(ns)) sendControlMsg(ns, getControlMsg(state));
            break;
        case "buyNeuroFluxGovernor":
            if (buyNeuroFluxGovernor(ns)) sendControlMsg(ns, getControlMsg(state));
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

function getControlMsg(state: string): ScriptResult {
    let nextState = "";
    switch (state) {
        case "joinFaction":
            nextState = "getRep";
        case "getRep":
            nextState = "buyAugs";
        case "buyAugs":
            nextState = "buyNeuroFluxGovernor";
        case "buyNeuroFluxGovernor":
            nextState = "installAugs";
        case "installAugs":
        default:
            nextState = "exit";
    }
    return { script: "/bin/faction.js", done: state, next: nextState };
}
