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

    if (!ns.gang.inGang()) {
        if (!getStatsTo40(ns)) {
            logger.trace("still training stats");
            return false;
        }

        if (!getKarmaSoHigh(ns)) {
            logger.trace("still farming karma");
            return false;
        }
    }

    if (!manageGang(ns)) {
        logger.trace("still managing gang");
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
    if (ns.singularity.checkFactionInvitations().includes(ss)) return ns.singularity.joinFaction(ss);
    if (ns.gang.createGang(ss)) return true;

    ns.singularity.commitCrime("homicide");
    return false;
}

function generateName(): string {
    const colors = [
        "Cyan",
        "Rouge",
        "Beige",
        "Zaffre",
        "Pink",
        "Glaucous",
        "Cerulean",
        "Chartreuse",
        "Viridian",
        "Bisque",
        "Laurel",
        "Alabaster",
        "Sable",
        "Citrine",
        "Amber",
        "Persimmon",
        "Vermilion",
        "Pewter",
        "Sepia",
        "Garnet",
        "Obsidian",
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];

    const adjectives = [
        "Adamant",
        "Adroit",
        "Baleful",
        "Bellicose",
        "Boorish",
        "Comely",
        "Corpulent",
        "Crapulous",
        "Defamatory",
        "Efficacious",
        "Equanimous",
        "Execrable",
        "Fastidious",
        "Feckless",
        "Hubristic",
        "Incendiary",
        "Insidious",
        "Insolent",
        "Judicious",
        "Limpid",
        "Mordant",
        "Nefarious",
        "Petulant",
        "Rebarbative",
        "Serpentine",
        "Tenacious",
        "Tremulous",
        "Turgid",
        "Voracious",
        "Wheedling",
        "Zealous",
    ];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];

    const firstNames = [
        "Duke",
        "Jacques",
        "Kirnon",
        "Grim",
        "Ark",
        "Ridley",
        "Fark",
        "Zindo",
        "Payne",
        "Tristan",
        "Kaiser",
        "Yao",
        "Rapture",
        "Eleanore",
        "Fatima",
        "Zero",
        "Pearl",
        "Zada",
        "Inigo",
        "Haera",
        "Ike",
        "Fane",
        "Norrix",
        "Gray",
        "Zander",
        "Grim",
        "Mace",
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

    const permutations = 5;
    switch (Math.floor(Math.random() * permutations)) {
        case 0:
        case 1:
            return `${color} ${firstName}`;
        case 2:
        case 3:
            return `${adj} ${firstName}`;
        default:
            return `${color} ${firstName} the ${adj}`;
    }
}

function manageGang(ns: NS) {
    ns.gang.setTerritoryWarfare(territoryWarfare(ns));

    ns.gang.recruitMember(generateName());

    ascendGangMembers(ns);

    optimizeGangMemberTasks(ns);

    buyGangMemberEquipment(ns);

    return false;
}

function territoryWarfare(ns: NS): boolean {
    const gangInfo = ns.gang.getGangInformation();
    const otherGangInfo = ns.gang.getOtherGangInformation();
    const maxOtherGangPower = Math.max(
        otherGangInfo.Tetrads.power,
        otherGangInfo["The Syndicate"].power,
        otherGangInfo["The Dark Army"].power,
        otherGangInfo["Speakers for the Dead"].power,
        otherGangInfo.NiteSec.power,
        otherGangInfo["The Black Hand"].power
    );

    // hypothetically i just need enough to beat them most of the time
    // and then my power will passively snowball as they lose and i win
    // if it's too low every team sort of equalizes in power
    const powerMult = 1.25;
    return gangInfo.power > maxOtherGangPower * powerMult;
}

function ascendGangMembers(ns: NS) {
    // gang not full, respect accrues a lot faster without ascensions
    if (ns.gang.getMemberNames().length < 12) {
        return;
    }

    ns.gang
        .getMemberNames()
        .map((name) => ({ name: name, info: ns.gang.getAscensionResult(name) || { str: 1, def: 1, dex: 1, agi: 1 } }))
        .filter((member) => member.info.str > 2 || member.info.def > 2 || member.info.dex > 2 || member.info.agi > 2)
        .forEach((member) => ns.gang.ascendMember(member.name));
}

