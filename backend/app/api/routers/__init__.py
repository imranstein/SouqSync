"""Router aggregation."""

from fastapi import APIRouter

from app.api.routers.auth import router as auth_router
from app.api.routers.credit import router as credit_router
from app.api.routers.currencies import router as currencies_router
from app.api.routers.health import router as health_router
from app.api.routers.languages import router as languages_router
from app.api.routers.orders import router as orders_router
from app.api.routers.products import router as products_router
from app.api.routers.settings import router as settings_router
from app.api.routers.tenants import router as tenants_router
from app.api.routers.translations import router as translations_router
from app.api.routers.users import router as users_router
from app.api.routers.webhooks import router as webhooks_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(credit_router, prefix="/credit", tags=["credit"])
api_router.include_router(languages_router, prefix="/languages", tags=["languages"])
api_router.include_router(translations_router, prefix="/translations", tags=["translations"])
api_router.include_router(currencies_router, prefix="/currencies", tags=["currencies"])
api_router.include_router(tenants_router, prefix="/tenants", tags=["tenants"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
