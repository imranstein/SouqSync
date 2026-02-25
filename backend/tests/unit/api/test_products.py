"""Unit tests for Products CRUD endpoints."""

from __future__ import annotations

import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.security import create_access_token
from app.main import app
from app.models.product import Product
from app.models.user import User, UserRole
from httpx import ASGITransport, AsyncClient


def _make_token(role: str = "distributor", user_id: uuid.UUID | None = None) -> str:
    uid = user_id or uuid.uuid4()
    return create_access_token(str(uid), extra={"role": role})


def _make_product(**overrides) -> MagicMock:
    defaults = dict(
        id=uuid.uuid4(),
        name="Test Product",
        sku="SKU-001",
        price=Decimal("25.50"),
        category="beverages",
        distributor_id=uuid.uuid4(),
        is_active=True,
        created_at="2025-01-01T00:00:00+00:00",
        updated_at="2025-01-01T00:00:00+00:00",
    )
    defaults.update(overrides)
    product = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(product, k, v)
    return product


def _make_user(role: UserRole = UserRole.DISTRIBUTOR) -> MagicMock:
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.phone = "+251900000000"
    user.role = role
    user.is_active = True
    return user


PREFIX = "/api/v1/products"


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _setup_auth(user: MagicMock) -> dict[str, str]:
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()

    from app.api.deps import get_current_user, get_db

    async def _fake_current_user():
        return user

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_db] = _fake_db

    token = _make_token(user.role.value, user.id)
    return {"Authorization": f"Bearer {token}"}


async def test_list_products() -> None:
    product = _make_product()
    mock_db = AsyncMock()

    from app.api.deps import get_db

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch("app.repositories.product_repo.ProductRepository.list_products", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = ([product], 1)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(PREFIX)

    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "Test Product"


async def test_get_product() -> None:
    product = _make_product()
    mock_db = AsyncMock()

    from app.api.deps import get_db

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch("app.repositories.product_repo.ProductRepository.get_product", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = product
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(f"{PREFIX}/{product.id}")

    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Product"


async def test_get_product_not_found() -> None:
    mock_db = AsyncMock()

    from app.api.deps import get_db

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch("app.repositories.product_repo.ProductRepository.get_product", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(f"{PREFIX}/{uuid.uuid4()}")

    assert resp.status_code == 404


async def test_create_product_requires_auth() -> None:
    payload = {
        "name": "Test",
        "price": "10.00",
        "category": "food",
        "distributor_id": str(uuid.uuid4()),
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(PREFIX, json=payload)
    assert resp.status_code in (401, 403)


async def test_create_product() -> None:
    product = _make_product()
    user = _make_user()
    headers = _setup_auth(user)

    with patch("app.repositories.product_repo.ProductRepository.create_product", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = product
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "name": "Test Product",
                "price": "25.50",
                "category": "beverages",
                "distributor_id": str(uuid.uuid4()),
            }
            resp = await ac.post(PREFIX, json=payload, headers=headers)

    assert resp.status_code == 201
    assert resp.json()["name"] == "Test Product"


async def test_update_product() -> None:
    product = _make_product(name="Updated")
    user = _make_user()
    headers = _setup_auth(user)

    with patch("app.repositories.product_repo.ProductRepository.update_product", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = product
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put(
                f"{PREFIX}/{product.id}",
                json={"name": "Updated"},
                headers=headers,
            )

    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


async def test_delete_product() -> None:
    pid = uuid.uuid4()
    user = _make_user()
    headers = _setup_auth(user)

    with patch("app.repositories.product_repo.ProductRepository.delete_product", new_callable=AsyncMock) as mock_del:
        mock_del.return_value = True
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.delete(f"{PREFIX}/{pid}", headers=headers)

    assert resp.status_code == 204
