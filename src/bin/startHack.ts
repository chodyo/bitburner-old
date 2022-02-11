import { NS } from "Bitburner";
import { recursiveDeploy, shutdownScriptOnRemoteHost, startScriptOnRemoteHost, alreadyDeployed } from "/lib/Deploy";
import { getTarget, getParams, hackFilePath } from "/lib/Hack";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    if (!ns.fileExists(hackFilePath)) {
        logger.error("file does not exist", hackFilePath);
        return;
    }

    while (true) {
        var target = getTarget(ns);
        var params = getParams(ns, target.hostname);

        if (
            alreadyDeployed(
                ns,
                hackFilePath,
                "n00dles",
                target.hostname,
                params.moneyThreshold.toString(),
                params.securityThreshold.toString()
            )
        ) {
            await ns.sleep(60000);
            continue;
        }

        logger.toast(`deploying ${hackFilePath} ${JSON.stringify(target)} ${JSON.stringify(params)}`);

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

        logger.trace("starting recursive deploy", hackFilePath, target, params);
        await recursiveDeploy(
            ns,
            new Set<string>(),
            hackFilePath,
            "home",
            target.hostname,
            params.moneyThreshold.toString(),
            params.securityThreshold.toString()
        );

        await ns.sleep(60000);
    }
}
