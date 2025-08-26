from fastapi import APIRouter, HTTPException
from ..exchanges.ccxt_manager import ccxt_manager

router = APIRouter()

@router.get("/status")
async def get_exchange_status():
    """Returns the connection status of all configured exchanges."""
    return await ccxt_manager.get_connection_status()


@router.get("/{exchange_id}/markets")
async def get_markets(exchange_id: str):
    """Returns a list of available markets for the given exchange."""
    markets = await ccxt_manager.get_markets(exchange_id)
    if not markets:
        raise HTTPException(status_code=404, detail=f"Could not fetch markets for {exchange_id} or exchange not found.")
    return markets


@router.get("/{exchange_id}/ohlcv")
async def get_ohlcv(exchange_id: str, symbol: str, timeframe: str = '1d', limit: int = 100):
    """Returns OHLCV data for a given symbol."""
    ohlcv = await ccxt_manager.get_ohlcv(exchange_id, symbol, timeframe, limit)
    if not ohlcv:
        raise HTTPException(status_code=404, detail=f"Could not fetch OHLCV for {symbol} on {exchange_id}.")
    return ohlcv

from pydantic import BaseModel

class OrderPayload(BaseModel):
    symbol: str
    type: str
    side: str
    amount: float
    price: float = None

@router.get("/{exchange_id}/balance")
async def get_balance(exchange_id: str):
    """Returns the account balance for the given exchange."""
    balance = await ccxt_manager.get_balance(exchange_id)
    if not balance:
        raise HTTPException(status_code=404, detail=f"Could not fetch balance for {exchange_id} or exchange not found.")
    return balance

@router.post("/{exchange_id}/order")
async def place_order(exchange_id: str, order: OrderPayload):
    """Places an order on the given exchange."""
    result = await ccxt_manager.place_order(exchange_id, order.symbol, order.type, order.side, order.amount, order.price)
    if not result:
        raise HTTPException(status_code=500, detail=f"Failed to place order on {exchange_id}.")
    return result
