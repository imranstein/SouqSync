"""Product repository — async CRUD with filtering."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select, update

from app.models.product import Product

if TYPE_CHECKING:
    import uuid
    from decimal import Decimal

    from sqlalchemy.ext.asyncio import AsyncSession


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_products(
        self,
        *,
        distributor_id: uuid.UUID | None = None,
        category: str | None = None,
        search: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Product], int]:
        base = select(Product).where(Product.is_active.is_(True))

        if distributor_id is not None:
            base = base.where(Product.distributor_id == distributor_id)
        if category is not None:
            base = base.where(Product.category == category)
        if search is not None:
            base = base.where(Product.name.ilike(f"%{search}%"))

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        offset = (page - 1) * per_page
        rows_stmt = base.order_by(Product.created_at.desc()).offset(offset).limit(per_page)
        rows = (await self._session.execute(rows_stmt)).scalars().all()

        return list(rows), total

    async def get_product(self, product_id: uuid.UUID) -> Product | None:
        return await self._session.get(Product, product_id)

    async def create_product(
        self,
        *,
        name: str,
        price: Decimal,
        distributor_id: uuid.UUID,
        category: str | None = None,
        sku: str | None = None,
    ) -> Product:
        product = Product(
            name=name,
            price=price,
            category=category,
            distributor_id=distributor_id,
            sku=sku,
        )
        self._session.add(product)
        await self._session.flush()
        await self._session.refresh(product)
        return product

    async def update_product(
        self,
        product_id: uuid.UUID,
        data: dict,
    ) -> Product | None:
        product = await self.get_product(product_id)
        if product is None:
            return None
        for key, value in data.items():
            setattr(product, key, value)
        await self._session.flush()
        await self._session.refresh(product)
        return product

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        """Soft-delete: set is_active=False."""
        stmt = (
            update(Product)
            .where(Product.id == product_id, Product.is_active.is_(True))
            .values(is_active=False)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0  # type: ignore[return-value]
