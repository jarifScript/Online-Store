from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import create_client
from slowapi import Limiter
from slowapi.util import get_remote_address

# Countries buyers can ship to. To change, add SHIPPING_COUNTRIES=US,CA,... to your .env
DEFAULT_COUNTRIES = (
    "US,CA,GB,AU,NZ,IE,DE,FR,ES,IT,NL,BE,AT,CH,SE,NO,DK,FI,PT,PL,CZ,GR,HU,RO,BG,HR,SK,SI,"
    "LT,LV,EE,LU,MT,CY,IS,JP,KR,SG,HK,MY,TH,PH,ID,IN,BD,PK,LK,NP,AE,SA,QA,KW,BH,OM,IL,TR,"
    "EG,ZA,NG,KE,MX,BR,AR,CL,CO,PE"
)


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    frontend_url: str = "http://localhost:5173"
    extra_origins: str = ""
    shipping_countries: str = DEFAULT_COUNTRIES

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def allowed_origins(self) -> list[str]:
        extra = [o.strip() for o in self.extra_origins.split(",") if o.strip()]
        return [self.frontend_url, *extra]

    @property
    def country_list(self) -> list[str]:
        return [c.strip().upper() for c in self.shipping_countries.split(",") if c.strip()]


settings = Settings()

# Backend-only database client (bypasses RLS, so never expose this key)
supabase = create_client(settings.supabase_url, settings.supabase_service_key)

# Rate limiter (blocks spam / brute-force)
limiter = Limiter(key_func=get_remote_address)