import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import {
    joinFactionWithAugsToBuy,
    getEnoughRep,
    saveMoney,
    buyAugs,
    buyNeuroFluxGovernor,
    installAugs,
    joinNetburnersIfOffered,
} from "/lib/Faction";
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
            joinNetburnersIfOffered(ns);
            if (getEnoughRep(ns)) sendControlMsg(ns, getControlMsg(state));
            break;
        case "saveMoney":
            if (saveMoney(ns)) sendControlMsg(ns, getControlMsg(state));
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
            break;
        case "getRep":
            nextState = "saveMoney";
            break;
        case "saveMoney":
            nextState = "buyAugs";
            break;
        case "buyAugs":
            nextState = "buyNeuroFluxGovernor";
            break;
        case "buyNeuroFluxGovernor":
            nextState = "installAugs";
            break;
        case "installAugs":
        default:
            nextState = "exit";
            break;
    }
    return { script: "/bin/faction.js", done: state, next: nextState };
}