function optimizeGangMemberTasks(ns: NS) {
    // probably better to get them some base training before trying to make money
    const minLvl = 100;
    const membersTraining = ns.gang
        .getMemberNames()
        .map((name) => {
            const info = ns.gang.getMemberInformation(name);
            let task: string | undefined = undefined;
            if (info.str < minLvl || info.def < minLvl || info.dex < minLvl || info.agi < minLvl) {
                task = "Train Combat";
            } else if (info.hack < minLvl) {
                task = "Train Hacking";
            } else if (info.cha < minLvl) {
                task = "Train Charisma";
            }
            return {
                name: name,
                task: task,
            };
        })
        .filter((member) => member.task);

    membersTraining.forEach((member) => {
        if (!member.task) return;
        ns.gang.setMemberTask(member.name, member.task);
    });

    const members = ns.gang.getMemberNames().filter((name) => !membersTraining.find((member) => member.name === name));

    // ns.alert(`${JSON.stringify(ns.gang.getGangInformation())}`);

    const gangInfo = ns.gang.getGangInformation();

    // sometimes if every member ascends at once, respect drops back down near 0
    // no real point in trying to adjust wanted penalty until there's some amount
    // of base respect already built up
    if (gangInfo.respect < 1000) {
        members.forEach((name) => setMemberTaskByGoal(ns, name, "respect"));
    }

    // wanted penalty too high
    // wanted penalty is the multiplier
    // e.g. profits * wantedPenalty = actualProfits
    // wantedLevel has a minimum value of 1
    if (gangInfo.wantedPenalty < 0.7 && gangInfo.wantedLevel > 5) {
        members.forEach((name) => setMemberTaskByGoal(ns, name, "less wanted"));
        return;
    }

    // gang not full, gain respect
    if (ns.gang.getMemberNames().length < 12) {
        members.forEach((name) => setMemberTaskByGoal(ns, name, "respect"));
        return;
    }

    // territory power too low
    if (!territoryWarfare(ns)) {
        members.forEach((name) => setMemberTaskByGoal(ns, name, "territory"));
        return;
    }

    // make money
    members.forEach((name) => setMemberTaskByGoal(ns, name, "money"));
}

function setMemberTaskByGoal(
    ns: NS,
    memberName: string,
    goal: "money" | "territory" | "respect" | "less wanted"
): boolean {
    if (goal === "territory") {
        return ns.gang.setMemberTask(memberName, "Territory Warfare");
    }

    if (goal === "less wanted") {
        return ns.gang.setMemberTask(memberName, "Vigilante Justice");
    }

    const taskResults = ns.gang.getTaskNames().map((taskName) => {
        ns.gang.setMemberTask(memberName, taskName);
        const memberInfo = ns.gang.getMemberInformation(memberName);
        return {
            taskName: taskName,
            profits: memberInfo.moneyGain,
            respect: memberInfo.respectGain,
        };
    });
    switch (goal) {
        case "money":
            const taskWithBestProfits = taskResults
                .filter((task) => task.profits > 0)
                .sort((a, b) => b.profits - a.profits)[0];

            if (taskWithBestProfits === undefined) {
                return ns.gang.setMemberTask(memberName, "Train Combat");
            }

            return ns.gang.setMemberTask(memberName, taskWithBestProfits.taskName);

        case "respect":
            const taskWithBestRespect = taskResults
                .filter((task) => task.respect > 0)
                .sort((a, b) => b.respect - a.respect)[0];

            if (taskWithBestRespect === undefined) {
                return ns.gang.setMemberTask(memberName, "Train Combat");
            }

            return ns.gang.setMemberTask(memberName, taskWithBestRespect.taskName);

        default:
            throw new Error(`member task goal is wrong: ${goal}`);
    }
}

function buyGangMemberEquipment(ns: NS) {
    const equipment = ns.gang
        .getEquipmentNames()
        .map((equipmentName) => ({ name: equipmentName, cost: ns.gang.getEquipmentCost(equipmentName) }))
        .sort((a, b) => a.cost - b.cost);
    ns.gang
        .getMemberNames()
        .map((name) => ({
            name: name,
            equipment: ns.gang.getMemberInformation(name).upgrades,
        }))
        .forEach((member) => {
            equipment.some((equipment) => {
                if (member.equipment.includes(equipment.name)) return false;
                return ns.gang.purchaseEquipment(member.name, equipment.name);
            });
        });
}
