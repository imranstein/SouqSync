"""Seed script — populate database with sample data for development."""

from __future__ import annotations

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

# Ensure the backend root is importable when run as a script.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import async_session_factory, engine
from app.models.base import Base
from app.models.credit_profile import CreditProfile
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole

PRODUCTS: list[dict[str, object]] = [
    # ── Beverages ──
    {"name": "Coca-Cola 300ml", "sku": "BEV-001", "price": Decimal("25.00"), "category": "beverages"},
    {"name": "Pepsi 300ml", "sku": "BEV-002", "price": Decimal("25.00"), "category": "beverages"},
    {"name": "Ambo Mineral Water 500ml", "sku": "BEV-003", "price": Decimal("15.00"), "category": "beverages"},
    {"name": "Mirinda Orange 300ml", "sku": "BEV-004", "price": Decimal("25.00"), "category": "beverages"},
    {"name": "St. George Beer 330ml", "sku": "BEV-005", "price": Decimal("45.00"), "category": "beverages"},
    {"name": "Habesha Beer 330ml", "sku": "BEV-006", "price": Decimal("50.00"), "category": "beverages"},
    # ── Snacks ──
    {"name": "Kolo (Roasted Barley) 200g", "sku": "SNK-001", "price": Decimal("30.00"), "category": "snacks"},
    {"name": "Dabo Kolo 150g", "sku": "SNK-002", "price": Decimal("20.00"), "category": "snacks"},
    {"name": "Biscuit Assorted Pack", "sku": "SNK-003", "price": Decimal("35.00"), "category": "snacks"},
    {"name": "Popcorn 100g", "sku": "SNK-004", "price": Decimal("15.00"), "category": "snacks"},
    {"name": "Peanuts Salted 200g", "sku": "SNK-005", "price": Decimal("40.00"), "category": "snacks"},
    # ── Household ──
    {"name": "Omo Detergent 500g", "sku": "HH-001", "price": Decimal("85.00"), "category": "household"},
    {"name": "Blen Bleach 1L", "sku": "HH-002", "price": Decimal("55.00"), "category": "household"},
    {"name": "Candle Pack (6pcs)", "sku": "HH-003", "price": Decimal("30.00"), "category": "household"},
    {"name": "Matchbox (10 pack)", "sku": "HH-004", "price": Decimal("20.00"), "category": "household"},
    {"name": "Cooking Oil 1L", "sku": "HH-005", "price": Decimal("180.00"), "category": "household"},
    {"name": "Sugar 1kg", "sku": "HH-006", "price": Decimal("90.00"), "category": "household"},
    # ── Personal Care ──
    {"name": "Lifebuoy Soap 100g", "sku": "PC-001", "price": Decimal("35.00"), "category": "personal_care"},
    {"name": "Colgate Toothpaste 75ml", "sku": "PC-002", "price": Decimal("60.00"), "category": "personal_care"},
    {"name": "Vaseline Lotion 200ml", "sku": "PC-003", "price": Decimal("120.00"), "category": "personal_care"},
    {"name": "Hair Oil 100ml", "sku": "PC-004", "price": Decimal("45.00"), "category": "personal_care"},
    {"name": "Sanitary Pads (8 pack)", "sku": "PC-005", "price": Decimal("70.00"), "category": "personal_care"},
    # ── Grains ──
    {"name": "Teff Flour 1kg", "sku": "GR-001", "price": Decimal("120.00"), "category": "grains"},
    {"name": "White Wheat Flour 1kg", "sku": "GR-002", "price": Decimal("75.00"), "category": "grains"},
    {"name": "Shiro Powder 500g", "sku": "GR-003", "price": Decimal("80.00"), "category": "grains"},
    {"name": "Lentils (Misir) 1kg", "sku": "GR-004", "price": Decimal("110.00"), "category": "grains"},
    {"name": "Rice 1kg", "sku": "GR-005", "price": Decimal("95.00"), "category": "grains"},
    {"name": "Berbere Spice 250g", "sku": "GR-006", "price": Decimal("65.00"), "category": "grains"},
]


async def seed(session: AsyncSession) -> None:
    """Insert sample data. Skips if distributor phone already exists."""
    existing = await session.execute(
        select(User).where(User.phone == "+251911000001")
    )
    if existing.scalar_one_or_none() is not None:
        print("Seed data already exists — skipping.")
        return

    # ── Users ──
    distributor = User(
        phone="+251911000001",
        name="Abebe Distributors",
        role=UserRole.DISTRIBUTOR,
        language_pref="am",
        is_active=True,
    )
    session.add(distributor)
    await session.flush()

    kiosk_owner = User(
        phone="+251911000002",
        name="Fatuma's Kiosk",
        role=UserRole.KIOSK_OWNER,
        language_pref="am",
        distributor_id=distributor.id,
        is_active=True,
    )
    session.add(kiosk_owner)
    await session.flush()

    # ── Products ──
    product_objs: list[Product] = []
    for p in PRODUCTS:
        prod = Product(
            name=str(p["name"]),
            sku=str(p["sku"]),
            price=p["price"],  # type: ignore[arg-type]
            category=str(p["category"]),
            distributor_id=distributor.id,
        )
        session.add(prod)
        product_objs.append(prod)
    await session.flush()

    # ── Sample Order (3 items) ──
    items_data = [
        (product_objs[0], 10),   # Coca-Cola x10
        (product_objs[12], 5),   # Omo Detergent x5
        (product_objs[22], 3),   # Teff Flour x3
    ]
    total = sum(p.price * qty for p, qty in items_data)

    order = Order(
        user_id=kiosk_owner.id,
        distributor_id=distributor.id,
        status=OrderStatus.PENDING,
        total=total,
        delivery_fee=Decimal("50.00"),
        payment_method="cash",
        notes="First sample order",
    )
    session.add(order)
    await session.flush()

    for product, qty in items_data:
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price,
        )
        session.add(item)

    # ── Credit Profile ──
    credit = CreditProfile(
        user_id=kiosk_owner.id,
        credit_limit=Decimal("5000.00"),
        current_balance=Decimal("0.00"),
        is_active=True,
    )
    session.add(credit)

    await session.commit()
    print(f"Seeded: 2 users, {len(product_objs)} products, 1 order (3 items), 1 credit profile")


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
