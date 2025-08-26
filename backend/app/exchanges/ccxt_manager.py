import ccxt.async_support as ccxt
from typing import Dict, List
from ..config import settings

class CCXTManager:
    def __init__(self):
        self.exchanges: Dict[str, ccxt.Exchange] = {}
        self._initialize_exchanges()

    def _initialize_exchanges(self):
        """Initializes all supported exchanges."""
        exchange_configs = {
            'kraken': {
                'apiKey': settings.KRAKEN_API_KEY,
                'secret': settings.KRAKEN_SECRET,
            },
            'coinbase': {
                'apiKey': settings.COINBASE_API_KEY,
                'secret': settings.COINBASE_SECRET,
            },
            'kucoin': {
                'apiKey': settings.KUCOIN_API_KEY,
                'secret': settings.KUCOIN_SECRET,
                'password': settings.KUCOIN_PASSWORD,
            },
            'bitfinex': {
                'apiKey': settings.BITFINEX_API_KEY,
                'secret': settings.BITFINEX_SECRET,
            }
        }

        for exchange_id, config in exchange_configs.items():
            if config.get('apiKey') and config.get('secret'):
                try:
                    exchange_class = getattr(ccxt, exchange_id)
                    self.exchanges[exchange_id] = exchange_class(config)
                except AttributeError:
                    print(f"Error: Exchange {exchange_id} not found in ccxt.")
                except Exception as e:
                    print(f"Error initializing exchange {exchange_id}: {e}")

    async def close_all(self):
        """Closes all open exchange connections."""
        for exchange in self.exchanges.values():
            if exchange.session:
                await exchange.close()

    async def get_connection_status(self) -> Dict[str, bool]:
        """Checks the connection status of each initialized exchange."""
        status = {}
        for exchange_id, exchange in self.exchanges.items():
            try:
                # Test connection by fetching markets
                await exchange.load_markets()
                status[exchange_id] = True
            except Exception as e:
                print(f"Failed to connect to {exchange_id}: {e}")
                status[exchange_id] = False
        return status

    async def get_markets(self, exchange_id: str) -> List[str]:
        """Fetches the list of available markets for a given exchange."""
        if exchange_id not in self.exchanges:
            return []
        exchange = self.exchanges[exchange_id]
        try:
            markets = await exchange.load_markets()
            return list(markets.keys())
        except Exception as e:
            print(f"Error fetching markets for {exchange_id}: {e}")
            return []

    async def get_ohlcv(self, exchange_id: str, symbol: str, timeframe: str = '1d', limit: int = 100) -> List:
        """Fetches OHLCV data for a given symbol and timeframe."""
        if exchange_id not in self.exchanges:
            return []
        exchange = self.exchanges[exchange_id]
        if not exchange.has['fetchOHLCV']:
            return []
        try:
            ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            return ohlcv
        except Exception as e:
            print(f"Error fetching OHLCV for {symbol} on {exchange_id}: {e}")
            return []

    async def get_balance(self, exchange_id: str) -> Dict:
        """Fetches the account balance from a given exchange."""
        if exchange_id not in self.exchanges:
            return {}
        exchange = self.exchanges[exchange_id]
        if not exchange.has['fetchBalance']:
            return {}
        try:
            balance = await exchange.fetch_balance()
            return balance['total']
        except Exception as e:
            print(f"Error fetching balance for {exchange_id}: {e}")
            return {}

    async def place_order(self, exchange_id: str, symbol: str, type: str, side: str, amount: float, price: float = None):
        """Places an order on a given exchange."""
        if exchange_id not in self.exchanges:
            return None
        exchange = self.exchanges[exchange_id]
        if not exchange.has['createOrder']:
            return None
        try:
            params = {}
            if price:
                params['price'] = price
            order = await exchange.create_order(symbol, type, side, amount, params)
            return order
        except Exception as e:
            print(f"Error placing order on {exchange_id}: {e}")
            return None

# Create a single instance of the manager to be used across the application
ccxt_manager = CCXTManager()
