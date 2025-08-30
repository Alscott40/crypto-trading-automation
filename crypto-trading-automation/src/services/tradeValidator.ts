import { normalizeCurrency, parsePair } from "@/lib/pairManager";

export interface TradeValidationResult {
  isValid: boolean;
  error?: string;
  adjustedAmount?: number;
  requiredBalance?: number;
  availableBalance?: number;
}

export interface TradeRequest {
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
}

export class TradeValidator {
  private balances: { [currency: string]: string };
  private minOrderSizes: { [pair: string]: number };
  private maxOrderSizes: { [pair: string]: number };
  private cryptoPrices: { [currency: string]: number };

  constructor(balances: { [currency: string]: string }, cryptoPrices?: { [currency: string]: number }) {
    this.balances = balances;
    this.cryptoPrices = cryptoPrices || {
      'XBT': 45000, 'XXBT': 45000,
      'ETH': 2500, 'XETH': 2500,
      'XRP': 0.6, 'XXRP': 0.6,
      'LTC': 100, 'XLTC': 100,
      'ADA': 0.5, 'DOT': 7,
      'USD': 1, 'ZUSD': 1
    };

    // Minimum order sizes for different pairs
    this.minOrderSizes = {
      'BTC/USD': 0.0001,
      'ETH/USD': 0.001,
      'XRP/USD': 1,
      'LTC/USD': 0.01,
      'ADA/USD': 10,
      'DOT/USD': 0.1,
      'XBTUSD': 0.0001,
      'ETHUSD': 0.001,
      'XRPUSD': 1,
      'LTCUSD': 0.01,
      'ADAUSD': 10,
      'DOTUSD': 0.1
    };

    // Maximum order sizes (as percentage of balance)
    this.maxOrderSizes = {
      'BTC/USD': 0.9,
      'ETH/USD': 0.9,
      'XRP/USD': 0.9,
      'LTC/USD': 0.9,
      'ADA/USD': 0.9,
      'DOT/USD': 0.9,
      'XBTUSD': 0.9,
      'ETHUSD': 0.9,
      'XRPUSD': 0.9,
      'LTCUSD': 0.9,
      'ADAUSD': 0.9,
      'DOTUSD': 0.9
    };
  }

  validateTrade(trade: TradeRequest): TradeValidationResult {
    const { pair, side, amount, price } = trade;

    // Check if amount is positive
    if (amount <= 0) {
      return {
        isValid: false,
        error: 'Trade amount must be positive'
      };
    }

    // Check minimum order size
    const minSize = this.minOrderSizes[pair] || 0.0001;
    if (amount < minSize) {
      return {
        isValid: false,
        error: `Order size ${amount} is below minimum ${minSize} for ${pair}`,
        adjustedAmount: minSize
      };
    }

    // Get currency from pair
    const [baseCurrency, quoteCurrency] = parsePair(pair);
    const maxSizePercentage = this.maxOrderSizes[pair] || 0.9;

    if (side === 'buy') {
      const estimatedCost = price ? amount * price : amount * this.getEstimatedPrice(baseCurrency);
      const usdBalance = this.getAvailableBalance('USD');

      // Check max order size based on USD balance
      const maxBuyCost = usdBalance * maxSizePercentage;
      if (estimatedCost > maxBuyCost) {
        const adjustedAmount = (maxBuyCost / (price || this.getEstimatedPrice(baseCurrency))) * 0.98; // Use 98% to be safe
        return {
          isValid: false,
          error: `Cost $${estimatedCost.toFixed(2)} exceeds max ${maxSizePercentage*100}% of USD balance ($${maxBuyCost.toFixed(2)})`,
          adjustedAmount: adjustedAmount > minSize ? adjustedAmount : undefined,
        };
      }

      // For buy orders, check if we have enough quote currency (USD) or equivalent value in crypto
      const totalUsdValue = this.getTotalPortfolioValueInUsd();
      if (totalUsdValue < estimatedCost) {
        return {
          isValid: false,
          error: `Insufficient portfolio value. Required: $${estimatedCost.toFixed(2)}, Available: $${totalUsdValue.toFixed(2)}`,
          requiredBalance: estimatedCost,
          availableBalance: totalUsdValue
        };
      }

      // Check if we have direct USD balance
      if (usdBalance < estimatedCost) {
        return {
          isValid: false,
          error: `Insufficient USD balance. Required: $${estimatedCost.toFixed(2)}, Available: $${usdBalance.toFixed(2)}`,
          requiredBalance: estimatedCost,
          availableBalance: usdBalance
        };
      }
    } else {
      // For sell orders, check base currency balance
      const baseBalance = this.getAvailableBalance(baseCurrency);

      // Check max order size
      const maxSellAmount = baseBalance * maxSizePercentage;
      if (amount > maxSellAmount) {
        return {
          isValid: false,
          error: `Order size ${amount} exceeds maximum of ${maxSellAmount.toFixed(6)} (${maxSizePercentage * 100}% of balance)`,
          adjustedAmount: maxSellAmount > minSize ? maxSellAmount : minSize
        };
      }

      if (baseBalance < amount) {
        const adjustedAmount = Math.max(baseBalance * 0.95, minSize); // Leave 5% buffer

        if (adjustedAmount < minSize) {
          return {
            isValid: false,
            error: `Insufficient ${baseCurrency} balance. Required: ${amount}, Available: ${baseBalance}`,
            requiredBalance: amount,
            availableBalance: baseBalance
          };
        }

        return {
          isValid: false,
          error: `Insufficient ${baseCurrency} balance. Adjusting amount to ${adjustedAmount.toFixed(6)}`,
          adjustedAmount,
          requiredBalance: amount,
          availableBalance: baseBalance
        };
      }
    }

    return {
      isValid: true
    };
  }

  private getTotalPortfolioValueInUsd(): number {
    let totalValue = 0;

    Object.entries(this.balances).forEach(([currency, balance]) => {
      const numBalance = parseFloat(balance);
      if (numBalance > 0) {
        const price = this.cryptoPrices[currency] || 1;
        totalValue += numBalance * price;
      }
    });

    return totalValue;
  }

  private getEstimatedPrice(currency: string): number {
    const normalizedCurrency = normalizeCurrency(currency);
    return this.cryptoPrices[normalizedCurrency] || this.cryptoPrices[currency] || 1;
  }

  getMinOrderSize(pair: string): number {
    return this.minOrderSizes[pair] || 0.0001;
  }

  getAvailableBalance(currency: string): number {
    const normalizedCurrency = normalizeCurrency(currency);
    return parseFloat(this.balances[normalizedCurrency] || this.balances[currency] || '0');
  }

  getBalanceSummary(): { [currency: string]: number } {
    const summary: { [currency: string]: number } = {};

    for (const [currency, balance] of Object.entries(this.balances)) {
      const numBalance = parseFloat(balance);
      if (numBalance > 0) {
        summary[currency] = numBalance;
      }
    }

    return summary;
  }

  getPortfolioSummary(): { [currency: string]: { balance: number; usdValue: number } } {
    const summary: { [currency: string]: { balance: number; usdValue: number } } = {};

    for (const [currency, balance] of Object.entries(this.balances)) {
      const numBalance = parseFloat(balance);
      if (numBalance > 0) {
        const price = this.cryptoPrices[currency] || 1;
        summary[currency] = {
          balance: numBalance,
          usdValue: numBalance * price
        };
      }
    }

    return summary;
  }
}