import { NS } from "Bitburner";
import { shutdownScriptOnRemoteHost, startScriptOnRemoteHost, alreadyDeployed } from "/lib/Deploy";
import { getTarget, getParams, hackFilePath } from "/lib/Hack";
import { Logger } from "/lib/Logger";
import { $ } from "lib/Money";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    if (!ns.fileExists(hackFilePath)) {
        logger.error("file does not exist", hackFilePath);
        return;
    }

    var target = getTarget(ns);
    logger.info("target found", target.hostname, ns.nFormat(target.maxMoney, $));

    var params = getParams(ns, target.hostname);
    logger.info("params found", ns.nFormat(params.moneyThreshold, $), params.securityThreshold);

    if (
        alreadyDeployed(
            ns,
            hackFilePath,
            "home",
            target.hostname,
            params.moneyThreshold.toString(),
            params.securityThreshold.toString()
        )
    ) {
        logger.trace("skipping deploy because it's already running with that target", hackFilePath, target, params);
        return;
    }

    // deploy manually to home so we don't mess any files up
    shutdownScriptOnRemoteHost(ns, hackFilePath, "home");
    startScriptOnRemoteHost(
        ns,
        hackFilePath,
        "home",
        target.hostname,
        params.moneyThreshold.toString(),
        params.securityThreshold.toString()
    );

    logger.trace("spawning deploy", hackFilePath, target, params);
    ns.spawn(
        "/bin/deploy.js",
        1,
        hackFilePath,
        target.hostname,
        params.moneyThreshold.toString(),
        params.securityThreshold.toString()
    );
}
