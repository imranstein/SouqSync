"""Unit tests for Orders API endpoints."""

from __future__ import annotations

import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.exceptions import ValidationError
from app.core.security import create_access_token
from app.main import app
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole


def _make_token(role: str = "kiosk_owner", user_id: uuid.UUID | None = None) -> str:
    uid = user_id or uuid.uuid4()
    return create_access_token(str(uid), extra={"role": role})


def _make_user(role: UserRole = UserRole.KIOSK_OWNER) -> MagicMock:
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.phone = "+251900000000"
    user.role = role
    user.is_active = True
    return user


def _make_product(**overrides) -> MagicMock:
    defaults = dict(
        id=uuid.uuid4(),
        name="Widget",
        sku="W-001",
        price=Decimal("10.00"),
        category="hardware",
        distributor_id=uuid.uuid4(),
        is_active=True,
    )
    defaults.update(overrides)
    product = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(product, k, v)
    return product


def _make_order_item(product: MagicMock | None = None, **overrides) -> MagicMock:
    prod = product or _make_product()
    defaults = dict(
        id=uuid.uuid4(),
        product_id=prod.id,
        product=prod,
        quantity=2,
        unit_price=Decimal("10.00"),
    )
    defaults.update(overrides)
    item = MagicMock(spec=OrderItem)
    for k, v in defaults.items():
        setattr(item, k, v)
    return item


def _make_order(**overrides) -> MagicMock:
    item = _make_order_item()
    defaults = dict(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        distributor_id=uuid.uuid4(),
        status=OrderStatus.PENDING,
        total=Decimal("20.00"),
        delivery_fee=Decimal("0.00"),
        payment_method=None,
        notes=None,
        items=[item],
        created_at="2025-01-01T00:00:00+00:00",
        updated_at="2025-01-01T00:00:00+00:00",
    )
    defaults.update(overrides)
    order = MagicMock(spec=Order)
    for k, v in defaults.items():
        setattr(order, k, v)
    return order


PREFIX = "/api/v1/orders"


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _setup_auth(user: MagicMock) -> tuple[dict[str, str], AsyncMock]:
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    from app.api.deps import get_current_user, get_db

    async def _fake_current_user():
        return user

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_db] = _fake_db

    token = _make_token(user.role.value, user.id)
    headers = {"Authorization": f"Bearer {token}"}
    return headers, mock_db


async def test_create_order() -> None:
    product = _make_product()
    order = _make_order()
    user = _make_user()
    headers, _ = _setup_auth(user)

    with (
        patch("app.repositories.product_repo.ProductRepository.get_product", new_callable=AsyncMock) as mock_get_prod,
        patch("app.repositories.order_repo.OrderRepository.create_order", new_callable=AsyncMock) as mock_create,
    ):
        mock_get_prod.return_value = product
        mock_create.return_value = order

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "items": [{"product_id": str(product.id), "quantity": 2}],
                "distributor_id": str(uuid.uuid4()),
            }
            resp = await ac.post(PREFIX, json=payload, headers=headers)

    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pending"


async def test_list_orders() -> None:
    order = _make_order()
    user = _make_user()
    headers, _ = _setup_auth(user)

    with patch("app.repositories.order_repo.OrderRepository.list_orders", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = ([order], 1)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(PREFIX, headers=headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


async def test_get_order() -> None:
    order = _make_order()
    user = _make_user()
    headers, _ = _setup_auth(user)

    with patch("app.repositories.order_repo.OrderRepository.get_order", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = order
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(f"{PREFIX}/{order.id}", headers=headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"


async def test_get_order_not_found() -> None:
    user = _make_user()
    headers, _ = _setup_auth(user)

    with patch("app.repositories.order_repo.OrderRepository.get_order", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(f"{PREFIX}/{uuid.uuid4()}", headers=headers)

    assert resp.status_code == 404


async def test_update_order_status() -> None:
    order = _make_order(status=OrderStatus.CONFIRMED)
    user = _make_user()
    headers, _ = _setup_auth(user)

    with patch(
        "app.repositories.order_repo.OrderRepository.update_order_status",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = order
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put(
                f"{PREFIX}/{order.id}/status",
                json={"status": "confirmed"},
                headers=headers,
            )

    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"


async def test_invalid_status_transition() -> None:
    user = _make_user()
    headers, _ = _setup_auth(user)

    with patch(
        "app.repositories.order_repo.OrderRepository.update_order_status",
        new_callable=AsyncMock,
        side_effect=ValidationError("Cannot transition from delivered to pending"),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put(
                f"{PREFIX}/{uuid.uuid4()}/status",
                json={"status": "pending"},
                headers=headers,
            )

    assert resp.status_code == 422
    assert "Cannot transition" in resp.json()["detail"]
