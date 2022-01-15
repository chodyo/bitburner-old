import { NS } from "Bitburner";
import { deploy } from "lib/Deploy";
import { getTarget, getParams } from "lib/Hack";

export async function main(ns: NS) {
    ns.enableLog("ALL");
    buyPservUpgrade(ns);
}

export async function buyPservUpgrade(ns: NS) {
    var limit = ns.getPurchasedServerLimit();
    var myPservCount = ns.getPurchasedServers().length;

    var dollarsPerGig = 55000; // i think? just based on the store page
    var myCash = ns.getServerMoneyAvailable("home");
    var maxRam = Math.floor(myCash / dollarsPerGig);
    var bitPos = 0;
    while (maxRam !== 0) {
        bitPos++;
        maxRam >>= 1;
    }
    maxRam = Math.pow(2, bitPos - 1);
    if (maxRam < 8) {
        // kinda pointless
        ns.tprint(`can't buy more than 8gb ram myCash=${myCash} maxRam=${maxRam}`);
        return;
    }

    ns.tprint(`maxAffordable=${maxRam} maxRam=${ns.getPurchasedServerMaxRam()}`);
    var ram = Math.min(maxRam, ns.getPurchasedServerMaxRam());

    if (myPservCount === limit) {
        sellLowestRamPserv(ns, ram);
        return;
    }

    ns.tprint(`buying new server ram=${ram}`);
    var hostname = ns.purchaseServer("pserv", ram);
    if (!hostname) {
        ns.tprint(`tried and failed to buy a pserv`);
        return;
    }

    var target = getTarget(ns);
    var params = getParams(ns, target.hostname);
    ns.tprint(
        `starting hack on ${hostname} target=${target.hostname} ${params.moneyThreshold} ${params.securityThreshold}`
    );
    await deploy(ns, "/bin/hack.ns", hostname, [
        target.hostname,
        params.moneyThreshold.toString(),
        params.securityThreshold.toString(),
    ]);
}

async function sellLowestRamPserv(ns: NS, highestAffordableRam: number) {
    var maxRam = ns.getPurchasedServerMaxRam();
    var lowestRamAmount = maxRam;
    var lowestHostname = "";
    ns.getPurchasedServers().forEach((hostname) => {
        var serverRam = ns.getServerMaxRam(hostname);
        if (serverRam < lowestRamAmount && serverRam !== maxRam) {
            lowestRamAmount = serverRam;
            lowestHostname = hostname;
        }
    });
    if (!!lowestHostname && highestAffordableRam !== lowestRamAmount) {
        ns.tprint(`deleting ${lowestHostname} to make room for some chonkier ones`);
        ns.killall(lowestHostname);
        while (ns.getServerUsedRam(lowestHostname)) {
            await ns.asleep(100);
        }
        ns.deleteServer(lowestHostname);
    }
}
