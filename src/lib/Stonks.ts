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
            // squish adjacent duplicates ahead of time because they really mess with my head
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

/**
 * Could improve this by adding caching since this recalculates
 * the "leaf" nodes (end of the trade chain) quite a bit
 */
export function calcMaxProfitFromTrades(
    trends: { low: number; high: number }[],
    tradesRemaining: number,
    stock = 0
): number {
    if (trends.length === 0) {
        return 0;
    }

    if (tradesRemaining === 0 && stock === 0) {
        return 0;
    }

    const ask = trends[0].low;
    const bid = trends[0].high;
    const theFuture = trends.slice(1);

    const hodl = calcMaxProfitFromTrades(theFuture, tradesRemaining, stock);

    if (stock === 0) {
        const buyNow = -ask + calcMaxProfitFromTrades(theFuture, tradesRemaining, stock + 1);
        const buyAndSell = bid - ask + calcMaxProfitFromTrades(theFuture, tradesRemaining - 1, stock);
        return Math.max(hodl, buyNow, buyAndSell);
    }

    const sellNow = bid + calcMaxProfitFromTrades(theFuture, tradesRemaining - 1, stock - 1);
    return Math.max(hodl, sellNow);
}
