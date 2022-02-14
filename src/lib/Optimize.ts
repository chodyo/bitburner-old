import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export const controlPort = 2;

export type ScriptResult = {
    script: string;
    done: string;
    next: string;
};

export function sendControlMsg(ns: NS, result: ScriptResult) {
    const logger = new Logger(ns);
    const msg = JSON.stringify(result);
    if (ns.getPortHandle(controlPort).tryWrite(msg)) {
        logger.info("successfully reported state completion", msg);
        return;
    }
    logger.toast(`failed to update state completion ${msg} port=${controlPort}`, "error");
}
