import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    something(ns);
}

function something(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    logger.info("hi from stonks");

    logger.info("stonks", ns.stock.getSymbols());
}

export function pricesWithOnlyUpwardTrends(prices: number[]) {
    if (prices.length < 2) {
        return [];
    }

    prices = prices
        .filter((v, i, p) => {
            // squish duplicates ahead of time because they really mess with my head
            return i === p.length - 1 || v !== p[i + 1];
        })
        .filter((v, i, p) => {
            const prev = p[i - 1];
            const next = p[i + 1];

            // front end is a special case
            if (i === 0) {
                return v < next;
            }

            // back end is also a special case
            if (i === p.length - 1) {
                return prev < v;
            }

            const isLocalMax = prev < v && v > next;
            const isLocalMin = prev > v && v < next;
            return isLocalMax || isLocalMin;
        });

    const upwardTrends: { low: number; high: number }[] = [];
    for (let i = 0; i < prices.length; i += 2) {
        upwardTrends.push({ low: prices[i], high: prices[i + 1] });
    }
    return upwardTrends;
}
