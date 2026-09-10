"""deduplicate and enforce master-data codes

Revision ID: 002_unique_master_codes
Revises: 001_initial_erp
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_unique_master_codes"
down_revision: Union[str, Sequence[str], None] = "001_initial_erp"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Keep the oldest row for each external master-data code and remove
    # accidental duplicates created before the database uniqueness guard.
    bind.execute(sa.text("""
        DELETE FROM customers
        WHERE customer_id NOT IN (
            SELECT MIN(customer_id)
            FROM customers
            WHERE customer_code IS NOT NULL
            GROUP BY customer_code
        )
        AND customer_code IS NOT NULL
    """))
    bind.execute(sa.text("""
        DELETE FROM products
        WHERE product_id NOT IN (
            SELECT MIN(product_id)
            FROM products
            WHERE product_code IS NOT NULL
            GROUP BY product_code
        )
        AND product_code IS NOT NULL
    """))

    # Unique indexes are portable across the supported SQLite/PostgreSQL
    # development/deployment databases and enforce the same invariant.
    op.create_index("ux_customers_customer_code", "customers", ["customer_code"], unique=True)
    op.create_index("ux_products_product_code", "products", ["product_code"], unique=True)


def downgrade() -> None:
    op.drop_index("ux_products_product_code", table_name="products")
    op.drop_index("ux_customers_customer_code", table_name="customers")
