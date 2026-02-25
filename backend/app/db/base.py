"""Import all models here so Alembic can discover them."""

from app.models.base import Base  # noqa: F401
from app.models.credit_profile import CreditProfile  # noqa: F401
from app.models.currency import Currency  # noqa: F401
from app.models.language import Language  # noqa: F401
from app.models.order import Order, OrderItem  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.setting import Setting  # noqa: F401
from app.models.tenant import Tenant  # noqa: F401
from app.models.translation import Translation  # noqa: F401
from app.models.user import User  # noqa: F401
