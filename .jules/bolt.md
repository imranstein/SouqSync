## 2024-05-23 - SQLAlchemy Count Optimization
**Learning:** `select(func.count()).select_from(base.subquery())` is inefficient because `base.subquery()` selects all columns from the table, forcing the database to materialize them (or rely on optimizer to remove them).
**Action:** Always construct a direct count query: `select(func.count()).select_from(Table).where(*clauses)` by sharing the `where` clauses list between the count and rows queries.
