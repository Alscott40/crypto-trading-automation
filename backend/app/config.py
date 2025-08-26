from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_PASSWORD: str = ""
    KRAKEN_API_KEY: str = ""
    KRAKEN_SECRET: str = ""
    COINBASE_API_KEY: str = ""
    COINBASE_SECRET: str = ""
    KUCOIN_API_KEY: str = ""
    KUCOIN_SECRET: str = ""
    KUCOIN_PASSWORD: str = ""
    BITFINEX_API_KEY: str = ""
    BITFINEX_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
