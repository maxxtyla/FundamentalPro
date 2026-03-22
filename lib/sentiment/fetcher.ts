// lib/sentiment/fetcher.ts
const MYFXBOOK_EMAIL = process.env.MYFXBOOK_EMAIL!;
const MYFXBOOK_PASSWORD = process.env.MYFXBOOK_PASSWORD!;

const TRACKED_SYMBOLS = [
  "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDUSD",
  "CADCHF", "CADJPY", "CHFJPY",
  "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
  "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
  "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
  "USDCAD", "USDCHF", "USDJPY",
  "XAGUSD", "XAUUSD"
];

export async function getSentimentData() {
  try {
    // 1. Log into Myfxbook
    const loginRes = await fetch(
      `https://www.myfxbook.com/api/login.json?email=${encodeURIComponent(MYFXBOOK_EMAIL)}&password=${encodeURIComponent(MYFXBOOK_PASSWORD)}`
    );
    const loginJson = await loginRes.json();

    if (loginJson.error) throw new Error("Myfxbook login failed: " + loginJson.message);

    const sessionId = loginJson.session;

    // 2. Fetch community outlook
    const dataRes = await fetch(
      `https://www.myfxbook.com/api/get-community-outlook.json?session=${sessionId}`
    );
    const dataJson = await dataRes.json();

    // 3. Logout (fire and forget)
    fetch(`https://www.myfxbook.com/api/logout.json?session=${sessionId}`).catch(() => {});

    if (dataJson.error) throw new Error("Myfxbook data fetch failed: " + dataJson.message);

    // Filter and map data
    const sentiment = dataJson.symbols
      .filter((sym: any) => TRACKED_SYMBOLS.includes(sym.name))
      .map((sym: any) => ({
        pair: sym.name,
        long_percent: sym.longPercentage,
        short_percent: sym.shortPercentage,
        long_positions: sym.longPositions,
        short_positions: sym.shortPositions,
        avg_long_price: sym.avgLongPrice || null,
        avg_short_price: sym.avgShortPrice || null,
      }));

    return sentiment;

  } catch (error) {
    console.error("Sentiment fetcher error:", error);
    throw error;
  }
}
