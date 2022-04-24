import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const doneGettingRich = getRich(ns);
    if (!doneGettingRich) {
        logger.info("done trading stocks");
        return;
    }

    logger.toast("done getting rich", "info");
}

function getRich(ns: NS): boolean {
    const logger = new Logger(ns);

    // const hasForecastData = ns.stock.purchase4SMarketDataTixApi();
    // if (!hasForecastData) {
    //     logger.trace("no forecast data :(");
    //     return true;
    // }

    buyMaxIncreasingStocks(ns);

    return false;
}

function buyMaxIncreasingStocks(ns: NS) {
    const logger = new Logger(ns);

    const buys = getStocks(ns)
        .filter((stock) => stock.shares === 0)
        .forEach((stock) => {
            const mySpendAmount = 2e6;
            const shares = Math.floor(mySpendAmount / stock.ask);
            const bought = ns.stock.buy(stock.symbol, shares);
            logger.trace("bought stocks", stock.symbol, stock.ask, bought);
        });
}

function getStocks(ns: NS) {
    const stocks = ns.stock.getSymbols().map((symbol) => ({
        symbol: symbol,
        // forecast: ns.stock.getForecast(symbol),
        shares: ns.stock.getPosition(symbol)[0],
        ask: ns.stock.getAskPrice(symbol),
    }));
    // .filter((stock) => {
    //     stock.forecast > 0.75;
    // });

    return stocks;
}
