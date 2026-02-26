# Bolt's Performance Journal

## 2026-02-26 - [N+1 Query Optimization in Product List]
**Learning:** SQLAlchemy `selectin` eager loading can cascade unexpectedly. Loading `Product` triggered loading `User` (distributor), which in turn triggered loading `User.orders` and other collections, resulting in 8 queries for a simple list.
**Action:** Always use `.options(noload(Relationship))` or `raiseload` in list endpoints to explicitly disable unnecessary eager loads, especially when models have `lazy="selectin"` configured by default. Also, avoid `select(func.count()).select_from(subquery)` for pagination counts; prefer reusing where clauses on a direct `select(func.count())` query.
