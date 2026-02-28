"""Translation model — key/value per language and optional tenant."""

from __future__ import annotations

import uuid  # noqa: TC003
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.language import Language
    from app.models.tenant import Tenant


class Translation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "translations"
    __table_args__ = (
        UniqueConstraint(
            "language_id",
            "tenant_id",
            "namespace",
            "key",
            name="uq_translations_lang_tenant_ns_key",
        ),
    )

    language_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("languages.id", ondelete="CASCADE"),
        nullable=False,
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
    )
    namespace: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    language: Mapped[Language] = relationship(
        "Language",
        back_populates="translations",
        lazy="selectin",
    )
    tenant: Mapped[Tenant | None] = relationship(
        "Tenant",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Translation {self.namespace}.{self.key} ({self.language_id})>"
