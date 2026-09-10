# Data Migration Status

## Entities & Classification

Based on `backend/prisma/schema.prisma`.

| Model | Source | Status | Action Required |
|-------|--------|--------|------------------|
| `User` | PostgreSQL | HAS_PRODUCTION_DATA | Migrate carefully. Retain valid users, purge Triveni-specific test accounts. |
| `Admin` | PostgreSQL | HAS_PRODUCTION_DATA | Update admin credentials/roles for Bombay Bag House staff. |
| `Product` | PostgreSQL | HAS_PRODUCTION_DATA | **CRITICAL**: Purge all jewellery items. Update schema to remove jewellery fields and add bag fields. |
| `Category` | PostgreSQL | HAS_PRODUCTION_DATA | Purge jewellery categories (Necklaces, Rings). Seed bag categories (Backpacks, Totes, Duffles). |
| `Order` | PostgreSQL | HAS_PRODUCTION_DATA | Archive or isolate legacy Triveni orders. Do not display them on BBH frontend. |
| `CartItem` | PostgreSQL | HAS_PRODUCTION_DATA | Purge old cart items containing deleted products. |
| `BusinessConfig` | PostgreSQL | HAS_SEED_DATA | Update GSTIN, Name, and Invoice prefix to Bombay Bag House. |
| `Tenant` | PostgreSQL | SCHEMA_ONLY | Ensure multitenancy config is set correctly if isolating DB. |
| `Invoice` | PostgreSQL | HAS_PRODUCTION_DATA | Maintain legal compliance; do not alter historical invoice records, but isolate them. |

## Data Safety Rules

1. **Never overwrite existing target customer data**: If a user exists in both legacy and new domains, carefully merge or preserve authentication states.
2. **Seed data should be clearly flagged**: Any dummy products (e.g., "Test Bag") used for UI validation must have an `isTest: true` or similar tag, or be removed prior to production.
3. **Triveni production data must NOT appear in Bombay Bag House**: 
   - Strict filtering must be applied (or a clean database used) so no "1 Gram Gold Chain" appears in the Bombay Bag House search results.
   - Legacy orders must not skew the order analytics for the new brand.
   - A database hard-fork (new Postgres instance) is highly recommended over a soft-delete migration.
