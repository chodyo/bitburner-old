import { NS } from "Bitburner";
import { shutdownScriptOnRemoteHost, startScriptOnRemoteHost, alreadyDeployed } from "/lib/Deploy";
import { getTarget, getParams } from "/lib/Hack";

export async function main(ns: NS) {
    var filename = "/bin/hack.ns";
    if (!ns.fileExists(filename)) {
        ns.tprint(`invalid file to deploy: ${filename} does not exist`);
        return;
    }

    var target = getTarget(ns);
    var hostname = target.hostname;
    var maxMoney = target.maxMoney;

    ns.tprint(`hostname=${hostname} maxMoney=${maxMoney}`);

    var params = getParams(ns, hostname);
    var moneyThreshold = params.moneyThreshold;
    var securityThreshold = params.securityThreshold;

    if (alreadyDeployed(ns, filename, "home", [hostname, moneyThreshold.toString(), securityThreshold.toString()])) {
        ns.tprint(`skipping deploy=${filename} target=${hostname} because it's already running with that target`);
        return;
    }

    // deploy manually to home so we don't mess any files up
    shutdownScriptOnRemoteHost(ns, filename, "home");
    startScriptOnRemoteHost(ns, filename, "home", [hostname, moneyThreshold.toString(), securityThreshold.toString()]);

    // redeploy /bin/hack.ns with args
    ns.tprint(`starting hostname=${hostname} moneyThreshold=${moneyThreshold} securityThreshold=${securityThreshold}`);
    ns.spawn("/bin/deploy.ns", 1, filename, hostname, moneyThreshold.toString(), securityThreshold.toString());
}
