const normalizations: { [key: string]: string } = {
  'BTC': 'XXBT', // Kraken uses XXBT for Bitcoin
  'BITCOIN': 'XXBT',
  'ETH': 'XETH', // Kraken uses XETH for Ethereum
  'ETHEREUM': 'XETH',
  'XRP': 'XXRP', // Kraken uses XXRP for Ripple
  'RIPPLE': 'XXRP',
  'LTC': 'XLTC', // Kraken uses XLTC for Litecoin
  'LITECOIN': 'XLTC',
  'USD': 'ZUSD' // Kraken uses ZUSD for USD
};

export const normalizeCurrency = (currency: string): string => {
  return normalizations[currency.toUpperCase()] || currency.toUpperCase();
};

export const parsePair = (pair: string): [string, string] => {
  // Handle different pair formats
  if (pair.includes('/')) {
    const [base, quote] = pair.split('/');
    return [normalizeCurrency(base), normalizeCurrency(quote)];
  }

  // Handle Kraken format (e.g., XBTUSD, ETHUSD)
  if (pair === 'XBTUSD') return ['XXBT', 'ZUSD'];
  if (pair === 'ETHUSD') return ['XETH', 'ZUSD'];
  if (pair === 'XRPUSD') return ['XXRP', 'ZUSD'];
  if (pair === 'LTCUSD') return ['XLTC', 'ZUSD'];
  if (pair === 'ADAUSD') return ['ADA', 'ZUSD'];
  if (pair === 'DOTUSD') return ['DOT', 'ZUSD'];

  // Default fallback
  if (pair.endsWith('USD')) {
    const base = pair.slice(0, -3);
    return [normalizeCurrency(base), 'ZUSD'];
  }

  return [pair, 'ZUSD'];
};

export const toKrakenPair = (pair: string): string => {
    if (!pair.includes('/')) {
        return pair.toUpperCase(); // Already in a non-slashed format
    }
    const [base, quote] = pair.split('/');
    let krakenBase = base.toUpperCase();
    if (krakenBase === 'BTC') krakenBase = 'XBT';

    return `${krakenBase}${quote.toUpperCase()}`;
}

export const fromKrakenPair = (krakenPair: string): string => {
    if (krakenPair.includes('/')) {
        return krakenPair; // Already in slashed format
    }

    let base = krakenPair.slice(0, -3);
    const quote = krakenPair.slice(-3);

    if (base === 'XBT') base = 'BTC';

    return `${base}/${quote}`;
}
