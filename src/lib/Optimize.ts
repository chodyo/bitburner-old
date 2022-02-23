import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { PortNumbers } from "/lib/PortNumbers";

export type ScriptResult = {
    script: string;
    done: string;
    next: string;
};

export function sendControlMsg(ns: NS, result: ScriptResult) {
    const logger = new Logger(ns);
    const msg = JSON.stringify(result);
    if (ns.getPortHandle(PortNumbers.Control).tryWrite(msg)) {
        logger.info("successfully reported state completion", msg);
        return;
    }
    logger.toast(`failed to update state completion ${msg} port=${PortNumbers.Control}`, "error");
}
